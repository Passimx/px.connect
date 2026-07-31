import { ActionRequestFromType } from './action-request-from.type';
import { RequestToType } from './request-to.type';

export type RequestCallEventType = {
  from: ActionRequestFromType;
  to: RequestToType;
  action: string;
  actionId: string;
  payload: unknown;
};
