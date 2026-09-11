import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { DoctorsController } from 'src/modules/doctors/doctors.controller';

describe('DoctorsController', () => {
  const doctorsService = {
    filterAndPagination: jest.fn(),
    create: jest.fn(),
    getOutstandingDoctors: jest.fn(),
    getDoctorDetail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new DoctorsController(doctorsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists doctors with filters and pagination', async () => {
    const filters = { page: 1 } as never;
    doctorsService.filterAndPagination.mockResolvedValue({ items: [] });

    const result = await controller.getFilterDoctors(filters);

    expect(doctorsService.filterAndPagination).toHaveBeenCalledWith(filters);
    expect(result).toEqual({ items: [] });
  });

  it('creates a doctor profile', async () => {
    const body = { name: 'Dr. A' } as never;
    doctorsService.create.mockResolvedValue({ id: 1 });

    const result = await controller.createDoctor(body);

    expect(doctorsService.create).toHaveBeenCalledWith(body);
    expect(result).toEqual({ id: 1 });
  });

  it('lists outstanding doctors', async () => {
    doctorsService.getOutstandingDoctors.mockResolvedValue([{ id: 1 }]);

    const result = await controller.getOutstandingDoctors();

    expect(doctorsService.getOutstandingDoctors).toHaveBeenCalledWith();
    expect(result).toEqual([{ id: 1 }]);
  });

  it('gets a doctor detail', async () => {
    doctorsService.getDoctorDetail.mockResolvedValue({ id: 3 });

    const result = await controller.getDoctorDetail(3);

    expect(doctorsService.getDoctorDetail).toHaveBeenCalledWith(3);
    expect(result).toEqual({ id: 3 });
  });

  it('updates a doctor profile', async () => {
    const body = { name: 'Dr. B' } as never;
    doctorsService.update.mockResolvedValue({ id: 3 });

    const result = await controller.updateDoctor(3, body);

    expect(doctorsService.update).toHaveBeenCalledWith(3, body);
    expect(result).toEqual({ id: 3 });
  });

  it('deletes a doctor profile', async () => {
    doctorsService.remove.mockResolvedValue({ message: 'removed' });

    const result = await controller.deleteDoctor(3);

    expect(doctorsService.remove).toHaveBeenCalledWith(3);
    expect(result).toEqual({ message: 'removed' });
  });
});

describe('DoctorsController authorization metadata', () => {
  it.each([
    ['createDoctor', PERMISSIONS.DOCTOR_CREATE],
    ['getDoctorDetail', PERMISSIONS.DOCTOR_READ],
    ['updateDoctor', PERMISSIONS.DOCTOR_UPDATE],
    ['deleteDoctor', PERMISSIONS.DOCTOR_DELETE],
  ] as const)('requires %s permission for %s', (method, permission) => {
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, DoctorsController.prototype[method]),
    ).toEqual([permission]);
  });
});
