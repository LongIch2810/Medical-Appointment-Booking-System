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
import * as bcrypt from 'bcryptjs';
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
import User from 'src/entities/user.entity';
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
    `Thá»‘ng kÃª sá»‘ lÆ°á»£ng ngÆ°á»i dÃ¹ng Ä‘Äƒng kÃ½ má»›i tá»« view chatbot_report_users_view, lá»c registration_date trong khoáº£ng ${from} Ä‘áº¿n ${to}; dÃ¹ng SUM(user_count), phÃ¢n loáº¡i theo roles vÃ  tá»«ng ngÃ y.`,
  [ReportType.AI_COACH_ACTIVITY]: (from, to) =>
    `Thá»‘ng kÃª sá»‘ lá»™ trÃ¬nh sá»©c khá»e AI Ä‘Æ°á»£c táº¡o tá»« view chatbot_report_health_roadmaps_view, lá»c roadmap_date trong khoáº£ng ${from} Ä‘áº¿n ${to}; dÃ¹ng SUM(roadmap_count), Ä‘á»“ng thá»i phÃ¢n tÃ­ch user_count vÃ  profile_count theo ngÃ y.`,
  [ReportType.HEALTH_TRENDS]: (from, to) =>
    `PhÃ¢n tÃ­ch xu hÆ°á»›ng tá»•ng há»£p tá»« view chatbot_report_health_profiles_view, lá»c profile_date trong khoáº£ng ${from} Ä‘áº¿n ${to}: average_height, average_weight, average_heart_rate, average_glucose_level, average_cholesterol_level vÃ  SUM(profile_count) theo ngÃ y; giÃ¡ trá»‹ NULL lÃ  nhÃ³m chÆ°a Ä‘á»§ 5 há»“ sÆ¡ vÃ  pháº£i Ä‘Æ°á»£c bá» qua.`,
  [ReportType.BOOKING_CANCELLATION_NOSHOW]: (from, to) =>
    `Thá»‘ng kÃª tá»« view chatbot_report_appointments_view, lá»c appointment_date trong khoáº£ng ${from} Ä‘áº¿n ${to}: dÃ¹ng SUM(appointment_count) Ä‘á»ƒ tÃ­nh tá»•ng sá»‘ lá»‹ch, tá»· lá»‡ status = 'CANCELLED', tá»· lá»‡ status = 'ABSENT', vÃ  sá»‘ lÆ°á»£ng theo status.`,
  [ReportType.PATIENT_FLOW_BY_TIMESLOT]: (from, to) =>
    `Thá»‘ng kÃª lÆ°u lÆ°á»£ng trong khoáº£ng ${from} Ä‘áº¿n ${to} báº±ng cÃ¡ch join chatbot_report_appointments_view vá»›i chatbot_report_doctor_schedules_view qua doctor_schedule_id; dÃ¹ng SUM(appointment_count), nhÃ³m theo start_time vÃ  day_of_week.`,
  [ReportType.APPOINTMENTS_BY_SPECIALTY]: (from, to) =>
    `Thá»‘ng kÃª lá»‹ch háº¹n theo specialty_name trong khoáº£ng ${from} Ä‘áº¿n ${to}, join cÃ¡c view chatbot_report_appointments_view, chatbot_report_doctor_schedules_view vÃ  chatbot_report_doctors_view; dÃ¹ng SUM(appointment_count).`,
  [ReportType.DOCTOR_FILL_RATE]: (from, to) =>
    `TÃ­nh tá»· lá»‡ láº¥p Ä‘áº§y lá»‹ch khÃ¡m theo tá»«ng doctor_name trong khoáº£ng ${from} Ä‘áº¿n ${to}, báº±ng cÃ¡ch join chatbot_report_doctors_view d vá»›i chatbot_report_doctor_schedules_view s qua d.id = s.doctor_id vÃ  LEFT JOIN chatbot_report_appointments_view a qua s.id = a.doctor_schedule_id. DÃ¹ng appointment_count Ä‘á»ƒ tÃ­nh tá»•ng lÆ°á»£t Ä‘áº·t; appointment status khÃ¡c 'CANCELLED' lÃ  lÆ°á»£t Ä‘áº·t há»£p lá»‡. Káº¿t quáº£ báº¯t buá»™c gá»“m doctor_name, tá»•ng appointment_count vÃ  tá»· lá»‡; má»i cá»™t khÃ´ng aggregate pháº£i náº±m trong GROUP BY, Ã­t nháº¥t GROUP BY d.doctor_name, khÃ´ng dÃ¹ng SELECT * vÃ  giá»›i háº¡n tá»‘i Ä‘a 1000 dÃ²ng.`,
  [ReportType.USER_DEMOGRAPHICS]: (from, to) =>
    `PhÃ¢n tÃ­ch dá»¯ liá»‡u tá»•ng há»£p Ä‘Ã£ khá»­ Ä‘á»‹nh danh tá»« chatbot_report_users_view, lá»c registration_date trong khoáº£ng ${from} Ä‘áº¿n ${to}: dÃ¹ng SUM(user_count) Ä‘á»ƒ tÃ­nh phÃ¢n bá»‘ theo gender, age_group vÃ  region.`,
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
          message: 'Trá»£ lÃ½ bÃ¡o cÃ¡o chÆ°a sáºµn sÃ ng.',
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
          typeof response.report.raw.chartConfig !== 'object') ||
        typeof response.report.raw.query !== 'string' ||
        !response.report.raw.query.trim() ||
        response.report.raw.query.length > 20_000)
    ) {
      throw new Error('invalid generated report payload');
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
    sourceRequest: string;
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
          sourceRequest: args.sourceRequest,
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
        [
          'invalid response',
          'invalid plan',
          'invalid generated report payload',
        ].includes(error.message)
      ) {
        throw new HttpException(
          {
            code: 'REPORT_ASSISTANT_INVALID_RESPONSE',
            message: 'AI tráº£ vá» káº¿t quáº£ khÃ´ng há»£p lá»‡.',
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
                ? 'KhÃ´ng thá»ƒ truy cáº­p sá»Ÿ thÃ­ch bÃ¡o cÃ¡o Ä‘Ã£ nhá»›.'
                : 'Trá»£ lÃ½ bÃ¡o cÃ¡o Ä‘ang táº¡m thá»i chÆ°a sáºµn sÃ ng.',
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
              ? 'Báº¡n Ä‘Ã£ gá»­i quÃ¡ nhiá»u yÃªu cáº§u. Vui lÃ²ng thá»­ láº¡i sau.'
              : status === 504
                ? 'AI chÆ°a pháº£n há»“i ká»‹p thá»i. Vui lÃ²ng thá»­ láº¡i.'
                : 'KhÃ´ng thá»ƒ xá»­ lÃ½ yÃªu cáº§u bÃ¡o cÃ¡o lÃºc nÃ y.',
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
              executed_query: raw.query,
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
          message: 'KhÃ´ng thá»ƒ lÆ°u káº¿t quáº£ trá»£ lÃ½ bÃ¡o cÃ¡o.',
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
        message: 'Tin nháº¯n khÃ´ng há»£p lá»‡.',
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
      sourceRequest: message,
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
          message: 'KhÃ´ng tÃ¬m tháº¥y há»™i thoáº¡i.',
        },
        404,
      );
    if (
      beforeMessageId !== undefined &&
      (!Number.isSafeInteger(beforeMessageId) || beforeMessageId < 1)
    ) {
      throw new BadRequestException({
        code: 'REPORT_ASSISTANT_INVALID_INPUT',
        message: 'MÃ£ tin nháº¯n khÃ´ng há»£p lá»‡.',
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
        message: 'Gá»­i tin nháº¯n hoáº·c xÃ¡c nháº­n káº¿ hoáº¡ch.',
      });
    }
    const conversation = await this.conversationRepo.findOne({
      where: { id, createdBy: { id: userId } },
    });
    if (!conversation)
      throw new HttpException(
        {
          code: 'REPORT_CONVERSATION_NOT_FOUND',
          message: 'KhÃ´ng tÃ¬m tháº¥y há»™i thoáº¡i.',
        },
        404,
      );

    let confirmedPlan: ReportPlan | undefined;
    let promptMessage: string;
    let sourceRequest: string;
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
            message: 'KhÃ´ng tÃ¬m tháº¥y káº¿ hoáº¡ch bÃ¡o cÃ¡o.',
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
              message: 'Káº¿ hoáº¡ch Ä‘Ã£ cÅ©. HÃ£y yÃªu cáº§u trá»£ lÃ½ láº­p káº¿ hoáº¡ch má»›i.',
            },
            409,
          );
        }
      }
      confirmedPlan = planMessage.plan;
      const requestMessage = await this.messageRepo.findOne({
        where: {
          conversation: { id },
          role: 'USER',
          id: LessThan(planMessage.id),
        },
        order: { id: 'DESC' },
      });
      sourceRequest = requestMessage?.content?.trim() || confirmedPlan.query;
    } else {
      promptMessage = dto.message!.trim();
      if (promptMessage.length > REPORT_ASSISTANT_MESSAGE_MAX_LENGTH) {
        throw new BadRequestException({
          code: 'REPORT_ASSISTANT_INVALID_INPUT',
          message: 'Tin nháº¯n khÃ´ng há»£p lá»‡.',
        });
      }
      if (!promptMessage)
        throw new BadRequestException({
          code: 'REPORT_ASSISTANT_INVALID_INPUT',
          message: 'Tin nháº¯n khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.',
        });
      sourceRequest = promptMessage;
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
      sourceRequest,
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
      sourceRequest,
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
          query: entity.executed_query,
        },
      },
      {
        id: entity.id,
        createdAt: entity.created_at,
        sourceRequest: entity.source_request,
        executedQuery: entity.executed_query,
        createdBy: entity.createdBy
          ? { id: entity.createdBy.id, fullname: entity.createdBy.fullname }
          : undefined,
        pdfUrl: `/api/v1/admin-reports/history/${entity.id}/file`,
      },
    );
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
    if (!row) throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y bÃ¡o cÃ¡o.');
    return this.toResponse(row);
  }

  async revealQuery(userId: number, id: number, password: string) {
    const row = await this.reportRepo.findOne({ where: { id } });
    if (!row?.executed_query) {
      throw new NotFoundException(
        'Không tìm thấy SQL đã thực thi của báo cáo.',
      );
    }
    const user = await this.reportRepo.manager.getRepository(User).findOne({
      where: { id: userId },
    });
    if (
      !user?.password ||
      !user.is_active ||
      user.is_locking ||
      !(await bcrypt.compare(password, user.password))
    ) {
      throw new HttpException(
        {
          code: 'REPORT_QUERY_PASSWORD_INVALID',
          message: 'Mật khẩu không đúng.',
        },
        403,
      );
    }
    return row.executed_query;
  }

  async file(id: number, download = false) {
    const row = await this.reportRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y bÃ¡o cÃ¡o.');
    return this.storage.getDownloadUrl(row.output_asset, download);
  }

  async remove(id: number, userId: number, roles: string[]) {
    const row = await this.reportRepo.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!row) throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y bÃ¡o cÃ¡o.');
    if (row.createdBy.id !== userId && !roles.includes('ADMIN'))
      throw new HttpException('Báº¡n khÃ´ng cÃ³ quyá»n xÃ³a bÃ¡o cÃ¡o nÃ y.', 403);
    await this.storage.deleteAsset(row.output_asset);
    await this.reportRepo.softDelete(id);
    return { success: true };
  }
}
