import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ChannelsService } from './channels.service';
import { BodyFilterChannelsDto } from './dto/request/bodyFilterChannels.dto';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post('/personal-channels')
  getPersonalChannels(
    @Request() req,
    @Body() objectFilters: BodyFilterChannelsDto,
  ) {
    const { userId } = req.user;
    return this.channelsService.findChannelsByUserId(userId, objectFilters);
  }

  @Get(':channelId')
  getChannelDetail(@Param('channelId', ParseIntPipe) channelId: number) {
    return this.channelsService.getChannel(channelId);
  }
}
