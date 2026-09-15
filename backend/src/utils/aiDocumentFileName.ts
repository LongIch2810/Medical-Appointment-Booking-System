import { ReportType } from 'src/modules/admin-reports/dto/request/bodyGenerateAdminReport.dto';

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const MAX_AI_FILE_NAME_LENGTH = 150;

const REPORT_TYPE_FILE_SLUGS: Record<ReportType, string> = {
  NEW_USER_REGISTRATIONS: 'dang-ky-nguoi-dung',
  AI_COACH_ACTIVITY: 'hoat-dong-ai-coach',
  HEALTH_TRENDS: 'xu-huong-suc-khoe',
  BOOKING_CANCELLATION_NOSHOW: 'dat-lich-huy-no-show',
  PATIENT_FLOW_BY_TIMESLOT: 'luu-luong-khung-gio',
  APPOINTMENTS_BY_SPECIALTY: 'lich-hen-chuyen-khoa',
  DOCTOR_FILL_RATE: 'ty-le-lap-day-bac-si',
  USER_DEMOGRAPHICS: 'nhan-khau-hoc',
};

function formatVietnamTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  );
  const milliseconds = String(date.getTime() % 1000).padStart(3, '0');
  return `${values.year}${values.month}${values.day}-${values.hour}${values.minute}${values.second}${milliseconds}`;
}

export function sanitizeAiDocumentFileName(value: string, extension = 'pdf') {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/gi, 'd')
    .replace(/(?:\.[a-z0-9]+)+$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, MAX_AI_FILE_NAME_LENGTH)
    .replace(/-+$/g, '');

  return `${normalized || 'ai-document'}.${extension.replace(/^\./, '').toLowerCase()}`;
}

export function buildAdminReportFileName(
  reportType: ReportType,
  fromDate: string,
  toDate: string,
  createdAt = new Date(),
) {
  const typeSlug = REPORT_TYPE_FILE_SLUGS[reportType] || 'tong-hop';
  return sanitizeAiDocumentFileName(
    `bao-cao-${typeSlug}-${fromDate}-den-${toDate}-${formatVietnamTime(createdAt)}`,
  );
}

export function buildHealthRoadmapFileName(
  relativeId: number,
  createdAt = new Date(),
) {
  return sanitizeAiDocumentFileName(
    `lo-trinh-suc-khoe-ho-so-${relativeId}-${formatVietnamTime(createdAt)}`,
  );
}
