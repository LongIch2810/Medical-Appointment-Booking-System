import * as dotenv from "dotenv";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { AnalyzeRelativeTool } from "../tools/relative_analyzer.tool.js";
import { AnalyzeSpecialtyTool } from "../tools/specialty_name_analyzer.tool.js";
import { AnalyzeTimeTool } from "../tools/time_analyzer.tool.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import axios from "axios";
import httpClient from "../configs/httpClient.js";
import {
  APPOINTMENT_SLOT_UNAVAILABLE,
  type BookingFailure,
} from "../utils/bookingFailureMessage.js";
import { logSafeError } from "../utils/safeLog.js";

dotenv.config();

const mergedAnnotations = (oldObj: any, newObj: any) => ({
  ...oldObj,
  ...newObj,
});

const BookingState = Annotation.Root({
  text_input: Annotation<string>(),
  token: Annotation<string>(),

  // Danh sách chuyên khoa LLM chẩn đoán được từ triệu chứng, đã kèm sẵn id
  // thật (chọn từ danh sách chuyên khoa thật lấy từ backend — xem
  // AnalyzeSpecialtyTool), xếp theo mức độ phù hợp giảm dần.
  specialty_candidates: Annotation<{ id: number; name: string }[]>(),

  time: Annotation<{
    appointment_date: string;
    start_time: string;
    day_of_week: string;
    end_time: string;
  }>({ reducer: mergedAnnotations }),

  relatives: Annotation<
    { id: number; fullname: string; dob: string; gender: string }[]
  >({
    reducer: (oldArr, newArr) => {
      const merged = [...(oldArr || []), ...(newArr || [])];
      const unique = Array.from(
        new Map(merged.map((item) => [item.id, item])).values(),
      );
      return unique;
    },
  }),

  selected_relative_id: Annotation<number | null>({
    reducer: (_o, n) => n,
  }),

  ambiguous_relatives: Annotation<boolean>({
    reducer: (_o, n) => n,
  }),

  // Lỗi tra cứu (API) khi phân tích người thân/chuyên khoa — phân biệt với
  // trường hợp người dùng thật sự chưa cung cấp thông tin, để tránh trả lời
  // "thiếu thông tin" gây hiểu lầm khi thực chất là hệ thống đang gặp lỗi.
  relative_lookup_error: Annotation<boolean>({
    reducer: (_o, n) => n,
  }),

  // Khác với "chưa nói ai" (đã tự mặc định bản thân — xem analyzeRelativeNode):
  // người dùng CÓ nói rõ một mối quan hệ cụ thể (vd "con gái"), nhưng không
  // tìm thấy hồ sơ khớp nào đã đăng ký cho user này. Cần thông báo khác hẳn
  // "thiếu thông tin" vì thông tin đã được cung cấp đầy đủ.
  relative_not_found_label: Annotation<string | null>({
    reducer: (_o, n) => n,
  }),

  // Thông tin để tự tạo hồ sơ người thân mới (Relative + HealthProfile rỗng
  // đi kèm, xem RelativesService.findOrCreateForBooking ở backend) khi
  // relative_not_found_label được set — chỉ chứa những gì người dùng ĐÃ nói,
  // không bịa. fullname/dob/gender null nghĩa là còn thiếu, cần hỏi lại.
  new_relative_candidate: Annotation<{
    fullname: string | null;
    relationship_code: string;
    dob: string | null;
    gender: boolean | null;
  } | null>({
    reducer: (_o, n) => n,
  }),

  specialty_resolve_error: Annotation<boolean>({
    reducer: (_o, n) => n,
  }),

  ready: Annotation<boolean>({ reducer: (_o, n) => n }),

  missing: Annotation<string[]>({
    reducer: (a = [], b = []) =>
      Array.from(new Set([...(a || []), ...(b || [])])),
  }),

  selected_specialty_id: Annotation<number | null>({
    reducer: (_o, n) => n,
  }),

  booking_result: Annotation<any>({ reducer: (_o, n) => n }),

  // Tách riêng khỏi booking_result — booking_result CHỈ mang object dữ liệu
  // lịch hẹn khi đặt THÀNH CÔNG; mọi trường hợp thất bại (chưa đăng nhập,
  // lỗi nghiệp vụ từ backend như trùng lịch, lỗi không xác định) đi qua
  // field này để booking_appointment.tool.ts format văn phong nhất quán,
  // cùng pattern với relative_lookup_error/specialty_resolve_error.
  booking_error: Annotation<BookingFailure | null>({ reducer: (_o, n) => n }),
});

