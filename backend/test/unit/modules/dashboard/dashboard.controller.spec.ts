import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { DashboardController } from 'src/modules/dashboard/dashboard.controller';

describe('DashboardController', () => {
  const dashboardService = {
    getPatientDashboard: jest.fn(),
    getDoctorDashboard: jest.fn(),
    getAdminDashboard: jest.fn(),
  };
  const controller = new DashboardController(dashboardService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the patient dashboard for the authenticated user', async () => {
    const expected = { healthProfilesCount: 2 };
    dashboardService.getPatientDashboard.mockResolvedValue(expected);

    const result = await controller.getPatientDashboard({
      user: { userId: 7 },
    });

    expect(dashboardService.getPatientDashboard).toHaveBeenCalledWith(7);
    expect(result).toBe(expected);
  });

  it('fetches the doctor dashboard for the authenticated user, resolving doctorId server-side', async () => {
    // JwtStrategy.validate() only ever puts {userId, roles} on req.user, so
    // the controller must not depend on a req.user.doctorId/doctor.id that
    // never gets set — the service resolves it from userId instead.
    const expected = { totalAppointmentsToDayCount: 4 };
    dashboardService.getDoctorDashboard.mockResolvedValue(expected);

    const result = await controller.getDoctorDashboard({
      user: { userId: 7 },
    });

    expect(dashboardService.getDoctorDashboard).toHaveBeenCalledWith(7);
    expect(result).toBe(expected);
  });

  it('fetches the admin dashboard for the authenticated user', async () => {
    const expected = { totalUsersCount: 100 };
    dashboardService.getAdminDashboard.mockResolvedValue(expected);

    const result = await controller.getAdminDashboard({
      user: { userId: 7 },
    });

    expect(dashboardService.getAdminDashboard).toHaveBeenCalledWith(7);
    expect(result).toBe(expected);
  });

  it('requires dashboard:patient / dashboard:doctor / dashboard:admin on their respective handlers', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        DashboardController.prototype.getPatientDashboard,
      ),
    ).toEqual([PERMISSIONS.DASHBOARD_PATIENT]);
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        DashboardController.prototype.getDoctorDashboard,
      ),
    ).toEqual([PERMISSIONS.DASHBOARD_DOCTOR]);
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        DashboardController.prototype.getAdminDashboard,
      ),
    ).toEqual([PERMISSIONS.DASHBOARD_ADMIN]);
  });
});
