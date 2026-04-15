import * as dotenv from "dotenv";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { AnalyzeDoctorTool } from "../tools/doctor_name_analyzer.tool.js";
import { AnalyzeRelativeTool } from "../tools/relative_analyzer.tool.js";
import { AnalyzeSpecialtyTool } from "../tools/specialty_name_analyzer.tool.js";
import { AnalyzeTimeTool } from "../tools/time_analyzer.tool.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import axios from "axios";
import { AdminQaSqlTool } from "../tools/admin_qa_sql.tool.js";

dotenv.config();

const mergedAnnotations = (oldObj: any, newObj: any) => ({
  ...oldObj,
  ...newObj,
});

const BookingState = Annotation.Root({
  text_input: Annotation<string>(),
  token: Annotation<string>(),

  doctor: Annotation<{ doctor_name: string }>({ reducer: mergedAnnotations }),

  specialty_names: Annotation<{ name: string }[]>({
    reducer: mergedAnnotations,
  }),

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
        new Map(merged.map((item) => [item.id, item])).values()
      );
      return unique;
    },
  }),

  selected_relative_id: Annotation<number | null>({
    reducer: (_o, n) => n,
  }),

  selected_specialty_name: Annotation<string | null>({
    reducer: (_o, n) => n,
  }),

  ambiguous_relatives: Annotation<boolean>({
    reducer: (_o, n) => n,
  }),

  ready: Annotation<boolean>({ reducer: (_o, n) => n }),

  missing: Annotation<string[]>({
    reducer: (a = [], b = []) =>
      Array.from(new Set([...(a || []), ...(b || [])])),
  }),

  result_query: Annotation<any[]>(),

  result_query_doctor: Annotation<any[]>(),

  hasAvailableDoctor: Annotation<boolean>(),

  selected_doctor_id: Annotation<number | null>({
    reducer: (_o, n) => n,
  }),

  selected_doctor_schedule_id: Annotation<number | null>({
    reducer: (_o, n) => n,
  }),

  booking_result: Annotation<any>({ reducer: (_o, n) => n }),
});

async function runTool<T extends DynamicStructuredTool>(
  tool: T,
  args: Record<string, any>
) {
  const result = await tool.invoke(args);
  return result;
}

// 🧩 Node: Phân tích người thân
async function analyzeRelativeNode(state: typeof BookingState.State) {
  console.log("\n🧩 [Node] analyze_relative — input:", state.text_input);

  const res = await runTool(AnalyzeRelativeTool as DynamicStructuredTool, {
    text_input: state.text_input,
    token: state.token,
  });

  console.log("✅ [Node] analyze_relative — output:", res);

  const relatives = res?.relatives || [];
  let selected_relative_id: number | null = null;

  if (relatives.length === 1) {
    selected_relative_id = relatives[0].id;
  }

  return { relatives, selected_relative_id };
}

// 🧩 Node: Phân tích bác sĩ
async function analyzeDoctorNode(state: typeof BookingState.State) {
  console.log("\n🧩 [Node] analyze_doctor — input:", state.text_input);
  const res = await runTool(AnalyzeDoctorTool as DynamicStructuredTool, {
    text_input: state.text_input,
  });
  console.log("✅ [Node] analyze_doctor — output:", res);
  return { doctor: res };
}

// 🧩 Node: Phân tích chuyên khoa
async function analyzeSpecialtyNode(state: typeof BookingState.State) {
  console.log("\n🧩 [Node] analyze_specialty — input:", state.text_input);
  const res = await runTool(AnalyzeSpecialtyTool as DynamicStructuredTool, {
    text_input: state.text_input,
  });
  const specialty_names = res?.specialty_names || [];
  let selected_specialty_name: string | null = null;

  if (specialty_names.length === 1) {
    selected_specialty_name = specialty_names[0];
  }

  console.log("✅ [Node] analyze_specialty — output:", res);
  return { specialty_names, selected_specialty_name };
}

// 🧩 Node: Phân tích thời gian
async function analyzeTimeNode(state: typeof BookingState.State) {
  console.log("\n🧩 [Node] analyze_time — input:", state.text_input);
  const res = await runTool(AnalyzeTimeTool as DynamicStructuredTool, {
    text_input: state.text_input,
  });
  console.log("✅ [Node] analyze_time — output:", res);
  return { time: res };
}

// 🧩 Node: Kiểm tra điều kiện đầy đủ
function checkerNode(state: typeof BookingState.State) {
  console.log(
    "\n🧩 [Node] checker — state hiện tại:",
    JSON.stringify(state, null, 2)
  );

  const missing: string[] = [];
  let ambiguous_relatives = false;

  if (!state.selected_relative_id) {
    if (state.relatives && state.relatives.length > 1) {
      ambiguous_relatives = true;
      console.log("[Node] checker — Phát hiện nhiều người thân");
    } else {
      missing.push("selected_relative_id");
      console.log("[Node] checker — Thiếu người thân");
    }
  }

  if (!state.selected_specialty_name) missing.push("selected_specialty_name");
  if (!state.time?.appointment_date) missing.push("appointment_date");
  if (!state.time?.start_time) missing.push("start_time");
  if (!state.time?.end_time) missing.push("end_time");

  const ready = missing.length === 0;
  console.log(
    "✅ [Node] checker — missing:",
    missing.length ? missing.join(", ") : "Không thiếu gì"
  );

  return { missing, ready, ambiguous_relatives };
}

