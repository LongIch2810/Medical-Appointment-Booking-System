import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BodyFilterDoctorsDto } from './dto/request/bodyFilterDoctors.dto';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyCreateDoctorDto } from './dto/request/bodyCreateDoctor.dto';
import { BodyUpdateDoctorDto } from './dto/request/bodyUpdateDoctor.dto';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @ApiOperation({ summary: 'Danh sách bác sĩ (phân trang, lọc)' })
  @Post()
  @HttpCode(HttpStatus.OK)
  async getFilterDoctors(@Body() bodyFilterDoctor: BodyFilterDoctorsDto) {
    const result =
      await this.doctorsService.filterAndPagination(bodyFilterDoctor);
    return result;
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: 'Tạo hồ sơ bác sĩ' })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.DOCTOR_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'doctors' })
  async createDoctor(@Body() body: BodyCreateDoctorDto) {
    return this.doctorsService.create(body);
  }

  @ApiOperation({ summary: 'Danh sách bác sĩ nổi bật' })
  @Get('outstanding-doctors')
  @HttpCode(HttpStatus.OK)
  async getOutstandingDoctors() {
    console.log('Fetching outstanding doctors...');
    const outstandingDoctors =
      await this.doctorsService.getOutstandingDoctors();
    return outstandingDoctors;
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.DOCTOR_READ)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Chi tiết bác sĩ' })
  @Get(':doctorId')
  @HttpCode(HttpStatus.OK)
  async getDoctorDetail(@Param('doctorId', ParseIntPipe) doctorId: number) {
    const doctorDetail = await this.doctorsService.getDoctorDetail(doctorId);
    return doctorDetail;
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.DOCTOR_UPDATE)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Cập nhật hồ sơ bác sĩ' })
  @Patch(':doctorId')
  @HttpCode(HttpStatus.OK)
  @AuditLogAction({ action: 'UPDATE', entityName: 'doctors' })
  async updateDoctor(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Body() body: BodyUpdateDoctorDto,
  ) {
    return this.doctorsService.update(doctorId, body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.DOCTOR_DELETE)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Xóa hồ sơ bác sĩ' })
  @Delete(':doctorId')
  @HttpCode(HttpStatus.OK)
  @AuditLogAction({ action: 'DELETE', entityName: 'doctors' })
  async deleteDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.doctorsService.remove(doctorId);
  }
}
