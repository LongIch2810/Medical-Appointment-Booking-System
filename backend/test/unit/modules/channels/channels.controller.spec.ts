import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { ChannelsController } from 'src/modules/channels/channels.controller';
import { BodyFilterChannelsDto } from 'src/modules/channels/dto/request/bodyFilterChannels.dto';

describe('ChannelsController', () => {
  const channelsService = {
    createChannel: jest.fn(),
    findChannelsByUserId: jest.fn(),
    getChannel: jest.fn(),
  };
  const controller = new ChannelsController(channelsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates channel creation to the service with the member ids and the authenticated requester id', () => {
    const memberIds = [1, 2];
    const expected = { id: 1 };
    channelsService.createChannel.mockReturnValue(expected);

    const result = controller.createChannel(
      { user: { userId: 1 } },
      { member_ids: memberIds },
    );

    expect(channelsService.createChannel).toHaveBeenCalledWith(memberIds, 1);
    expect(result).toBe(expected);
  });

  it('fetches personal channels scoped to the authenticated user', () => {
    const filters: BodyFilterChannelsDto = {
      page: 1,
      limit: 10,
      arrange: 'desc',
    } as BodyFilterChannelsDto;
    const expected = { channels: [] };
    channelsService.findChannelsByUserId.mockReturnValue(expected);

    const result = controller.getPersonalChannels(
      { user: { userId: 7 } },
      filters,
    );

    expect(channelsService.findChannelsByUserId).toHaveBeenCalledWith(
      7,
      filters,
    );
    expect(result).toBe(expected);
  });

  it("fetches a channel's detail scoped to the authenticated user", () => {
    const expected = { id: 3 };
    channelsService.getChannel.mockReturnValue(expected);

    const result = controller.getChannelDetail({ user: { userId: 7 } }, 3);

    expect(channelsService.getChannel).toHaveBeenCalledWith(3, 7);
    expect(result).toBe(expected);
  });

  it('requires channel:create for createChannel', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        ChannelsController.prototype.createChannel,
      ),
    ).toEqual([PERMISSIONS.CHANNEL_CREATE]);
  });

  it.each(['getPersonalChannels', 'getChannelDetail'] as const)(
    'requires channel:read for %s',
    (method) => {
      expect(
        Reflect.getMetadata(PERMISSIONS_KEY, ChannelsController.prototype[method]),
      ).toEqual([PERMISSIONS.CHANNEL_READ]);
    },
  );
});
