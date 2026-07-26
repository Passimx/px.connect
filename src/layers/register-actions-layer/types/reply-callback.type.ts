import { ReplyCallbackFnType } from './reply-callback-fn.type';

export type ReplyCallbackType = {
  func: ReplyCallbackFnType;
  timeHandler: NodeJS.Timeout;
};
