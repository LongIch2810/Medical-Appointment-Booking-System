import { SpecialtiesController } from 'src/modules/specialties/specialties.controller';

describe('SpecialtiesController', () => {
  const specialtiesService = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getSpecialtyDetail: jest.fn(),
    filterAndPagination: jest.fn(),
  };
  const cloudinaryService = {
    uploadFile: jest.fn(),
  };
  const controller = new SpecialtiesController(
    specialtiesService as never,
    cloudinaryService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSpecialty', () => {
    it('uploads the file then creates the specialty with the resulting img_url', async () => {
      const body = { name: 'Cardiology' } as never;
      const file = { originalname: 'logo.png' } as Express.Multer.File;
      cloudinaryService.uploadFile.mockResolvedValue({
        secure_url: 'https://cdn.example.com/logo.png',
      });
      const expected = {
        specialtyId: 1,
        name: 'Cardiology',
        img_url: 'https://cdn.example.com/logo.png',
      };
      specialtiesService.create.mockResolvedValue(expected);

      const result = await controller.createSpecialty(body, file);

      expect(cloudinaryService.uploadFile).toHaveBeenCalledWith(file);
      expect(specialtiesService.create).toHaveBeenCalledWith({
        name: 'Cardiology',
        img_url: 'https://cdn.example.com/logo.png',
      });
      expect(result).toBe(expected);
    });
  });

  describe('updateSpecialty', () => {
    it('delegates to specialtiesService.update with specialtyId and body', async () => {
      const body = { name: 'Neurology' } as never;
      const expected = { specialtyId: 1, name: 'Neurology' };
      specialtiesService.update.mockResolvedValue(expected);

      const result = await controller.updateSpecialty(1, body);

      expect(specialtiesService.update).toHaveBeenCalledWith(1, body);
      expect(result).toBe(expected);
    });
  });

  describe('deleteSpecialty', () => {
    it('delegates to specialtiesService.delete with the specialtyId', async () => {
      const expected = { message: 'deleted' };
      specialtiesService.delete.mockResolvedValue(expected);

      const result = await controller.deleteSpecialty(1);

      expect(specialtiesService.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('getSpecialty', () => {
    it('delegates to specialtiesService.getSpecialtyDetail with the specialtyId', async () => {
      const expected = { specialtyId: 1, name: 'Cardiology' };
      specialtiesService.getSpecialtyDetail.mockResolvedValue(expected);

      const result = await controller.getSpecialty(1);

      expect(specialtiesService.getSpecialtyDetail).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('getSpecialties', () => {
    it('delegates to specialtiesService.filterAndPagination with the request body', async () => {
      const body = { page: 1, limit: 10 } as never;
      const expected = { data: [], total: 0 };
      specialtiesService.filterAndPagination.mockResolvedValue(expected);

      const result = await controller.getSpecialties(body);

      expect(specialtiesService.filterAndPagination).toHaveBeenCalledWith(
        body,
      );
      expect(result).toBe(expected);
    });
  });
});