// Các node phân tích chạy song song (fan-out từ __start__) và hội tụ ở
// checker_node. Nếu một node throw (LLM lỗi/không kết nối được, SQL guard
// chặn câu lệnh...), toàn bộ bookingGraph.invoke() sẽ reject và cả phiên
// đặt lịch mất hết ngữ cảnh, chỉ còn lại thông báo lỗi chung chung ở tầng
// tool. Bọc riêng từng node để một tool lỗi chỉ làm phần thông tin đó bị
// coi là "thiếu" (đi qua checker_node như bình thường) thay vì sập cả graph.
async function runToolSafe<T extends DynamicStructuredTool>(
  tool: T,
  args: Record<string, any>,
  fallback: any,
  nodeName: string,
) {
  try {
    return await tool.invoke(args);
  } catch (error) {
    logSafeError(`[Node] ${nodeName} failed; using fallback`, error);
    return fallback;
  }
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  me: "mẹ",
  cha: "cha",
  con_gai: "con gái",
  con_trai: "con trai",
  vo_chong: "vợ/chồng",
  ong: "ông",
  ba: "bà",
  nguoi_than_khac: "người thân khác",
};

// Nhiều relationship_code đã tự ẩn chứa giới tính — dùng để khỏi phải hỏi lại
// người dùng những gì họ đã ngầm cung cấp qua cách xưng hô. Mã không nằm
// trong map (vo_chong, nguoi_than_khac) thực sự mơ hồ về giới tính, vẫn phải
// hỏi hoặc dựa vào LLM trích được gender rõ ràng từ text_input.
const GENDER_BY_RELATIONSHIP_CODE: Record<string, boolean> = {
  cha: true,
  ong: true,
  con_trai: true,
  me: false,
  ba: false,
  con_gai: false,
};

// 🧩 Node: Phân tích người thân
async function analyzeRelativeNode(state: typeof BookingState.State) {
  const res = await runToolSafe(
    AnalyzeRelativeTool as DynamicStructuredTool,
    { text_input: state.text_input, token: state.token },
    // lookup_error: true — một lỗi tool THẬT (không phải "chưa nói ai") phải
    // được checker_node/booking_failure_message phân biệt với trường hợp
    // người dùng chưa cung cấp thông tin, nếu không sẽ hiện nhầm thông báo
    // "thiếu thông tin" thay vì "hệ thống đang gặp lỗi tra cứu".
    { relatives: [], lookup_error: true },
    "analyze_relative_node",
  );

  const relatives = res?.relatives || [];
  const relationship_code: string | null = res?.relationship_code || null;
  const lookup_error = Boolean(res?.lookup_error);
  let selected_relative_id: number | null = null;

  if (relatives.length === 1) {
    selected_relative_id = relatives[0].id;
  }

  // Người dùng nói rõ một mối quan hệ CỤ THỂ (không phải mặc định ban_than)
  // nhưng tra cứu ra rỗng — nghĩa là hồ sơ đó chưa được đăng ký, khác hẳn
  // trường hợp "chưa nói ai" (luôn resolve được qua ban_than, xem
  // relative_analyzer.tool.ts).
  const relative_not_found_label =
    !selected_relative_id &&
    relatives.length === 0 &&
    !lookup_error &&
    relationship_code &&
    relationship_code !== "ban_than"
      ? RELATIONSHIP_LABELS[relationship_code] || relationship_code
      : null;

  // Chuẩn bị sẵn thông tin để tự tạo hồ sơ người thân mới nếu checker_node
  // xác nhận không tìm thấy hồ sơ nào — chỉ mang những gì đã trích được từ
  // hội thoại (không bịa); gender ưu tiên suy ra từ relationship_code (đã
  // ngầm chứa giới tính với cha/mẹ/ông/bà/con trai/con gái), nếu không suy ra
  // được mới dùng gender LLM trích trực tiếp từ text_input.
  const new_relative_candidate = relative_not_found_label
    ? {
        fullname: res?.name || null,
        relationship_code: relationship_code as string,
        dob: res?.dob || null,
        gender:
          GENDER_BY_RELATIONSHIP_CODE[relationship_code as string] ??
          res?.gender ??
          null,
      }
    : null;

  return {
    relatives,
    selected_relative_id,
    relative_lookup_error: lookup_error,
    relative_not_found_label,
    new_relative_candidate,
  };
}

// 🧩 Node: Phân tích chuyên khoa — LLM chẩn đoán trực tiếp ra chuyên khoa
// phù hợp (kèm sẵn id thật, xem AnalyzeSpecialtyTool), không cần bước resolve
// riêng nữa.
async function analyzeSpecialtyNode(state: typeof BookingState.State) {
  const res = await runToolSafe(
    AnalyzeSpecialtyTool as DynamicStructuredTool,
    { text_input: state.text_input },
    // resolve_error: true — cùng lý do như analyze_relative_node ở trên.
    { candidate_specialties: [], resolve_error: true },
    "analyze_specialty_node",
  );
  const specialty_candidates = res?.candidate_specialties || [];

  return {
    specialty_candidates,
    specialty_resolve_error: Boolean(res?.resolve_error),
  };
}

