import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { AdminReportsController } from 'src/modules/admin-reports/admin-reports.controller';
import {
  BodyGenerateAdminReportDto,
  DateRangePreset,
  ReportType,
} from 'src/modules/admin-reports/dto/request/bodyGenerateAdminReport.dto';

describe('AdminReportsController', () => {
  const adminReportsService = { generate: jest.fn() };
  const controller = new AdminReportsController(
    adminReportsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates report generation to the service with the request body', async () => {
    const body: BodyGenerateAdminReportDto = {
      reportType: ReportType.NEW_USER_REGISTRATIONS,
      rangePreset: DateRangePreset.TODAY,
    };
    const expected = { reportType: ReportType.NEW_USER_REGISTRATIONS };
    adminReportsService.generate.mockResolvedValue(expected);

    const result = await controller.generate(body);

    expect(adminReportsService.generate).toHaveBeenCalledWith(body);
    expect(result).toBe(expected);
  });

  it('requires ai-coach-report:read on generate', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        AdminReportsController.prototype.generate,
      ),
    ).toEqual([PERMISSIONS.AI_COACH_REPORT_READ]);
  });
});
