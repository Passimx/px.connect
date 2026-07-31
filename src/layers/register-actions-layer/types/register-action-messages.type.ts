import { RegisterActionEventsEnum } from './register-action-events.enum';
import { LocalEventsType } from './local-events-enum.type';
import { RequestCallEventType } from '../../connection-layer/types/request-call-event.type';
import { ResponseReplyType } from '../../connection-layer/types/response-reply.type';

type OnEmit = {
  event: RegisterActionEventsEnum.ON;
  data: LocalEventsType;
};

type OnAction = {
  event: RegisterActionEventsEnum.ON_ACTION;
  data: RequestCallEventType;
};

type OnReplyAction = {
  event: RegisterActionEventsEnum.ON_REPLY_ACTION;
  data: ResponseReplyType;
};

export type RegisterActionMessagesType = OnEmit | OnAction | OnReplyAction;
