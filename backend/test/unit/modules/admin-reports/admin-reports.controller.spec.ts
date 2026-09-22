import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { AdminReportsController } from 'src/modules/admin-reports/admin-reports.controller';
import {
  BodyGenerateAdminReportDto,
  DateRangePreset,
  ReportType,
} from 'src/modules/admin-reports/dto/request/bodyGenerateAdminReport.dto';

describe('AdminReportsController', () => {
  const adminReportsService = {
    generate: jest.fn(),
    createAssistantConversation: jest.fn(),
    listAssistantConversations: jest.fn(),
    getAssistantConversation: jest.fn(),
    sendAssistantMessage: jest.fn(),
  };
  const controller = new AdminReportsController(adminReportsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates report generation with the authenticated user id', async () => {
    const body: BodyGenerateAdminReportDto = {
      reportType: ReportType.NEW_USER_REGISTRATIONS,
      rangePreset: DateRangePreset.TODAY,
    };
    const expected = { reportType: ReportType.NEW_USER_REGISTRATIONS };
    adminReportsService.generate.mockResolvedValue(expected);

    const request = { user: { userId: 9 } };
    const result = await controller.generate(request, body);

    expect(adminReportsService.generate).toHaveBeenCalledWith(9, body);
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

  it('delegates assistant routes with the authenticated owner and forwarded token', async () => {
    const request = {
      user: { userId: 9 },
      headers: { authorization: 'Bearer admin-access-token' },
    };
    const createBody = { message: 'Compare appointments.' };
    const messageBody = { confirmPlanMessageId: 17 };
    const created = { conversation: { id: 21 } };

    adminReportsService.createAssistantConversation.mockResolvedValue(created);
    await expect(
      controller.createAssistantConversation(request, createBody),
    ).resolves.toBe(created);
    expect(
      adminReportsService.createAssistantConversation,
    ).toHaveBeenCalledWith(9, 'admin-access-token', createBody);

    adminReportsService.listAssistantConversations.mockResolvedValue({
      conversations: [],
    });
    await controller.listAssistantConversations(request, '2', '40');
    expect(adminReportsService.listAssistantConversations).toHaveBeenCalledWith(
      9,
      2,
      40,
    );

    adminReportsService.getAssistantConversation.mockResolvedValue({
      messages: [],
    });
    await controller.getAssistantConversation(request, 21, '15', '50');
    expect(adminReportsService.getAssistantConversation).toHaveBeenCalledWith(
      9,
      21,
      15,
      50,
    );

    adminReportsService.sendAssistantMessage.mockResolvedValue({
      assistantMessage: { action: 'GENERATE_REPORT' },
    });
    await controller.sendAssistantMessage(request, 21, messageBody);
    expect(adminReportsService.sendAssistantMessage).toHaveBeenCalledWith(
      9,
      'admin-access-token',
      21,
      messageBody,
    );
  });

  it('uses the existing report permission for every assistant route', () => {
    for (const method of [
      'createAssistantConversation',
      'listAssistantConversations',
      'getAssistantConversation',
      'sendAssistantMessage',
    ] as const) {
      expect(
        Reflect.getMetadata(
          PERMISSIONS_KEY,
          AdminReportsController.prototype[method],
        ),
      ).toEqual([PERMISSIONS.AI_COACH_REPORT_READ]);
    }
  });
});
