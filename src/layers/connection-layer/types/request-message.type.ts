import { RequestEventsEnum } from './request-events.enum';
import { RequestSendMessageType } from './request-send-message.type';

type SendType = {
  event: RequestEventsEnum.SEND_MESSAGE;
  data: RequestSendMessageType;
};

export type RequestMessageType = SendType;
