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
import { SpecialtiesService } from './specialties.service';
import { CloudinaryService } from 'src/uploads/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyCreateSpecialtyDto } from './dto/request/bodyCreateSpecialty.dto';
import { diskStorage } from 'multer';
import { FileRequiredInterceptor } from 'src/common/interceptors/fileRequiredInterceptor.interceptor';
import { BodyFilterSpecialtiesDto } from './dto/request/bodyFilterSpecialties.dto';

@Controller('specialties')
export class SpecialtiesController {
  constructor(
    private specialtiesService: SpecialtiesService,
    private cloudinaryService: CloudinaryService,
  ) { }

  @Post('create-specialty')
  @UseGuards(JwtAuthGuard)
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

  @Patch(':specialtyId')
  @UseGuards(JwtAuthGuard)
  async updateSpecialty() { }

  @Delete(':specialtyId')
  @UseGuards(JwtAuthGuard)
  async deleteSpecialty(
    @Param('specialtyId') specialtyId: number,
  ) {
    const deletedSpecialty = await this.specialtiesService.delete(specialtyId);
    return deletedSpecialty;
  }

  @Get(':specialtyId')
  @UseGuards(JwtAuthGuard)
  async getSpecialty(
    @Param('specialtyId') specialtyId: number,
  ) {
    const specialtyDetail = await this.specialtiesService.getSpecialtyDetail(specialtyId);
    return specialtyDetail;
  }

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
