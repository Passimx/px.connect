import { BroadcastMessageType } from './types/broadcast-message.type';

export class BroadcastChannelService {
  private static channelName: string = 'px-channel';

  public static send(payload: BroadcastMessageType) {
    const channel = this.getChannel();
    channel.postMessage(payload);
    channel.close();
  }

  public static getChannel() {
    return new BroadcastChannel(this.channelName);
  }
}
