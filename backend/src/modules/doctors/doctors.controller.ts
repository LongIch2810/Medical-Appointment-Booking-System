import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BodyFilterDoctorsDto } from './dto/request/bodyFilterDoctors.dto';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  async getFilterDoctors(@Body() bodyFilterDoctor: BodyFilterDoctorsDto) {
    const result =
      await this.doctorsService.filterAndPagination(bodyFilterDoctor);
    return result;
  }

  @Get('outstanding-doctors')
  async getOutstandingDoctors() {
    console.log('Fetching outstanding doctors...');
    const outstandingDoctors =
      await this.doctorsService.getOutstandingDoctors();
    return outstandingDoctors;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':doctorId')
  async getDoctorDetail(@Param('doctorId', ParseIntPipe) doctorId: number) {
    const doctorDetail = await this.doctorsService.getDoctorDetail(doctorId);
    return doctorDetail;
  }
}
