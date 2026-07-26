import { RequestFromType } from './request-from.type';
import { RequestToType } from './request-to.type';

export type RequestCallEventType = {
  from: RequestFromType;
  to: RequestToType;
  action: string;
  actionId: string;
  payload: unknown;
};
