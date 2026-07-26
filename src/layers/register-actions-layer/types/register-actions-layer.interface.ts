import { LocalEventsType } from './local-events-enum.type';
import { LocalHandlerFnType } from './local-handler-fn.type';
import { ReplyCallbackFnType } from './reply-callback-fn.type';

export interface RegisterActionsLayerInterface {
  on(trigger: LocalEventsType, handler: LocalHandlerFnType): unknown;
  onReply(actionId: string, callback: ReplyCallbackFnType): unknown;
  disconnect(): unknown;
}
