import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { AppointmentsController } from 'src/modules/appointments/appointments.controller';

describe('AppointmentsController', () => {
  const appointmentsService = {
    createWithNotifications: jest.fn(),
    cancel: jest.fn(),
    findPersonalAppointments: jest.fn(),
    getAppointmentDetail: jest.fn(),
    filterAndPaginationOfAdmin: jest.fn(),
    findAndPaginationOfDoctor: jest.fn(),
    updateStatus: jest.fn(),
  };
  const controller = new AppointmentsController(appointmentsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an appointment for the authenticated user', async () => {
    const body = { doctorId: 1 } as never;
    appointmentsService.createWithNotifications.mockResolvedValue({
      id: 10,
    });

    const result = await controller.createAppointment(body, {
      user: { userId: 7 },
    } as never);

    expect(appointmentsService.createWithNotifications).toHaveBeenCalledWith(
      7,
      body,
    );
    expect(result).toEqual({ id: 10 });
  });

  it('cancels an appointment for the authenticated user', async () => {
    appointmentsService.cancel.mockResolvedValue({ message: 'cancelled' });

    const result = await controller.cancelAppointment(5, {
      user: { userId: 7 },
    } as never);

    expect(appointmentsService.cancel).toHaveBeenCalledWith(7, 5);
    expect(result).toEqual({ message: 'cancelled' });
  });

  it("lists the authenticated user's personal appointments", async () => {
    const filters = { page: 1 } as never;
    appointmentsService.findPersonalAppointments.mockResolvedValue({
      items: [],
    });

    const result = await controller.getPersonalAppointments(
      { user: { userId: 7 } } as never,
      filters,
    );

    expect(appointmentsService.findPersonalAppointments).toHaveBeenCalledWith(
      7,
      filters,
    );
    expect(result).toEqual({ items: [] });
  });

  it('gets an appointment detail for the authenticated user', async () => {
    appointmentsService.getAppointmentDetail.mockResolvedValue({ id: 3 });

    const result = await controller.getAppointmentDetail(
      { user: { userId: 7 } } as never,
      3,
    );

    expect(appointmentsService.getAppointmentDetail).toHaveBeenCalledWith(
      7,
      3,
    );
    expect(result).toEqual({ id: 3 });
  });

  it('lists appointments for admins without scoping by caller', async () => {
    const filters = { status: 'PENDING' } as never;
    appointmentsService.filterAndPaginationOfAdmin.mockResolvedValue({
      items: [],
    });

    const result = await controller.filterAndPaginationOfAdmin(
      { user: { userId: 7 } } as never,
      filters,
    );

    expect(appointmentsService.filterAndPaginationOfAdmin).toHaveBeenCalledWith(
      filters,
    );
    expect(result).toEqual({ items: [] });
  });

  it("lists the authenticated doctor's appointments", async () => {
    const filters = { status: 'PENDING' } as never;
    appointmentsService.findAndPaginationOfDoctor.mockResolvedValue({
      items: [],
    });

    const result = await controller.findAndPaginationOfDoctor(
      { user: { userId: 9 } } as never,
      filters,
    );

    expect(appointmentsService.findAndPaginationOfDoctor).toHaveBeenCalledWith(
      9,
      filters,
    );
    expect(result).toEqual({ items: [] });
  });

  it('updates appointment status with the caller identity and roles', async () => {
    appointmentsService.updateStatus.mockResolvedValue({ id: 5 });

    const result = await controller.updateAppointmentStatus(
      { user: { userId: 7, roles: ['doctor'] } } as never,
      5,
      { status: 'CONFIRMED' } as never,
    );

    expect(appointmentsService.updateStatus).toHaveBeenCalledWith(
      5,
      'CONFIRMED',
      7,
      ['doctor'],
    );
    expect(result).toEqual({ id: 5 });
  });
});

describe('AppointmentsController authorization metadata', () => {
  it.each([
    ['createAppointment', PERMISSIONS.APPOINTMENT_CREATE],
    ['cancelAppointment', PERMISSIONS.APPOINTMENT_CANCEL],
    ['getPersonalAppointments', PERMISSIONS.APPOINTMENT_READ],
    ['getAppointmentDetail', PERMISSIONS.APPOINTMENT_READ],
    ['filterAndPaginationOfAdmin', PERMISSIONS.APPOINTMENT_MANAGE],
    ['findAndPaginationOfDoctor', PERMISSIONS.APPOINTMENT_MANAGE],
    ['updateAppointmentStatus', PERMISSIONS.APPOINTMENT_UPDATE_STATUS],
  ] as const)('requires %s permission for %s', (method, permission) => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        AppointmentsController.prototype[method],
      ),
    ).toEqual([permission]);
  });
});
