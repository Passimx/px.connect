import { LocalEventsEnum } from './local-events.enum';

export type LocalEventsType =
  | `${LocalEventsEnum.CONNECT}`
  | `${LocalEventsEnum.DISCONNECT}`;
