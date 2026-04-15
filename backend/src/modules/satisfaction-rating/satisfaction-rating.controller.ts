import {
  Body,
  Controller,
  Get,
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

@Controller('satisfaction-rating')
@UseGuards(JwtAuthGuard)
export class SatisfactionRatingController {
  constructor(
    private readonly satisfactionRatingService: SatisfactionRatingService,
  ) {}

  @Post()
  async getSatisfactionRatings(
    @Body() bodyFilterSatisfactionRatings: BodyFilterSatisfactionRatingsDto,
  ) {
    return this.satisfactionRatingService.filterAndPagination(
      bodyFilterSatisfactionRatings,
    );
  }

  @Post('create-rating')
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
  async getSatisfactionRatingDetail(
    @Param('ratingId', ParseIntPipe) ratingId: number,
  ) {
    return this.satisfactionRatingService.findById(ratingId);
  }

  @Patch(':ratingId')
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
