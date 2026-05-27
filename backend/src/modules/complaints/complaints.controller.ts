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
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequestPaylaod } from 'src/shared/types/global.type';
import { PERMISSIONS } from 'src/utils/constants';
import { ComplaintsService } from './complaints.service';
import { BodyCreateComplaintDto } from './dto/request/bodyCreateComplaint.dto';
import { BodyFilterComplaintsDto } from './dto/request/bodyFilterComplaints.dto';
import { BodyUpdateComplaintDto } from './dto/request/bodyUpdateComplaint.dto';

@Controller('complaints')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.COMPLAINT_READ)
  @AuditLogAction({ action: 'READ', entityName: 'complaints' })
  filterAndPagination(@Body() objectFilters: BodyFilterComplaintsDto) {
    return this.complaintsService.filterAndPagination(objectFilters);
  }

  @Post('my')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.COMPLAINT_READ)
  myComplaints(@Request() req, @Body() objectFilters: BodyFilterComplaintsDto) {
    const { userId } = req.user as RequestPaylaod;
    return this.complaintsService.filterAndPagination({
      ...objectFilters,
      userId,
    });
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.COMPLAINT_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'complaints' })
  create(@Request() req, @Body() body: BodyCreateComplaintDto) {
    const { userId } = req.user as RequestPaylaod;
    return this.complaintsService.create({
      ...body,
      userId: body.userId ?? userId,
    });
  }

  @Get(':complaintId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.COMPLAINT_READ)
  findById(@Param('complaintId', ParseIntPipe) complaintId: number) {
    return this.complaintsService.findById(complaintId);
  }

  @Patch(':complaintId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.COMPLAINT_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'complaints' })
  update(
    @Param('complaintId', ParseIntPipe) complaintId: number,
    @Body() body: BodyUpdateComplaintDto,
  ) {
    return this.complaintsService.update(complaintId, body);
  }

  @Delete(':complaintId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.COMPLAINT_DELETE)
  @AuditLogAction({ action: 'DELETE', entityName: 'complaints' })
  remove(@Param('complaintId', ParseIntPipe) complaintId: number) {
    return this.complaintsService.remove(complaintId);
  }
}
