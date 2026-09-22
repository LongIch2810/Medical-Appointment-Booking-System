import {
  BadRequestException,
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
import { LessThan, Repository } from 'typeorm';
import AiAdminReport from 'src/entities/aiAdminReport.entity';
import AiReportConversation from 'src/entities/aiReportConversation.entity';
import AiReportMessage, {
  ReportAssistantAction,
  ReportPlan,
} from 'src/entities/aiReportMessage.entity';
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
import {
  CreateReportAssistantConversationDto,
  ReportAssistantMessageDto,
} from './dto/request/reportAssistantMessage.dto';

const REPORT_ASSISTANT_ACTIONS: ReportAssistantAction[] = [
  'CLARIFY',
  'ANSWER',
  'PROPOSE_PLAN',
  'GENERATE_REPORT',
  'REFUSE',
];
const REPORT_ASSISTANT_VIEWS = new Set([
  'chatbot_report_users_view',
  'chatbot_report_health_profiles_view',
  'chatbot_report_health_roadmaps_view',
  'chatbot_report_audit_view',
  'chatbot_report_appointments_view',
  'chatbot_report_doctor_schedules_view',
  'chatbot_report_doctors_view',
  'chatbot_report_specialties_view',
]);
const REPORT_ASSISTANT_CONTEXT_MESSAGES = 12;
const REPORT_ASSISTANT_CONTEXT_CHARS = 12_000;
const REPORT_ASSISTANT_MESSAGE_MAX_LENGTH = 4_000;
const REPORT_PREFERENCE_METRICS = new Set([
  'user_count',
  'profile_count',
  'roadmap_count',
  'event_count',
  'actor_count',
  'appointment_count',
  'average_age',
  'average_height',
  'average_weight',
]);
const REPORT_PREFERENCE_GROUPS = new Set([
  'registration_date',
  'gender',
  'age_group',
  'region',
  'roles',
  'profile_date',
  'health_goal',
  'roadmap_date',
  'activity_date',
  'action',
  'entity_name',
  'is_success',
  'appointment_date',
  'status',
  'booking_mode',
  'start_time',
  'day_of_week',
  'specialty_name',
]);
const REPORT_PLAN_PREFERENCE_KEYS = new Set([
  'rangePreset',
  'comparison',
  'metrics',
  'groupBy',
  'chartType',
  'detailLevel',
]);

function isAppliedReportPreferences(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const preferences = value as Record<string, unknown>;
  if (
    Object.keys(preferences).some(
      (key) => !REPORT_PLAN_PREFERENCE_KEYS.has(key),
    )
  )
    return false;
  const validEnum = (key: string, values: string[]) =>
    preferences[key] === undefined ||
    (typeof preferences[key] === 'string' && values.includes(preferences[key]));
  const validList = (key: 'metrics' | 'groupBy', allowed: Set<string>) =>
    preferences[key] === undefined ||
    (Array.isArray(preferences[key]) &&
      preferences[key].length <= 10 &&
      preferences[key].every(
        (item: unknown) => typeof item === 'string' && allowed.has(item),
      ));
  return (
    validEnum('rangePreset', [
      'TODAY',
      'THIS_WEEK',
      'THIS_MONTH',
      'THIS_YEAR',
    ]) &&
    validEnum('comparison', ['NONE', 'PREVIOUS_PERIOD', 'PREVIOUS_YEAR']) &&
    validEnum('chartType', ['AUTO', 'BAR', 'LINE', 'PIE', 'TABLE']) &&
    validEnum('detailLevel', ['BRIEF', 'STANDARD', 'DETAILED']) &&
    validList('metrics', REPORT_PREFERENCE_METRICS) &&
    validList('groupBy', REPORT_PREFERENCE_GROUPS)
  );
}

type ReportAssistantHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
  action?: ReportAssistantAction;
  plan?: ReportPlan;
};

