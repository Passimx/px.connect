import { LocalEventsEnum } from './local-events.enum';

export type LocalEventsType =
  | `${LocalEventsEnum.CONNECT}`
  | `${LocalEventsEnum.RECONNECT}`
  | `${LocalEventsEnum.DISCONNECT}`;
