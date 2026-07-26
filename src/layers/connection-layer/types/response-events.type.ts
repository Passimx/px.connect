import { ResponseEventsEnum } from './response-events.enum';
import { RequestCallEventType } from './request-call-event.type';
import { ResponseReplyType } from './response-reply.type';

type Pong = {
  readonly event: ResponseEventsEnum.PONG;
  readonly data: unknown;
};

type GetConnectionId = {
  readonly event: ResponseEventsEnum.GET_CONNECTION_ID;
  readonly data: string;
};

type CallAction = {
  readonly event: ResponseEventsEnum.CALL_ACTION;
  readonly data: RequestCallEventType;
};

export type ReplyAction = {
  readonly event: ResponseEventsEnum.REPLY_ACTION;
  readonly data: ResponseReplyType;
};

export type ResponseEventsType =
  | Pong
  | GetConnectionId
  | CallAction
  | ReplyAction;
