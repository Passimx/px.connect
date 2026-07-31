import { Context } from './context.type';

export type OnActionFnType = (routes: {
  on: <T = any>(
    action: string,
    handler: (context: Context<T>) => void,
  ) => unknown;
}) => any;