async function bookingQueryNode(state: typeof BookingState.State) {
  const hasDoctor = state.doctor.doctor_name !== "";

  const doctorPart = hasDoctor
    ? `bác sĩ có tên ${state.doctor?.doctor_name}`
    : `các bác sĩ bất kỳ (không giới hạn tên)`;

  const question = `
Hãy tìm ${doctorPart}
thuộc chuyên khoa ${state.selected_specialty_name}.

Điều kiện:
- Bỏ qua (không chọn) các ca làm việc đã bị đặt lịch trùng giờ trong ngày ${state.time?.appointment_date}.
- Chỉ loại bỏ các ca bị trùng thời gian, KHÔNG loại bỏ toàn bộ bác sĩ nếu họ vẫn còn ca khác chưa được đặt.
- Các ca hợp lệ là những ca có khoảng thời gian giao nhau hoặc nằm trong khung giờ từ '${state.time?.start_time}' đến '${state.time?.end_time}'.
- Ví dụ: nếu người dùng muốn 09:00-12:00, và bác sĩ có hai ca 09:30-10:30 và 11:00-12:00 thì cả hai ca đều hợp lệ nếu chưa có lịch hẹn nào trong hai khung giờ đó.

Kết quả cần trả về:
    doctor_id,
    fullname,
    specialty_name,
    doctor_schedules:{ doctor_schedule_id, start_time, end_time }[]
`;

  const res = await runTool(AdminQaSqlTool as DynamicStructuredTool, {
    question,
  });

  const result_query = JSON.parse(res);

  if (result_query.length === 0) {
    console.log("Không tìm thấy có bác sĩ nào phù hợp với khung giờ này");
    return {
      hasAvailableDoctor: false,
    };
  }

  const result_query_doctor = result_query[0];

  console.log("🧩 [Node] booking_query — output:", result_query);

  const selected_doctor_id = result_query_doctor.doctor_id;

  const selected_doctor_schedule_id =
    result_query_doctor.doctor_schedules[0].doctor_schedule_id;

  return {
    hasAvailableDoctor: true,
    result_query_doctor,
    selected_doctor_id,
    selected_doctor_schedule_id,
    result_query,
  };
}

async function doctorNotFoundNode(state: typeof BookingState.State) {
  const hasDoctorNameText = state.doctor.doctor_name
    ? `Hiên bác sĩ ${state.doctor.doctor_name}`
    : "Hiện không có bác sĩ nào";
  const message = `${hasDoctorNameText} làm ở chuyên khoa ${state.selected_specialty_name}
  rảnh trong khung giờ ${state.time.start_time}-${state.time.end_time}
  thứ ${state.time.day_of_week} ngày ${state.time.appointment_date}). 
  Bạn có muốn chọn khung giờ khác không?`;

  console.log("[Node] doctorFound —", message);

  return { booking_result: message };
}

// 🧩 Node: Gửi yêu cầu đặt lịch
async function bookingAppointmentNode(state: typeof BookingState.State) {
  console.log(
    "\n🧩 [Node] booking_appointment — state:",
    JSON.stringify(state, null, 2)
  );

  const payload = {
    relative_id: state.selected_relative_id,
    doctor_id: state.selected_doctor_id,
    doctor_schedule_id: state.selected_doctor_schedule_id,
    appointment_date: state.time?.appointment_date,
    booking_mode: "ai_select",
  };

  console.log("📦 [booking_appointment] Payload gửi API:", payload);

  try {
    const token = state?.token;

    if (!token) {
      console.log("Thiếu token, không thể đặt lịch");
      return {
        booking_result: "Lỗi: Người dùng chưa đăng nhập. Không thể đặt lịch.",
      };
    }

    const response = await axios.post(
      `${process.env.BACKEND_URL}/api/v1/appointments/booking-appointment`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const appointmentInfo = response.data?.data;

    return { booking_result: appointmentInfo };
  } catch (error) {
    console.error("Lỗi:", error);
    if (axios.isAxiosError(error)) {
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.error?.details ||
        "Không rõ lỗi từ phía server.";
      return { booking_result: `Lỗi từ API khi đặt lịch: ${errMsg}` };
    }
    return {
      booking_result: "Lỗi không xác định khi đặt lịch. Vui lòng thử lại sau.",
    };
  }
}

const workflow = new StateGraph(BookingState)
  .addNode("analyze_relative_node", analyzeRelativeNode)
  .addNode("analyze_doctor_node", analyzeDoctorNode)
  .addNode("analyze_specialty_node", analyzeSpecialtyNode)
  .addNode("analyze_time_node", analyzeTimeNode)
  .addNode("checker_node", checkerNode)
  .addNode("booking_query_node", bookingQueryNode)
  .addNode("doctor_not_found_node", doctorNotFoundNode)
  .addNode("booking_appointment", bookingAppointmentNode)
  .addEdge("__start__", "analyze_relative_node")
  .addEdge("__start__", "analyze_doctor_node")
  .addEdge("__start__", "analyze_specialty_node")
  .addEdge("__start__", "analyze_time_node")
  .addEdge("analyze_relative_node", "checker_node")
  .addEdge("analyze_doctor_node", "checker_node")
  .addEdge("analyze_specialty_node", "checker_node")
  .addEdge("analyze_time_node", "checker_node")
  .addConditionalEdges("checker_node", (state) => {
    return state.ready ? "booking_query_node" : "__end__";
  })
  .addConditionalEdges("booking_query_node", (state) => {
    return state.hasAvailableDoctor
      ? "booking_appointment"
      : "doctor_not_found_node";
  })
  .addEdge("doctor_not_found_node", "__end__")
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
