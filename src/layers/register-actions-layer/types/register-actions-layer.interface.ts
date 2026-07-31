import { LocalEventsType } from './local-events-enum.type';
import { LocalHandlerFnType } from './local-handler-fn.type';
import { CallToType } from '../../connection-layer/types/call-to.type';
import { CallDataType } from '../../connection-layer/types/call-data.type';
import { OnActionFnType } from './on-action-fn.type';
import { OffActionFnType } from './off-action-fn.type';

export interface RegisterActionsLayerInterface {
  disconnect(): unknown;

  on(trigger: LocalEventsType, handler: LocalHandlerFnType): unknown;

  off(trigger: LocalEventsType, handler: LocalHandlerFnType): unknown;

  callAction<T = any>(
    to: CallToType,
    data: CallDataType,
  ): Promise<T | undefined>;

  onAction(routes: OnActionFnType): unknown;

  offAction(routes: OffActionFnType): unknown;
}
