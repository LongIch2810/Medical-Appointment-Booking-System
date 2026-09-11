import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { AuditLogsController } from 'src/modules/audit-logs/audit-logs.controller';

describe('AuditLogsController', () => {
  const auditLogsService = {
    filterAndPagination: jest.fn(),
  };
  const controller = new AuditLogsController(auditLogsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists audit logs with filters and pagination', () => {
    const filters = { page: 1 } as never;
    const expected = { items: [], total: 0 };
    auditLogsService.filterAndPagination.mockReturnValue(expected);

    const result = controller.filterAndPagination(filters);

    expect(auditLogsService.filterAndPagination).toHaveBeenCalledWith(
      filters,
    );
    expect(result).toBe(expected);
  });
});

describe('AuditLogsController authorization metadata', () => {
  it('requires audit-log:read for filterAndPagination', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        AuditLogsController.prototype.filterAndPagination,
      ),
    ).toEqual([PERMISSIONS.AUDIT_LOG_READ]);
  });
});
