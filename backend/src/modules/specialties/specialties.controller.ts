import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SpecialtiesService } from './specialties.service';
import { CloudinaryService } from 'src/uploads/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyCreateSpecialtyDto } from './dto/request/bodyCreateSpecialty.dto';
import { diskStorage } from 'multer';
import { FileRequiredInterceptor } from 'src/common/interceptors/fileRequiredInterceptor.interceptor';
import { BodyFilterSpecialtiesDto } from './dto/request/bodyFilterSpecialties.dto';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { BodyUpdateSpecialtyDto } from './dto/request/bodyUpdateSpecialty.dto';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';

@ApiTags('specialties')
@Controller('specialties')
export class SpecialtiesController {
  constructor(
    private specialtiesService: SpecialtiesService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @ApiOperation({ summary: 'Tạo chuyên khoa' })
  @ApiCookieAuth()
  @Post('create-specialty')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.SPECIALTY_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'specialties' })
  @UseInterceptors(new FileRequiredInterceptor())
  async createSpecialty(
    @Body() bodyCreateSpecialty: BodyCreateSpecialtyDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const uploadedResult = await this.cloudinaryService.uploadFile(file);
    const createdSpecialty = await this.specialtiesService.create({
      ...bodyCreateSpecialty,
      img_url: uploadedResult.secure_url,
    });
    return createdSpecialty;
  }

  @ApiOperation({ summary: 'Cập nhật chuyên khoa' })
  @ApiCookieAuth()
  @Patch(':specialtyId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.SPECIALTY_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'specialties' })
  async updateSpecialty(
    @Param('specialtyId') specialtyId: number,
    @Body() bodyUpdateSpecialty: BodyUpdateSpecialtyDto,
  ) {
    return this.specialtiesService.update(specialtyId, bodyUpdateSpecialty);
  }

  @ApiOperation({ summary: 'Xóa chuyên khoa' })
  @ApiCookieAuth()
  @Delete(':specialtyId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.SPECIALTY_DELETE)
  @AuditLogAction({ action: 'DELETE', entityName: 'specialties' })
  async deleteSpecialty(@Param('specialtyId') specialtyId: number) {
    const deletedSpecialty = await this.specialtiesService.delete(specialtyId);
    return deletedSpecialty;
  }

  @ApiOperation({ summary: 'Chi tiết chuyên khoa' })
  @ApiCookieAuth()
  @Get(':specialtyId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.SPECIALTY_READ)
  async getSpecialty(@Param('specialtyId') specialtyId: number) {
    const specialtyDetail =
      await this.specialtiesService.getSpecialtyDetail(specialtyId);
    return specialtyDetail;
  }

  @ApiOperation({ summary: 'Danh sách chuyên khoa (phân trang, lọc)' })
  @Post()
  @HttpCode(HttpStatus.OK)
  async getSpecialties(
    @Body() bodyFilterSpecialties: BodyFilterSpecialtiesDto,
  ) {
    const result = await this.specialtiesService.filterAndPagination(
      bodyFilterSpecialties,
    );
    return result;
  }
}
