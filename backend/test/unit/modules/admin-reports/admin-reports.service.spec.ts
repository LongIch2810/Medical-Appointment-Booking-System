import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AdminReportsService } from 'src/modules/admin-reports/admin-reports.service';
import {
  BodyGenerateAdminReportDto,
  DateRangePreset,
  ReportType,
} from 'src/modules/admin-reports/dto/request/bodyGenerateAdminReport.dto';

jest.mock('axios');

describe('AdminReportsService', () => {
  let service: AdminReportsService;
  let configService: { get: jest.Mock; getOrThrow: jest.Mock };
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    configService = {
      get: jest.fn((key: string) =>
        key === 'CHATBOT_URL' ? 'http://chatbot.local' : undefined,
      ),
      getOrThrow: jest.fn((key: string) =>
        key === 'CHATBOT_INTERNAL_KEY' ? 'internal-key' : undefined,
      ),
    };
    service = new AdminReportsService(
      configService as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generate', () => {
    const asset = {
      publicId: 'ai-documents/results/report',
      resourceType: 'raw',
      format: 'pdf',
      fileName: 'report.pdf',
      bytes: 123,
    };

    it.each(Object.values(ReportType))(
      'builds a question for every report type: %s',
      async (reportType) => {
        mockedAxios.post.mockResolvedValue({ data: { data: {} } });

        await service.generate({
          reportType,
          rangePreset: DateRangePreset.THIS_YEAR,
        });

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            question: expect.stringContaining('01/01/2026'),
            fileName: expect.stringMatching(/\.pdf$/),
          }),
          expect.any(Object),
        );
      },
    );

    it.each([
      DateRangePreset.TODAY,
      DateRangePreset.THIS_WEEK,
      DateRangePreset.THIS_MONTH,
      DateRangePreset.THIS_YEAR,
      DateRangePreset.CUSTOM,
    ])('resolves the %s date preset', async (rangePreset) => {
      mockedAxios.post.mockResolvedValue({ data: { data: {} } });

      await service.generate({
        reportType: ReportType.NEW_USER_REGISTRATIONS,
        rangePreset,
        ...(rangePreset === DateRangePreset.CUSTOM
          ? { fromDate: '2026-05-01', toDate: '2026-10-31' }
          : {}),
      });

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          question: expect.stringContaining('2026'),
          fileName: expect.stringMatching(/\.pdf$/),
        }),
      );
    });

    it('resolves a TODAY preset range and posts the built question to the chatbot service', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-03-15T10:00:00.000Z'));
      mockedAxios.post.mockResolvedValue({
        data: {
          data: {
            pdfUrl: 'http://files/report.pdf',
            raw: {
              report: { title: 'Báo cáo' },
              chartConfig: { type: 'bar' },
              result: JSON.stringify([{ role: 'PATIENT', user_count: 3 }]),
            },
          },
        },
      });

      const dto: BodyGenerateAdminReportDto = {
        reportType: ReportType.NEW_USER_REGISTRATIONS,
        rangePreset: DateRangePreset.TODAY,
      };

      const result = await service.generate(dto);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://chatbot.local/chatbot/create-report',
        expect.objectContaining({
          question: expect.stringContaining('15/03/2026 đến 15/03/2026'),
          fileName: expect.stringMatching(/\.pdf$/),
        }),
        {
          timeout: 240_000,
          headers: { 'x-chatbot-internal-key': 'internal-key' },
        },
      );
      expect(result.reportType).toBe(ReportType.NEW_USER_REGISTRATIONS);
      expect(result.rangeLabel).toBe('15/03/2026 - 15/03/2026');
      expect(result.pdfUrl).toBe('http://files/report.pdf');
      expect(result.tableRows).toEqual([{ role: 'PATIENT', user_count: 3 }]);
      expect(result.tableColumns).toEqual([
        { key: 'role', label: 'Role' },
        { key: 'user_count', label: 'User Count' },
      ]);
    });

    it('resolves a CUSTOM preset using fromDate/toDate instead of the current date', async () => {
      mockedAxios.post.mockResolvedValue({ data: { data: {} } });

      const dto: BodyGenerateAdminReportDto = {
        reportType: ReportType.DOCTOR_FILL_RATE,
        rangePreset: DateRangePreset.CUSTOM,
        fromDate: '2026-01-10',
        toDate: '2026-01-15',
      };

      const result = await service.generate(dto);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          question: expect.stringContaining('10/01/2026 đến 15/01/2026'),
          fileName: expect.stringMatching(/\.pdf$/),
        }),
        expect.any(Object),
      );
      expect(result.rangeLabel).toBe('10/01/2026 - 15/01/2026');
    });

    it('defaults pdfUrl/report/chartConfig/tableRows when the chatbot response carries no data', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });

      const dto: BodyGenerateAdminReportDto = {
        reportType: ReportType.HEALTH_TRENDS,
        rangePreset: DateRangePreset.THIS_WEEK,
      };

      const result = await service.generate(dto);

      expect(result.pdfUrl).toBeNull();
      expect(result.report).toBeNull();
      expect(result.chartConfig).toBeNull();
      expect(result.tableRows).toEqual([]);
      expect(result.tableColumns).toEqual([]);
    });

    it('throws an HttpException using the upstream status/message when the chatbot call fails', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 502, data: { message: 'Chatbot unavailable' } },
      });

      const dto: BodyGenerateAdminReportDto = {
        reportType: ReportType.AI_COACH_ACTIVITY,
        rangePreset: DateRangePreset.THIS_MONTH,
      };

      await expect(service.generate(dto)).rejects.toBeInstanceOf(HttpException);
      await expect(service.generate(dto)).rejects.toMatchObject({
        message: 'Chatbot unavailable',
        status: 502,
      });
    });

    it('falls back to a default message and 500 status when the error has no response payload', async () => {
      mockedAxios.post.mockRejectedValue(new Error('network down'));

      const dto: BodyGenerateAdminReportDto = {
        reportType: ReportType.USER_DEMOGRAPHICS,
        rangePreset: DateRangePreset.THIS_YEAR,
      };

      await expect(service.generate(dto)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'AI_REPORT_GENERATION_FAILED',
        }),
        status: 500,
      });
    });

    it('persists a generated report and returns its history URL', async () => {
      const reportRepo = {
        save: jest.fn().mockImplementation(async (value) => ({
          ...value,
          id: 41,
          created_at: new Date('2026-09-14T00:00:00.000Z'),
        })),
      };
      const storage = { deleteAsset: jest.fn() };
      service = new AdminReportsService(
        configService as unknown as ConfigService,
        reportRepo as never,
        storage as never,
      );
      mockedAxios.post.mockResolvedValue({
        data: {
          data: {
            asset,
            raw: {
              report: { title: 'Report' },
              chartConfig: { type: 'bar' },
              result: '[{"total":3}]',
            },
          },
        },
      });

      const result = await service.generate(9, {
        reportType: ReportType.NEW_USER_REGISTRATIONS,
        rangePreset: DateRangePreset.TODAY,
      });

      expect(reportRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: { id: 9 },
          output_asset: asset,
          table_rows: [{ total: 3 }],
        }),
      );
      expect(result.pdfUrl).toBe('/api/v1/admin-reports/history/41/file');
      expect(storage.deleteAsset).not.toHaveBeenCalled();
    });

    it('returns a stable persistence error and deletes the uploaded asset when saving fails', async () => {
      const reportRepo = {
        save: jest.fn().mockRejectedValue(new Error('insert failed')),
      };
      const storage = { deleteAsset: jest.fn().mockResolvedValue(undefined) };
      service = new AdminReportsService(
        configService as unknown as ConfigService,
        reportRepo as never,
        storage as never,
      );
      mockedAxios.post.mockResolvedValue({
        data: { data: { asset, raw: {} } },
      });

      try {
        await service.generate(9, {
          reportType: ReportType.HEALTH_TRENDS,
          rangePreset: DateRangePreset.THIS_MONTH,
        });
        throw new Error('Expected generate to reject');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getResponse()).toEqual({
          code: 'AI_REPORT_PERSISTENCE_FAILED',
          message: 'Không thể lưu báo cáo AI lúc này. Vui lòng thử lại sau.',
        });
      }
      expect(storage.deleteAsset).toHaveBeenCalledWith(asset);
    });

    it('reads chatbot err/code fields instead of replacing the upstream error', async () => {
      mockedAxios.post.mockRejectedValue({
        response: {
          status: 503,
          data: { code: 'UPSTREAM_UNAVAILABLE', err: 'Chatbot unavailable' },
        },
      });

      try {
        await service.generate({
          reportType: ReportType.AI_COACH_ACTIVITY,
          rangePreset: DateRangePreset.THIS_MONTH,
        });
        throw new Error('Expected generate to reject');
      } catch (error) {
        expect((error as HttpException).getStatus()).toBe(503);
        expect((error as HttpException).getResponse()).toEqual({
          code: 'UPSTREAM_UNAVAILABLE',
          message: 'Chatbot unavailable',
        });
      }
    });
  });
});
