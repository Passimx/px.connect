import { CreateChannelPayload } from './create-channel-payload';
import { CreatedChannelType } from './created-channel.type';

export interface ChannelsInterface {
  createChannel(payload?: CreateChannelPayload): Promise<CreatedChannelType>;

  join(...channels: string[]): void;

  leave(...data: string[]): void;
}