// 🧩 Node: Phân tích thời gian
async function analyzeTimeNode(state: typeof BookingState.State) {
  const res = await runToolSafe(
    AnalyzeTimeTool as DynamicStructuredTool,
    { text_input: state.text_input },
    { appointment_date: "", day_of_week: "", start_time: "", end_time: "" },
    "analyze_time_node",
  );
  return { time: res };
}

// 🧩 Node: Kiểm tra điều kiện đầy đủ
function checkerNode(state: typeof BookingState.State) {
  const missing: string[] = [];
  let ambiguous_relatives = false;

  if (
    state.selected_relative_id === null ||
    state.selected_relative_id === undefined
  ) {
    if (state.relatives && state.relatives.length > 1) {
      ambiguous_relatives = true;
      console.log("[Node] checker — Phát hiện nhiều người thân");
    } else if (state.new_relative_candidate) {
      // Không tìm thấy hồ sơ có sẵn nhưng đã xác định rõ mối quan hệ — kiểm
      // tra xem đã đủ thông tin để tự tạo hồ sơ mới chưa (fullname/gender bắt
      // buộc, xem BodyCreateRelativeDto ở backend). dob CỐ Ý không bắt buộc —
      // quyết định sản phẩm: không hỏi ngày sinh khi đặt lịch để giảm ma sát
      // cho người dùng, cột relatives.dob ở DB vốn đã nullable từ trước, và
      // BodyCreateRelativeDto.dob giờ @IsOptional() (xem
      // bodyCreateRelative.dto.ts) nên gửi thiếu/null đều được backend chấp
      // nhận, không còn bị chặn như trước.
      const candidate = state.new_relative_candidate;
      if (!candidate.fullname) missing.push("new_relative_fullname");
      if (candidate.gender === null) missing.push("new_relative_gender");
      console.log("[Node] checker — Hồ sơ người thân mới cần được xác nhận");
    } else {
      missing.push("selected_relative_id");
      console.log("[Node] checker — Thiếu người thân");
    }
  }

  // Chỉ cần LLM chẩn đoán được ít nhất 1 chuyên khoa phù hợp từ triệu chứng
  // (đã kèm sẵn id thật — xem AnalyzeSpecialtyTool). Không còn bước "resolve"
  // riêng: id đã biết ngay tại đây, chọn chuyên khoa phù hợp nhất (đầu mảng).
  if (!state.specialty_candidates || state.specialty_candidates.length === 0) {
    missing.push("selected_specialty_name");
    console.log("[Node] checker — Thiếu chuyên khoa");
  }

  if (!state.time?.appointment_date) missing.push("appointment_date");
  if (!state.time?.start_time) missing.push("start_time");
  // end_time là tùy chọn: backend hỗ trợ tự chọn bác sĩ chỉ với start_time
  // (xem AppointmentsService.findAutoSelectSchedule), nên không bắt buộc ở đây.

  // ready phải false khi có nhiều người thân trùng khớp (ambiguous_relatives),
  // nếu không booking_appointment sẽ chạy với selected_relative_id = null và
  // có thể đặt lịch nhầm người thay vì hỏi lại người dùng.
  const ready = missing.length === 0 && !ambiguous_relatives;
  console.log(
    "✅ [Node] checker — missing:",
    missing.length ? missing.join(", ") : "Không thiếu gì",
  );

  const selected_specialty_id = ready ? state.specialty_candidates[0].id : null;

  return { missing, ready, ambiguous_relatives, selected_specialty_id };
}

