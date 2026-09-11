import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';
import {
  BodyGenerateAdminReportDto,
  DateRangePreset,
  ReportType,
} from './dto/request/bodyGenerateAdminReport.dto';
import { AdminReportsMapper } from './admin-reports.mapper';

type FixedDateRangeResolver = (now: Date) => { from: Date; to: Date };

const FIXED_DATE_RANGE_RESOLVERS: Record<
  Exclude<DateRangePreset, DateRangePreset.CUSTOM>,
  FixedDateRangeResolver
> = {
  [DateRangePreset.TODAY]: (now) => ({
    from: startOfDay(now),
    to: endOfDay(now),
  }),
  [DateRangePreset.THIS_WEEK]: (now) => ({
    from: startOfWeek(now, { weekStartsOn: 1 }),
    to: endOfWeek(now, { weekStartsOn: 1 }),
  }),
  [DateRangePreset.THIS_MONTH]: (now) => ({
    from: startOfMonth(now),
    to: endOfMonth(now),
  }),
  [DateRangePreset.THIS_YEAR]: (now) => ({
    from: startOfYear(now),
    to: endOfYear(now),
  }),
};

const REPORT_QUESTION_BUILDERS: Record<
  ReportType,
  (from: string, to: string) => string
> = {
  [ReportType.NEW_USER_REGISTRATIONS]: (from, to) =>
    `Thống kê số lượng người dùng đăng ký mới từ view chatbot_report_users_view, lọc registration_date trong khoảng ${from} đến ${to}; dùng SUM(user_count), phân loại theo roles và từng ngày.`,
  [ReportType.HEALTH_GOAL_SUMMARY]: (from, to) =>
    `Thống kê health_goal từ view chatbot_report_coach_profiles_view, lọc profile_date trong khoảng ${from} đến ${to}; dùng SUM(profile_count), liệt kê số lượng và tỷ lệ phần trăm theo từng mục tiêu.`,
  [ReportType.AI_COACH_ACTIVITY]: (from, to) =>
    `Thống kê hoạt động AI Coach từ view chatbot_report_audit_view, lọc entity_name = 'coach-profile' và activity_date trong khoảng ${from} đến ${to}; trả về event_count và actor_count theo ngày, action, is_success.`,
  [ReportType.HEALTH_TRENDS]: (from, to) =>
    `Phân tích xu hướng tổng hợp từ view chatbot_report_coach_profiles_view, lọc profile_date trong khoảng ${from} đến ${to}: average_age, average_height, average_weight và SUM(profile_count) theo ngày; giá trị NULL là nhóm chưa đủ 5 hồ sơ và phải được bỏ qua.`,
  [ReportType.BOOKING_CANCELLATION_NOSHOW]: (from, to) =>
    `Thống kê từ view chatbot_report_appointments_view, lọc appointment_date trong khoảng ${from} đến ${to}: dùng SUM(appointment_count) để tính tổng số lịch, tỷ lệ status = 'CANCELLED', tỷ lệ status = 'ABSENT', và số lượng theo status.`,
  [ReportType.PATIENT_FLOW_BY_TIMESLOT]: (from, to) =>
    `Thống kê lưu lượng trong khoảng ${from} đến ${to} bằng cách join chatbot_report_appointments_view với chatbot_report_doctor_schedules_view qua doctor_schedule_id; dùng SUM(appointment_count), nhóm theo start_time và day_of_week.`,
  [ReportType.APPOINTMENTS_BY_SPECIALTY]: (from, to) =>
    `Thống kê lịch hẹn theo specialty_name trong khoảng ${from} đến ${to}, join các view chatbot_report_appointments_view, chatbot_report_doctor_schedules_view và chatbot_report_doctors_view; dùng SUM(appointment_count).`,
  [ReportType.DOCTOR_FILL_RATE]: (from, to) =>
    `Tính tỷ lệ lấp đầy lịch khám theo từng doctor_name trong khoảng ${from} đến ${to}, bằng cách join chatbot_report_doctors_view d với chatbot_report_doctor_schedules_view s qua d.id = s.doctor_id và LEFT JOIN chatbot_report_appointments_view a qua s.id = a.doctor_schedule_id. Dùng appointment_count để tính tổng lượt đặt; appointment status khác 'CANCELLED' là lượt đặt hợp lệ. Kết quả bắt buộc gồm doctor_name, tổng appointment_count và tỷ lệ; mọi cột không aggregate phải nằm trong GROUP BY, ít nhất GROUP BY d.doctor_name, không dùng SELECT * và giới hạn tối đa 1000 dòng.`,
  [ReportType.USER_DEMOGRAPHICS]: (from, to) =>
    `Phân tích dữ liệu tổng hợp đã khử định danh từ chatbot_report_users_view, lọc registration_date trong khoảng ${from} đến ${to}: dùng SUM(user_count) để tính phân bố theo gender, age_group và region.`,
};

@Injectable()
export class AdminReportsService {
  constructor(private readonly configService: ConfigService) {}

  private resolveDateRange(dto: BodyGenerateAdminReportDto) {
    const now = new Date();
    const { from, to } =
      dto.rangePreset === DateRangePreset.CUSTOM
        ? {
            from: startOfDay(new Date(dto.fromDate!)),
            to: endOfDay(new Date(dto.toDate!)),
          }
        : FIXED_DATE_RANGE_RESOLVERS[dto.rangePreset](now);

    // formatDateDDMMYYYY (dd-MM-yyyy) để khớp định dạng ngày hiển thị chung
    // của toàn app (DateFormatInterceptor / các response DTO khác).
    const fromLabel = formatDateDDMMYYYY(from)!;
    const toLabel = formatDateDDMMYYYY(to)!;
    return {
      from: fromLabel,
      to: toLabel,
      rangeLabel: `${fromLabel} - ${toLabel}`,
    };
  }

  private buildQuestion(
    reportType: ReportType,
    from: string,
    to: string,
  ): string {
    return REPORT_QUESTION_BUILDERS[reportType](from, to);
  }

  async generate(dto: BodyGenerateAdminReportDto) {
    const { from, to, rangeLabel } = this.resolveDateRange(dto);
    const question = this.buildQuestion(dto.reportType, from, to);

    try {
      const response = await axios.post(
        `${this.configService.get<string>('CHATBOT_URL')}/chatbot/create-report`,
        { question },
        {
          timeout: 240_000,
          headers: {
            'x-chatbot-internal-key': this.configService.getOrThrow<string>(
              'CHATBOT_INTERNAL_KEY',
            ),
          },
        },
      );
      return AdminReportsMapper.toResponse(
        dto.reportType,
        rangeLabel,
        response.data?.data,
      );
    } catch (error: any) {
      console.error('AdminReports create-report error:', {
        status: error?.response?.status,
        code: error?.code,
      });
      throw new HttpException(
        error?.response?.data?.message ||
          'Không thể tạo báo cáo từ AI Coach lúc này. Vui lòng thử lại sau.',
        error?.response?.status || 500,
      );
    }
  }
}
