import {
  Body,
  Controller,
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
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyCreateSatisfactionRating } from './dto/request/bodyCreateSatisfactionRating.dto';
import { BodyFilterSatisfactionRatingsDto } from './dto/request/bodyFilterSatisfactionRatings.dto';
import { BodyUpdateSatisfactionRatingDto } from './dto/request/bodyUpdateSatisfactionRating.dto';
import { SatisfactionRatingService } from './satisfaction-rating.service';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';

@Controller('satisfaction-rating')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SatisfactionRatingController {
  constructor(
    private readonly satisfactionRatingService: SatisfactionRatingService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.SATISFACTION_RATING_READ)
  async getSatisfactionRatings(
    @Body() bodyFilterSatisfactionRatings: BodyFilterSatisfactionRatingsDto,
  ) {
    return this.satisfactionRatingService.filterAndPagination(
      bodyFilterSatisfactionRatings,
    );
  }

  @Post('create-rating')
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.SATISFACTION_RATING_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'satisfaction-rating' })
  async createSatisfactionRating(
    @Request() req,
    @Body() bodyCreateSatisfactionRating: BodyCreateSatisfactionRating,
  ) {
    const { userId } = req.user;
    return this.satisfactionRatingService.create(
      userId,
      bodyCreateSatisfactionRating,
    );
  }

  @Get(':ratingId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.SATISFACTION_RATING_READ)
  async getSatisfactionRatingDetail(
    @Param('ratingId', ParseIntPipe) ratingId: number,
  ) {
    return this.satisfactionRatingService.findById(ratingId);
  }

  @Patch(':ratingId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.SATISFACTION_RATING_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'satisfaction-rating' })
  async updateSatisfactionRating(
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @Body() bodyUpdateSatisfactionRating: BodyUpdateSatisfactionRatingDto,
  ) {
    return this.satisfactionRatingService.update(
      ratingId,
      bodyUpdateSatisfactionRating,
    );
  }
}
