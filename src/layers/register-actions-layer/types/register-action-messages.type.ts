import { RegisterActionEventsEnum } from './register-action-events.enum';
import { FromType } from '../../connection-layer/types/from.type';
import { LocalEventsType } from './local-events-enum.type';

type OnEmit = {
  event: RegisterActionEventsEnum.ON_EMIT;
  data: LocalEventsType;
};

type OnReplyEmit = {
  event: RegisterActionEventsEnum.ON_REPLY_EMIT;
  data: {
    actionId: string;
    payload?: unknown;
  };
};

type OnChannelEmit = {
  event: RegisterActionEventsEnum.ON_CHANNEL_EMIT;
  data: {
    channelId: string;
    action: string;
    payload?: unknown;
  };
};

type OnMessageEmit = {
  event: RegisterActionEventsEnum.ON_MESSAGE_EMIT;
  data: {
    from: FromType;
    message: {
      action: string;
      payload: unknown;
    };
  };
};

export type RegisterActionMessagesType =
  | OnEmit
  | OnReplyEmit
  | OnChannelEmit
  | OnMessageEmit;
