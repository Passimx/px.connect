import { RequestEventsEnum } from './request-events.enum';
import { CallToType } from './call-to.type';
import { ChannelInitType } from '../../channels-layers/types/channel-init.type';

export type JoinConnectionToChannels = {
  event: RequestEventsEnum.JOIN_CONNECTION_TO_CHANNELS;
  data: string[];
};

export type LeaveConnectionToChannels = {
  event: RequestEventsEnum.LEAVE_CONNECTION_TO_CHANNELS;
  data: string[];
};

export type SendMessage = {
  event: RequestEventsEnum.CALL_ACTION;
  data: { to: CallToType; action: string; actionId: string; payload?: unknown };
};

export type ReplyMessage = {
  event: RequestEventsEnum.REPLY_ACTION;
  data: { to: CallToType; actionId: string; payload?: unknown };
};

export type CreateChannel = {
  event: RequestEventsEnum.CREATE_CHANNEL;
  data: { init: ChannelInitType; data?: unknown };
};

export type SendToChannel = {
  event: RequestEventsEnum.SEND_TO_CHANNEL;
  data: {
    channelId: string;
    message: unknown;
    signature: string;
  };
};

export type RequestSendMessageType =
  | JoinConnectionToChannels
  | LeaveConnectionToChannels
  | SendMessage
  | CreateChannel
  | SendToChannel
  | ReplyMessage;
