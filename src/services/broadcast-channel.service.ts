import { BroadcastMessageType } from './types/broadcast-message.type';

export class BroadcastChannelService {
  public static send(payload: BroadcastMessageType) {
    const channel = new BroadcastChannel('px-channel');
    channel.postMessage(payload);
    channel.close();
  }
}
