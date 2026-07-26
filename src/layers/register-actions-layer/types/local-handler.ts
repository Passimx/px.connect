import { LocalEventsType } from './local-events-enum.type';
import { LocalHandlerFnType } from './local-handler-fn.type';

export type LocalHandler = {
  trigger: LocalEventsType;
  handler: LocalHandlerFnType;
};
