import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyCreateTagDto } from './dto/request/bodyCreateTag.dto';
import { BodyFilterTagsDto } from './dto/request/bodyFilterTags.dto';
import { BodyUpdateTagDto } from './dto/request/bodyUpdateTag.dto';
import { TagsService } from './tags.service';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  async getTags(@Body() bodyFilterTags: BodyFilterTagsDto) {
    return this.tagsService.filterAndPagination(bodyFilterTags);
  }

  @Post('create-tag')
  async createTag(@Body() bodyCreateTag: BodyCreateTagDto) {
    return this.tagsService.create(bodyCreateTag);
  }

  @Get(':tagId')
  async getTagDetail(@Param('tagId', ParseIntPipe) tagId: number) {
    return this.tagsService.findById(tagId);
  }

  @Patch(':tagId')
  async updateTag(
    @Param('tagId', ParseIntPipe) tagId: number,
    @Body() bodyUpdateTag: BodyUpdateTagDto,
  ) {
    return this.tagsService.update(tagId, bodyUpdateTag);
  }

  @Delete(':tagId')
  async deleteTag(@Param('tagId', ParseIntPipe) tagId: number) {
    return this.tagsService.remove(tagId);
  }
}