// 🧩 Node: Gửi yêu cầu đặt lịch
async function bookingAppointmentNode(state: typeof BookingState.State) {
  // selected_relative_id và new_relative_candidate loại trừ lẫn nhau —
  // checker_node chỉ đánh dấu ready khi đúng một trong hai đã đủ thông tin
  // (xem BodyCreateAppointmentDto.IsValidPatientSelectionConstraint ở
  // backend, cùng ràng buộc y hệt).
  const hasSelectedRelative =
    state.selected_relative_id !== null &&
    state.selected_relative_id !== undefined;
  const patientFields = hasSelectedRelative
    ? { relative_id: state.selected_relative_id }
    : {
        new_relative_profile: {
          fullname: state.new_relative_candidate!.fullname,
          relationship_code: state.new_relative_candidate!.relationship_code,
          gender: state.new_relative_candidate!.gender,
          // dob có thể null (không bắt buộc, xem checker_node) — vẫn gửi
          // thẳng, không cần lược bỏ: class-validator's @IsOptional() bỏ qua
          // validate cho cả null lẫn undefined (đã xác nhận qua
          // node_modules/class-validator/.../IsOptional.js), không riêng gì
          // trường hợp field vắng mặt hẳn.
          dob: state.new_relative_candidate!.dob,
        },
      };

  const payload = {
    ...patientFields,
    specialty_id: state.selected_specialty_id,
    appointment_date: state.time?.appointment_date,
    start_time: state.time?.start_time,
    // AnalyzeTimeTool luôn trả end_time là string (kể cả "" khi người dùng
    // không nói giờ kết thúc) — chỉ đưa vào payload khi thật sự có giá trị.
    // "" không phải undefined/null nên @IsOptional() ở backend không bỏ qua
    // được, khiến @IsMilitaryTime() chạy và báo lỗi trên chuỗi rỗng.
    ...(state.time?.end_time ? { end_time: state.time.end_time } : {}),
    booking_mode: "ai_select",
  };

  console.log("[booking_appointment] Sending validated booking request");

  try {
    const token = state?.token;

    if (!token) {
      console.log("Thiếu token, không thể đặt lịch");
      return {
        booking_result: null,
        booking_error: {
          code: "UNAUTHENTICATED",
          details: "Người dùng chưa đăng nhập. Không thể đặt lịch.",
        },
      };
    }

    const response = await httpClient.post(
      `${process.env.BACKEND_URL}/api/v1/appointments/booking`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const appointmentInfo = response.data?.data;

    return { booking_result: appointmentInfo, booking_error: null };
  } catch (error) {
    logSafeError("[booking_appointment] Backend request failed", error);
    if (axios.isAxiosError(error)) {
      const bookingApiError = error.response?.data?.error;
      const code = bookingApiError?.code || "BOOKING_FAILED";
      const details =
        bookingApiError?.details || "Không rõ lỗi từ phía server.";

      if (code === APPOINTMENT_SLOT_UNAVAILABLE) {
        const patientName =
          state.new_relative_candidate?.fullname ||
          state.relatives?.find(
            (relative) => relative.id === state.selected_relative_id,
          )?.fullname;
        const specialtyName = state.specialty_candidates?.find(
          (specialty) => specialty.id === state.selected_specialty_id,
        )?.name;

        return {
          booking_result: null,
          booking_error: {
            code,
            details,
            patientName,
            specialtyName,
            appointmentDate: state.time?.appointment_date,
            startTime: state.time?.start_time,
          },
        };
      }

      return { booking_result: null, booking_error: { code, details } };
    }
    return {
      booking_result: null,
      booking_error: {
        code: "BOOKING_FAILED",
        details: "Lỗi không xác định khi đặt lịch. Vui lòng thử lại sau.",
      },
    };
  }
}

const workflow = new StateGraph(BookingState)
  .addNode("analyze_relative_node", analyzeRelativeNode)
  .addNode("analyze_specialty_node", analyzeSpecialtyNode)
  .addNode("analyze_time_node", analyzeTimeNode)
  .addNode("checker_node", checkerNode)
  .addNode("booking_appointment", bookingAppointmentNode)
  .addEdge("__start__", "analyze_relative_node")
  .addEdge("__start__", "analyze_specialty_node")
  .addEdge("__start__", "analyze_time_node")
  .addEdge("analyze_relative_node", "checker_node")
  .addEdge("analyze_specialty_node", "checker_node")
  .addEdge("analyze_time_node", "checker_node")
  .addConditionalEdges("checker_node", (state) => {
    return state.ready ? "booking_appointment" : "__end__";
  })
  .addEdge("booking_appointment", "__end__");

const bookingGraph = workflow.compile();

export default bookingGraph;

// async function runTests(text_input: string, token: string) {
//   const result = await bookingGraph.invoke({
//     text_input,
//     token,
//   });

//   console.log(">>> KET QUA: ", result);
// }

// runTests(
//   "Tôi muốn đặt lịch khám cho con trai tôi với bác sĩ Lê Văn Minh chuyên khoa nội tổng quát vào sáng ngày mai ?",
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjM1LCJyb2xlcyI6W10sInRva2VuSWQiOiI0ZDk1NzE3NC1kYjlhLTQ4Y2ItOGQwYy1lYWIzMTA0ODM4ZTkiLCJzZXNzaW9uVmVyc2lvbiI6MSwiaWF0IjoxNzYwOTAxMzg5LCJleHAiOjE3NjA5MDIyODl9.5WOqSh7igp9VICYkLYuIt4Hc4VCg1Udz409I0RkOhs8"
// );
