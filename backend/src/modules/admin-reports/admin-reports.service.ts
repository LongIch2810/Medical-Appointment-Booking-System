import {
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
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
import { Repository } from 'typeorm';
import AiAdminReport from 'src/entities/aiAdminReport.entity';
import { AiDocumentAsset } from 'src/shared/types/aiDocumentAsset.type';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { AiDocumentStorageService } from '../ai-documents/ai-document-storage.service';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';
import {
  BodyGenerateAdminReportDto,
  DateRangePreset,
  ReportType,
} from './dto/request/bodyGenerateAdminReport.dto';
import { AdminReportsMapper } from './admin-reports.mapper';
import { buildAdminReportFileName } from 'src/utils/aiDocumentFileName';
import { getDatabaseErrorMetadata } from 'src/utils/databaseErrorMetadata';
import { getChatbotUpstreamError } from 'src/utils/chatbotUpstreamError';

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
  [ReportType.AI_COACH_ACTIVITY]: (from, to) =>
    `Thống kê số lộ trình sức khỏe AI được tạo từ view chatbot_report_health_roadmaps_view, lọc roadmap_date trong khoảng ${from} đến ${to}; dùng SUM(roadmap_count), đồng thời phân tích user_count và profile_count theo ngày.`,
  [ReportType.HEALTH_TRENDS]: (from, to) =>
    `Phân tích xu hướng tổng hợp từ view chatbot_report_health_profiles_view, lọc profile_date trong khoảng ${from} đến ${to}: average_height, average_weight, average_heart_rate, average_glucose_level, average_cholesterol_level và SUM(profile_count) theo ngày; giá trị NULL là nhóm chưa đủ 5 hồ sơ và phải được bỏ qua.`,
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
  private readonly logger = new Logger(AdminReportsService.name);

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @InjectRepository(AiAdminReport)
    private readonly reportRepo: Repository<AiAdminReport> = undefined as any,
    @Optional()
    private readonly storage: AiDocumentStorageService = undefined as any,
  ) {}

  private resolveDateRange(dto: BodyGenerateAdminReportDto) {
    const now = new Date();
    const { from, to } =
      dto.rangePreset === DateRangePreset.CUSTOM
        ? {
            from: startOfDay(new Date(dto.fromDate!)),
            to: endOfDay(new Date(dto.toDate!)),
          }
        : FIXED_DATE_RANGE_RESOLVERS[dto.rangePreset](now);
    const fromDate = from.toISOString().slice(0, 10);
    const toDate = to.toISOString().slice(0, 10);
    const fromLabel = formatDateDDMMYYYY(from)!;
    const toLabel = formatDateDDMMYYYY(to)!;
    return {
      from: fromLabel,
      to: toLabel,
      fromDate,
      toDate,
      rangeLabel: `${fromLabel} - ${toLabel}`,
    };
  }

  private parseTableRows(
    rawResult: unknown,
  ): Record<string, string | number>[] {
    if (typeof rawResult !== 'string') return [];
    try {
      const parsed = JSON.parse(rawResult);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private toResponse(entity: AiAdminReport) {
    return AdminReportsMapper.toResponse(
      entity.report_type as ReportType,
      entity.range_label,
      {
        asset: entity.output_asset,
        raw: {
          report: entity.report,
          chartConfig: entity.chart_config,
          result: JSON.stringify(entity.table_rows),
        },
      },
      {
        id: entity.id,
        createdAt: entity.created_at,
        createdBy: entity.createdBy
          ? { id: entity.createdBy.id, fullname: entity.createdBy.fullname }
          : undefined,
        pdfUrl: `/api/v1/admin-reports/history/${entity.id}/file`,
      },
    );
  }

  async generate(
    userIdOrDto: number | BodyGenerateAdminReportDto,
    dtoArg?: BodyGenerateAdminReportDto,
  ) {
    const userId = typeof userIdOrDto === 'number' ? userIdOrDto : undefined;
    const dto = (typeof userIdOrDto === 'number' ? dtoArg : userIdOrDto)!;
    const range = this.resolveDateRange(dto);
    const outputFileName = buildAdminReportFileName(
      dto.reportType,
      range.fromDate,
      range.toDate,
    );
    const question = REPORT_QUESTION_BUILDERS[dto.reportType](
      range.from,
      range.to,
    );
    let data: any;
    try {
      const response = await axios.post(
        `${this.configService.get<string>('CHATBOT_URL')}/chatbot/create-report`,
        { question, fileName: outputFileName },
        {
          timeout: 240_000,
          headers: {
            'x-chatbot-internal-key': this.configService.getOrThrow<string>(
              'CHATBOT_INTERNAL_KEY',
            ),
          },
        },
      );
      data = response.data?.data;
    } catch (error: unknown) {
      const upstream = getChatbotUpstreamError(error);
      this.logger.error(
        JSON.stringify({
          scope: 'ai_admin_report',
          event: 'chatbot_request_failed',
          reportType: dto.reportType,
          status: upstream.status,
          code: upstream.code,
        }),
      );
      throw new HttpException(
        {
          code:
            upstream.code ||
            (upstream.status === 504
              ? 'AI_REPORT_TIMEOUT'
              : 'AI_REPORT_GENERATION_FAILED'),
          message:
            upstream.message ||
            'Không thể tạo báo cáo từ AI Coach lúc này. Vui lòng thử lại sau.',
        },
        upstream.status,
      );
    }

    if (!this.reportRepo || !userId) {
      return AdminReportsMapper.toResponse(
        dto.reportType,
        range.rangeLabel,
        data,
        { fileName: outputFileName },
      );
    }

    let asset: AiDocumentAsset | undefined = data?.asset ?? data?.pdfAsset;
    asset = asset
      ? { ...asset, fileName: asset.fileName || outputFileName }
      : asset;
    if (!asset?.publicId) {
      throw new HttpException(
        {
          code: 'AI_REPORT_INVALID_RESPONSE',
          message: 'AI không trả về tài liệu PDF hợp lệ.',
        },
        502,
      );
    }

    const raw = data?.raw ?? {};
    const tableRows = this.parseTableRows(raw.result);
    const tableColumns = tableRows.length
      ? Object.keys(tableRows[0]).map((key) => ({
          key,
          label: key.replace(/_/g, ' '),
        }))
      : [];

    try {
      const entity = await this.reportRepo.save({
        createdBy: { id: userId },
        report_type: dto.reportType,
        range_preset: dto.rangePreset,
        from_date: range.fromDate,
        to_date: range.toDate,
        range_label: range.rangeLabel,
        report: raw.report ?? null,
        chart_config: raw.chartConfig ?? null,
        table_columns: tableColumns,
        table_rows: tableRows,
        output_asset: asset,
      });
      return this.toResponse(entity);
    } catch (error: unknown) {
      if (this.storage)
        await this.storage.deleteAsset(asset).catch(() => undefined);
      this.logger.error(
        JSON.stringify({
          scope: 'ai_admin_report',
          event: 'persistence_failed',
          userId,
          reportType: dto.reportType,
          ...getDatabaseErrorMetadata(error),
        }),
      );
      throw new HttpException(
        {
          code: 'AI_REPORT_PERSISTENCE_FAILED',
          message: 'Không thể lưu báo cáo AI lúc này. Vui lòng thử lại sau.',
        },
        500,
      );
    }
  }

  async history(page = 1, limit = 10, reportType?: string) {
    page = Math.max(1, page);
    limit = Math.min(50, Math.max(1, limit));
    const where = reportType ? { report_type: reportType } : {};
    const [rows, total] = await this.reportRepo.findAndCount({
      where,
      relations: { createdBy: true },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginationResultDto(
      'reports',
      rows.map((row) => this.toResponse(row)),
      total,
      page,
      limit,
    );
  }

  async detail(id: number) {
    const row = await this.reportRepo.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!row) throw new NotFoundException('Không tìm thấy báo cáo.');
    return this.toResponse(row);
  }

  async file(id: number, download = false) {
    const row = await this.reportRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy báo cáo.');
    return this.storage.getDownloadUrl(row.output_asset, download);
  }

  async remove(id: number, userId: number, roles: string[]) {
    const row = await this.reportRepo.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!row) throw new NotFoundException('Không tìm thấy báo cáo.');
    if (row.createdBy.id !== userId && !roles.includes('ADMIN'))
      throw new HttpException('Bạn không có quyền xóa báo cáo này.', 403);
    await this.storage.deleteAsset(row.output_asset);
    await this.reportRepo.softDelete(id);
    return { success: true };
  }
}