type ReportAssistantUpstreamResponse = {
  action: ReportAssistantAction;
  message: string;
  plan?: ReportPlan;
  report?: {
    asset?: AiDocumentAsset;
    raw?: Record<string, any>;
  };
};

type FixedDateRangeResolver = (now: Date) => { from: Date; to: Date };

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function normalizePage(value: number, fallback: number, max?: number) {
  const normalized =
    Number.isSafeInteger(value) && value > 0 ? value : fallback;
  return max ? Math.min(max, normalized) : normalized;
}
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
    @Optional()
    @InjectRepository(AiReportConversation)
    private readonly conversationRepo: Repository<AiReportConversation> = undefined as any,
    @Optional()
    @InjectRepository(AiReportMessage)
    private readonly messageRepo: Repository<AiReportMessage> = undefined as any,
  ) {}

  private assistantRepositoriesReady() {
    if (!this.reportRepo || !this.conversationRepo || !this.messageRepo) {
      throw new HttpException(
        {
          code: 'REPORT_ASSISTANT_FAILED',
          message: 'Trợ lý báo cáo chưa sẵn sàng.',
        },
        500,
      );
    }
  }

  private toConversationResponse(conversation: AiReportConversation) {
    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.created_at.toISOString(),
      updatedAt: conversation.updated_at.toISOString(),
    };
  }

  private toMessageResponse(message: AiReportMessage) {
    return {
      id: message.id,
      role: message.role,
      action: message.action,
      content: message.content,
      plan: message.plan,
      report: message.report ? this.toResponse(message.report) : null,
      createdAt: message.created_at.toISOString(),
    };
  }

  private validateAssistantResponse(
    value: unknown,
  ): ReportAssistantUpstreamResponse {
    if (!value || typeof value !== 'object')
      throw new Error('invalid response');
    const response = value as Partial<ReportAssistantUpstreamResponse>;
    if (
      !REPORT_ASSISTANT_ACTIONS.includes(
        response.action as ReportAssistantAction,
      ) ||
      typeof response.message !== 'string' ||
      !response.message.trim() ||
      response.message.length > REPORT_ASSISTANT_MESSAGE_MAX_LENGTH
    ) {
      throw new Error('invalid response');
    }
    if (response.action === 'PROPOSE_PLAN') {
      const plan = response.plan;
      const hasComparison = Boolean(
        plan?.comparisonFromDate || plan?.comparisonToDate,
      );
      if (
        !plan ||
        plan.schemaVersion !== 1 ||
        typeof plan.title !== 'string' ||
        typeof plan.objective !== 'string' ||
        typeof plan.query !== 'string' ||
        !isCalendarDate(plan.fromDate) ||
        !isCalendarDate(plan.toDate) ||
        plan.fromDate > plan.toDate ||
        (hasComparison &&
          (!isCalendarDate(plan.comparisonFromDate) ||
            !isCalendarDate(plan.comparisonToDate) ||
            plan.comparisonFromDate > plan.comparisonToDate)) ||
        typeof plan.query !== 'string' ||
        plan.query.length > 2_000 ||
        typeof plan.title !== 'string' ||
        plan.title.length > 160 ||
        typeof plan.objective !== 'string' ||
        plan.objective.length > 500 ||
        !Array.isArray(plan.metrics) ||
        !Array.isArray(plan.groupBy) ||
        !plan.metrics.every((item) => typeof item === 'string') ||
        !plan.groupBy.every((item) => typeof item === 'string') ||
        !Array.isArray(plan.sourceViews) ||
        plan.sourceViews.some((view) => !REPORT_ASSISTANT_VIEWS.has(view)) ||
        (plan.chartType !== undefined &&
          !['AUTO', 'BAR', 'LINE', 'PIE', 'TABLE'].includes(plan.chartType)) ||
        (plan.detailLevel !== undefined &&
          !['BRIEF', 'STANDARD', 'DETAILED'].includes(plan.detailLevel)) ||
        (plan.appliedPreferences !== undefined &&
          !isAppliedReportPreferences(plan.appliedPreferences))
      ) {
        throw new Error('invalid plan');
      }
    }
    if (
      response.action === 'GENERATE_REPORT' &&
      (typeof response.report?.asset?.publicId !== 'string' ||
        !response.report.asset.publicId ||
        !response.report.raw ||
        typeof response.report.raw !== 'object' ||
        (response.report.raw.result !== null &&
          typeof response.report.raw.result !== 'string') ||
        (response.report.raw.report !== null &&
          typeof response.report.raw.report !== 'object') ||
        (response.report.raw.chartConfig !== null &&
          typeof response.report.raw.chartConfig !== 'object'))
    ) {
      throw new Error('missing report asset');
    }
    return response as ReportAssistantUpstreamResponse;
  }

  private async loadAssistantHistory(
    conversationId: number,
    beforeId?: number,
  ): Promise<ReportAssistantHistoryItem[]> {
    const rows = await this.messageRepo.find({
      where: {
        conversation: { id: conversationId },
        ...(beforeId ? { id: LessThan(beforeId) } : {}),
      },
      order: { id: 'DESC' },
      take: REPORT_ASSISTANT_CONTEXT_MESSAGES,
    });
    let remaining = REPORT_ASSISTANT_CONTEXT_CHARS;
    const history = rows.flatMap((row) => {
      if (remaining <= 0) return [];
      const content = row.content.slice(-remaining);
      remaining -= content.length;
      const role: ReportAssistantHistoryItem['role'] =
        row.role === 'USER' ? 'user' : 'assistant';
      return [
        {
          role,
          content,
          ...(row.action ? { action: row.action } : {}),
          ...(row.plan ? { plan: row.plan } : {}),
        },
      ];
    });
    return history.reverse();
  }

  private async callReportAssistant(args: {
    userId: number;
    conversationId: number;
    turnId: number;
    message: string;
    token: string;
    mode: 'MESSAGE' | 'CONFIRM_PLAN';
    historySeed?: ReportAssistantHistoryItem[];
    confirmedPlan?: ReportPlan;
    fileName?: string;
  }) {
    try {
      const response = await axios.post(
        `${this.configService.get<string>('CHATBOT_URL')}/chatbot/report-assistant`,
        {
          userId: args.userId,
          conversationId: args.conversationId,
          turnId: args.turnId,
          threadId: `report-assistant:v1:${args.userId}:${args.conversationId}`,
          mode: args.mode,
          message: args.message,
          ...(args.historySeed ? { historySeed: args.historySeed } : {}),
          ...(args.confirmedPlan ? { confirmedPlan: args.confirmedPlan } : {}),
          ...(args.fileName ? { fileName: args.fileName } : {}),
        },
        {
          timeout: 300_000,
          headers: {
            'x-chatbot-internal-key': this.configService.getOrThrow<string>(
              'CHATBOT_INTERNAL_KEY',
            ),
            Authorization: `Bearer ${args.token}`,
          },
        },
      );
      return this.validateAssistantResponse(
        response.data?.data ?? response.data,
      );
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        ['invalid response', 'invalid plan', 'missing report asset'].includes(
          error.message,
        )
      ) {
        throw new HttpException(
          {
            code: 'REPORT_ASSISTANT_INVALID_RESPONSE',
            message: 'AI trả về kết quả không hợp lệ.',
          },
          502,
        );
      }
      const upstream = getChatbotUpstreamError(error);
      const memoryOrStateUnavailable =
        upstream.status === 503 &&
        [
          'REPORT_ASSISTANT_STATE_UNAVAILABLE',
          'REPORT_ASSISTANT_MEMORY_FAILED',
        ].includes(upstream.code ?? '');
      if (memoryOrStateUnavailable) {
        throw new HttpException(
          {
            code: upstream.code,
            message:
              upstream.code === 'REPORT_ASSISTANT_MEMORY_FAILED'
                ? 'Không thể truy cập sở thích báo cáo đã nhớ.'
                : 'Trợ lý báo cáo đang tạm thời chưa sẵn sàng.',
          },
          503,
        );
      }
      const status =
        upstream.status === 429 ? 429 : upstream.status === 504 ? 504 : 502;
      const code =
        status === 429
          ? 'CHATBOT_RATE_LIMITED'
          : status === 504
            ? 'REPORT_ASSISTANT_TIMEOUT'
            : 'REPORT_ASSISTANT_FAILED';
      this.logger.error(
        JSON.stringify({
          scope: 'report_assistant',
          event: 'upstream_failed',
          status,
          code: upstream.code,
        }),
      );
      throw new HttpException(
        {
          code,
          message:
            status === 429
              ? 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.'
              : status === 504
                ? 'AI chưa phản hồi kịp thời. Vui lòng thử lại.'
                : 'Không thể xử lý yêu cầu báo cáo lúc này.',
        },
        status === 429 ? 429 : status === 504 ? 504 : 502,
      );
    }
  }

  private dateLabel(date: string) {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  private async saveAssistantTurn(args: {
    userId: number;
    conversation: AiReportConversation;
    userMessage: AiReportMessage;
    assistant: ReportAssistantUpstreamResponse;
    sourceRequest?: string;
    confirmedPlan?: ReportPlan;
  }) {
    let savedReport: AiAdminReport | null = null;
    const asset = args.assistant.report?.asset;
    const raw = args.assistant.report?.raw ?? {};
    const turnUpdatedAt = new Date();
    try {
      savedReport = await this.reportRepo.manager.transaction(
        async (manager) => {
          let reportEntity: AiAdminReport | null = null;
          if (args.assistant.action === 'GENERATE_REPORT' && asset?.publicId) {
            const reportPlan = args.confirmedPlan ?? args.assistant.plan;
            if (!reportPlan) throw new Error('missing confirmed report plan');
            const rows = this.parseTableRows(raw.result);
            reportEntity = await manager.getRepository(AiAdminReport).save({
              createdBy: { id: args.userId },
              conversation: { id: args.conversation.id },
              source_request: args.sourceRequest ?? reportPlan.query,
              report_type: 'CONVERSATIONAL',
              range_preset: 'CONVERSATION',
              from_date: reportPlan.fromDate,
              to_date: reportPlan.toDate,
              range_label: `${this.dateLabel(reportPlan.fromDate)} - ${this.dateLabel(reportPlan.toDate)}`,
              report: raw.report ?? null,
              chart_config: raw.chartConfig ?? null,
              table_columns: rows.length
                ? Object.keys(rows[0]).map((key) => ({
                    key,
                    label: key.replace(/_/g, ' '),
                  }))
                : [],
              table_rows: rows,
              output_asset: asset,
            });
          }
          await manager.getRepository(AiReportMessage).save({
            conversation: { id: args.conversation.id },
            role: 'ASSISTANT',
            action: args.assistant.action,
            content: args.assistant.message,
            plan:
              args.assistant.action === 'PROPOSE_PLAN'
                ? args.assistant.plan
                : null,
            report: reportEntity ? { id: reportEntity.id } : null,
          });
          await manager
            .getRepository(AiReportConversation)
            .update(
              { id: args.conversation.id },
              { updated_at: turnUpdatedAt },
            );
          return reportEntity;
        },
      );
    } catch (error: unknown) {
      if (asset?.publicId && this.storage) {
        await this.storage.deleteAsset(asset).catch(() => undefined);
      }
      this.logger.error(
        JSON.stringify({
          scope: 'report_assistant',
          event: 'persistence_failed',
          userId: args.userId,
          ...getDatabaseErrorMetadata(error),
        }),
      );
      throw new HttpException(
        {
          code: 'REPORT_ASSISTANT_PERSISTENCE_FAILED',
          message: 'Không thể lưu kết quả trợ lý báo cáo.',
        },
        500,
      );
    }
    args.conversation.updated_at = turnUpdatedAt;
    const assistantMessage = await this.messageRepo.findOne({
      where: { conversation: { id: args.conversation.id }, role: 'ASSISTANT' },
      order: { id: 'DESC' },
      relations: { report: true },
    });
    return {
      conversation: this.toConversationResponse(args.conversation),
      userMessage: this.toMessageResponse(args.userMessage),
      assistantMessage: this.toMessageResponse(assistantMessage!),
      report: savedReport ? this.toResponse(savedReport) : null,
    };
  }

  async createAssistantConversation(
    userId: number,
    token: string,
    dto: CreateReportAssistantConversationDto,
  ) {
    this.assistantRepositoriesReady();
    const message = typeof dto.message === 'string' ? dto.message.trim() : '';
    if (!message || message.length > REPORT_ASSISTANT_MESSAGE_MAX_LENGTH) {
      throw new BadRequestException({
        code: 'REPORT_ASSISTANT_INVALID_INPUT',
        message: 'Tin nhắn không hợp lệ.',
      });
    }
    const conversation = await this.conversationRepo.save({
      createdBy: { id: userId },
      title: message.slice(0, 160),
    });
    const userMessage = await this.messageRepo.save({
      conversation: { id: conversation.id },
      role: 'USER',
      action: null,
      content: message,
      plan: null,
    });
    const assistant = await this.callReportAssistant({
      userId,
      conversationId: conversation.id,
      turnId: userMessage.id,
      token,
      mode: 'MESSAGE',
      message,
      historySeed: [],
    });
    return this.saveAssistantTurn({
      userId,
      conversation,
      userMessage,
      assistant,
      sourceRequest: message,
    });
  }

  async listAssistantConversations(userId: number, page = 1, limit = 20) {
    this.assistantRepositoriesReady();
    page = normalizePage(page, 1);
    limit = normalizePage(limit, 20, 50);
    const [rows, total] = await this.conversationRepo.findAndCount({
      where: { createdBy: { id: userId } },
      order: { updated_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      conversations: rows.map((row) => this.toConversationResponse(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAssistantConversation(
    userId: number,
    id: number,
    beforeMessageId?: number,
    limit = 50,
  ) {
    this.assistantRepositoriesReady();
    const conversation = await this.conversationRepo.findOne({
      where: { id, createdBy: { id: userId } },
    });
    if (!conversation)
      throw new HttpException(
        {
          code: 'REPORT_CONVERSATION_NOT_FOUND',
          message: 'Không tìm thấy hội thoại.',
        },
        404,
      );
    if (
      beforeMessageId !== undefined &&
      (!Number.isSafeInteger(beforeMessageId) || beforeMessageId < 1)
    ) {
      throw new BadRequestException({
        code: 'REPORT_ASSISTANT_INVALID_INPUT',
        message: 'Mã tin nhắn không hợp lệ.',
      });
    }
    limit = normalizePage(limit, 50, 100);
    const rows = await this.messageRepo.find({
      where: {
        conversation: { id },
        ...(beforeMessageId ? { id: LessThan(beforeMessageId) } : {}),
      },
      order: { id: 'DESC' },
      take: limit,
      relations: { report: true },
    });
    return {
      conversation: this.toConversationResponse(conversation),
      messages: rows.reverse().map((row) => this.toMessageResponse(row)),
      nextBeforeMessageId: rows.length === limit ? rows[0].id : null,
    };
  }

  async sendAssistantMessage(
    userId: number,
    token: string,
    id: number,
    dto: ReportAssistantMessageDto,
  ) {
    this.assistantRepositoriesReady();
    const hasMessage = typeof dto.message === 'string';
    const suppliedMessage = dto.message !== undefined;
    const suppliedConfirmation = dto.confirmPlanMessageId !== undefined;
    const hasConfirmation =
      typeof dto.confirmPlanMessageId === 'number' &&
      Number.isSafeInteger(dto.confirmPlanMessageId) &&
      dto.confirmPlanMessageId > 0;
    if (
      suppliedMessage === suppliedConfirmation ||
      (suppliedMessage && !hasMessage) ||
      (suppliedConfirmation && !hasConfirmation)
    ) {
      throw new BadRequestException({
        code: 'REPORT_ASSISTANT_INVALID_INPUT',
        message: 'Gửi tin nhắn hoặc xác nhận kế hoạch.',
      });
    }
    const conversation = await this.conversationRepo.findOne({
      where: { id, createdBy: { id: userId } },
    });
    if (!conversation)
      throw new HttpException(
        {
          code: 'REPORT_CONVERSATION_NOT_FOUND',
          message: 'Không tìm thấy hội thoại.',
        },
        404,
      );

    let confirmedPlan: ReportPlan | undefined;
    let promptMessage: string;
    let planMessageId: number | undefined;
    let retryConfirmationMessage: AiReportMessage | null = null;
    if (hasConfirmation) {
      planMessageId = dto.confirmPlanMessageId;
      const planMessage = await this.messageRepo.findOne({
        where: {
          id: planMessageId,
          conversation: { id },
          role: 'ASSISTANT',
          action: 'PROPOSE_PLAN',
        },
      });
      if (!planMessage?.plan)
        throw new HttpException(
          {
            code: 'REPORT_PLAN_NOT_FOUND',
            message: 'Không tìm thấy kế hoạch báo cáo.',
          },
          404,
        );
      const latestMessage = await this.messageRepo.findOne({
        where: { conversation: { id } },
        order: { id: 'DESC' },
      });
      promptMessage = `Xác nhận tạo báo cáo theo kế hoạch #${planMessage.id}.`;
      if (latestMessage?.id !== planMessage.id) {
        if (
          latestMessage?.role === 'USER' &&
          latestMessage.content === promptMessage
        ) {
          retryConfirmationMessage = latestMessage;
        } else {
          throw new HttpException(
            {
              code: 'REPORT_PLAN_STALE',
              message: 'Kế hoạch đã cũ. Hãy yêu cầu trợ lý lập kế hoạch mới.',
            },
            409,
          );
        }
      }
      confirmedPlan = planMessage.plan;
    } else {
      promptMessage = dto.message!.trim();
      if (promptMessage.length > REPORT_ASSISTANT_MESSAGE_MAX_LENGTH) {
        throw new BadRequestException({
          code: 'REPORT_ASSISTANT_INVALID_INPUT',
          message: 'Tin nhắn không hợp lệ.',
        });
      }
      if (!promptMessage)
        throw new BadRequestException({
          code: 'REPORT_ASSISTANT_INVALID_INPUT',
          message: 'Tin nhắn không được để trống.',
        });
    }

    const userMessage =
      retryConfirmationMessage ??
      (await this.messageRepo.save({
        conversation: { id },
        role: 'USER',
        action: null,
        content: promptMessage,
        plan: null,
      }));
    const userTurnAt = new Date();
    await this.conversationRepo.update(
      { id: conversation.id },
      { updated_at: userTurnAt },
    );
    conversation.updated_at = userTurnAt;
    const history = await this.loadAssistantHistory(id, userMessage.id);
    const assistant = await this.callReportAssistant({
      userId,
      conversationId: conversation.id,
      turnId: userMessage.id,
      token,
      mode: confirmedPlan ? 'CONFIRM_PLAN' : 'MESSAGE',
      message: promptMessage,
      ...(confirmedPlan ? {} : { historySeed: history }),
      ...(confirmedPlan ? { confirmedPlan } : {}),
      ...(confirmedPlan
        ? {
            fileName: buildAdminReportFileName(
              'CONVERSATIONAL' as ReportType,
              confirmedPlan.fromDate,
              confirmedPlan.toDate,
            ),
          }
        : {}),
    });
    return this.saveAssistantTurn({
      userId,
      conversation,
      userMessage,
      assistant,
      sourceRequest: confirmedPlan?.query ?? promptMessage,
      ...(confirmedPlan ? { confirmedPlan } : {}),
    });
  }

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
