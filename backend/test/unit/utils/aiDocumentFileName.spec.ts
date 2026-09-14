import {
  buildAdminReportFileName,
  buildHealthRoadmapFileName,
  buildMedicalRecordSummaryFileName,
  sanitizeAiDocumentFileName,
} from 'src/utils/aiDocumentFileName';
import { ReportType } from 'src/modules/admin-reports/dto/request/bodyGenerateAdminReport.dto';

describe('AI document file names', () => {
  const createdAt = new Date('2026-09-13T07:30:25.123Z');

  it('sanitizes Vietnamese text, paths, special characters, duplicate extensions, and long names', () => {
    expect(
      sanitizeAiDocumentFileName('C:\\fake/path/Báo cáo \u0111ăng ký.pdf.pdf'),
    ).toBe('c-fake-path-bao-cao-dang-ky.pdf');

    const longFileName = sanitizeAiDocumentFileName('x'.repeat(220));
    expect(longFileName).toMatch(/^[a-z0-9-]+\.pdf$/);
    expect(longFileName.length).toBeLessThanOrEqual(154);
  });

  it.each([
    [ReportType.NEW_USER_REGISTRATIONS, 'dang-ky-nguoi-dung'],
    [ReportType.AI_COACH_ACTIVITY, 'hoat-dong-ai-coach'],
    [ReportType.HEALTH_TRENDS, 'xu-huong-suc-khoe'],
    [ReportType.BOOKING_CANCELLATION_NOSHOW, 'dat-lich-huy-no-show'],
    [ReportType.PATIENT_FLOW_BY_TIMESLOT, 'luu-luong-khung-gio'],
    [ReportType.APPOINTMENTS_BY_SPECIALTY, 'lich-hen-chuyen-khoa'],
    [ReportType.DOCTOR_FILL_RATE, 'ty-le-lap-day-bac-si'],
    [ReportType.USER_DEMOGRAPHICS, 'nhan-khau-hoc'],
  ])('builds the canonical admin report name for %s', (reportType, slug) => {
    expect(
      buildAdminReportFileName(
        reportType,
        '2026-09-01',
        '2026-09-13',
        createdAt,
      ),
    ).toBe(`bao-cao-${slug}-2026-09-01-den-2026-09-13-20260913-143025123.pdf`);
  });

  it('builds health roadmap and medical summary names without personal information', () => {
    expect(buildHealthRoadmapFileName(42, createdAt)).toBe(
      'lo-trinh-suc-khoe-ho-so-42-20260913-143025123.pdf',
    );
    expect(buildMedicalRecordSummaryFileName(createdAt)).toBe(
      'tom-tat-benh-an-20260913-143025123.pdf',
    );
  });
});
