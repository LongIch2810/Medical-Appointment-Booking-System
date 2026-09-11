import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { ExaminationResultController } from 'src/modules/examination-result/examination-result.controller';

describe('ExaminationResultController', () => {
  const examinationResultService = {
    filterAndPagination: jest.fn(),
    create: jest.fn(),
    findExaminationResultsByUserId: jest.fn(),
    getExaminationResultDetail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findExaminationResultsByDoctorUserId: jest.fn(),
  };
  const controller = new ExaminationResultController(
    examinationResultService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists examination results with filters and pagination', async () => {
    const filters = { page: 1 } as never;
    examinationResultService.filterAndPagination.mockResolvedValue({
      items: [],
    });

    const result = await controller.getExaminationResults(filters);

    expect(examinationResultService.filterAndPagination).toHaveBeenCalledWith(
      filters,
    );
    expect(result).toEqual({ items: [] });
  });

  it('creates an examination result for the authenticated user', async () => {
    const body = { diagnosis: 'flu' } as never;
    examinationResultService.create.mockResolvedValue({ id: 1 });

    const result = await controller.createExaminationResult(
      { user: { userId: 7 } } as never,
      body,
    );

    expect(examinationResultService.create).toHaveBeenCalledWith(7, body);
    expect(result).toEqual({ id: 1 });
  });

  it("lists the authenticated user's personal examination results", async () => {
    const filters = { page: 1 } as never;
    examinationResultService.findExaminationResultsByUserId.mockResolvedValue(
      { items: [] },
    );

    const result = await controller.getPersonalExaminationResults(
      { user: { userId: 7 } } as never,
      filters,
    );

    expect(
      examinationResultService.findExaminationResultsByUserId,
    ).toHaveBeenCalledWith(7, filters);
    expect(result).toEqual({ items: [] });
  });

  it('gets an examination result detail', async () => {
    examinationResultService.getExaminationResultDetail.mockResolvedValue({
      id: 3,
    });

    const result = await controller.getExaminationResultDetail(3);

    expect(
      examinationResultService.getExaminationResultDetail,
    ).toHaveBeenCalledWith(3);
    expect(result).toEqual({ id: 3 });
  });

  it('updates an examination result', async () => {
    const body = { diagnosis: 'cold' } as never;
    examinationResultService.update.mockResolvedValue({ id: 3 });

    const result = await controller.updateExaminationResult(
      { user: { userId: 7 } } as never,
      3,
      body,
    );

    expect(examinationResultService.update).toHaveBeenCalledWith(7, 3, body);
    expect(result).toEqual({ id: 3 });
  });

  it('deletes an examination result', async () => {
    examinationResultService.remove.mockResolvedValue({ message: 'removed' });

    const result = await controller.deleteExaminationResult(
      { user: { userId: 7 } } as never,
      3,
    );

    expect(examinationResultService.remove).toHaveBeenCalledWith(7, 3);
    expect(result).toEqual({ message: 'removed' });
  });

  it("lists examination results created by the authenticated doctor", async () => {
    const filters = { page: 1 } as never;
    examinationResultService.findExaminationResultsByDoctorUserId.mockResolvedValue(
      { items: [] },
    );

    const result = await controller.getDoctorExaminationResults(
      { user: { userId: 9 } } as never,
      filters,
    );

    expect(
      examinationResultService.findExaminationResultsByDoctorUserId,
    ).toHaveBeenCalledWith(9, filters);
    expect(result).toEqual({ items: [] });
  });
});

describe('ExaminationResultController authorization metadata', () => {
  it.each([
    ['getExaminationResults', PERMISSIONS.EXAMINATION_RESULT_READ],
    ['createExaminationResult', PERMISSIONS.EXAMINATION_RESULT_CREATE],
    ['getPersonalExaminationResults', PERMISSIONS.EXAMINATION_RESULT_READ],
    ['getExaminationResultDetail', PERMISSIONS.EXAMINATION_RESULT_READ],
    ['updateExaminationResult', PERMISSIONS.EXAMINATION_RESULT_UPDATE],
    ['deleteExaminationResult', PERMISSIONS.EXAMINATION_RESULT_DELETE],
    ['getDoctorExaminationResults', PERMISSIONS.EXAMINATION_RESULT_READ],
  ] as const)('requires %s permission for %s', (method, permission) => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        ExaminationResultController.prototype[method],
      ),
    ).toEqual([permission]);
  });
});
