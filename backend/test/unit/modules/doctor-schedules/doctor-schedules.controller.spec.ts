import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { DoctorSchedulesController } from 'src/modules/doctor-schedules/doctor-schedules.controller';

describe('DoctorSchedulesController', () => {
  const doctorSchedulesService = {
    getPersonalSchedules: jest.fn(),
    create: jest.fn(),
    getSchedulesByDoctorId: jest.fn(),
    update: jest.fn(),
    updateActive: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new DoctorSchedulesController(
    doctorSchedulesService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists the authenticated doctor's personal schedules", async () => {
    doctorSchedulesService.getPersonalSchedules.mockResolvedValue([{ id: 1 }]);

    const result = await controller.getPersonalSchedules({
      user: { userId: 7 },
    } as never);

    expect(doctorSchedulesService.getPersonalSchedules).toHaveBeenCalledWith(
      7,
    );
    expect(result).toEqual([{ id: 1 }]);
  });

  it('creates a schedule for the authenticated doctor', async () => {
    const body = { dayOfWeek: 1 } as never;
    doctorSchedulesService.create.mockResolvedValue({ id: 1 });

    const result = await controller.createSchedule(
      { user: { userId: 7 } } as never,
      body,
    );

    expect(doctorSchedulesService.create).toHaveBeenCalledWith(7, body);
    expect(result).toEqual({ id: 1 });
  });

  it('lists schedules for a given doctor', async () => {
    doctorSchedulesService.getSchedulesByDoctorId.mockResolvedValue([
      { id: 1 },
    ]);

    const result = await controller.getDoctorSchedules(5);

    expect(
      doctorSchedulesService.getSchedulesByDoctorId,
    ).toHaveBeenCalledWith(5);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('updates a schedule owned by the authenticated doctor', async () => {
    const body = { dayOfWeek: 2 } as never;
    doctorSchedulesService.update.mockResolvedValue({ id: 3 });

    const result = await controller.updateSchedule(
      { user: { userId: 7 } } as never,
      3,
      body,
    );

    expect(doctorSchedulesService.update).toHaveBeenCalledWith(7, 3, body);
    expect(result).toEqual({ id: 3 });
  });

  it('updates the active status of a schedule', async () => {
    doctorSchedulesService.updateActive.mockResolvedValue({ id: 3 });

    const result = await controller.updateScheduleStatus(
      { user: { userId: 7 } } as never,
      3,
      true,
    );

    expect(doctorSchedulesService.updateActive).toHaveBeenCalledWith(
      7,
      3,
      true,
    );
    expect(result).toEqual({ id: 3 });
  });

  it('deletes a schedule owned by the authenticated doctor', async () => {
    doctorSchedulesService.remove.mockResolvedValue({ message: 'removed' });

    const result = await controller.deleteSchedule(
      { user: { userId: 7 } } as never,
      3,
    );

    expect(doctorSchedulesService.remove).toHaveBeenCalledWith(7, 3);
    expect(result).toEqual({ message: 'removed' });
  });
});

describe('DoctorSchedulesController authorization metadata', () => {
  it.each([
    ['getPersonalSchedules', PERMISSIONS.DOCTOR_SCHEDULE_READ],
    ['createSchedule', PERMISSIONS.DOCTOR_SCHEDULE_CREATE],
    ['getDoctorSchedules', PERMISSIONS.DOCTOR_SCHEDULE_READ],
    ['updateSchedule', PERMISSIONS.DOCTOR_SCHEDULE_UPDATE],
    ['updateScheduleStatus', PERMISSIONS.DOCTOR_SCHEDULE_UPDATE_STATUS],
    ['deleteSchedule', PERMISSIONS.DOCTOR_SCHEDULE_DELETE],
  ] as const)('requires %s permission for %s', (method, permission) => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        DoctorSchedulesController.prototype[method],
      ),
    ).toEqual([permission]);
  });
});
