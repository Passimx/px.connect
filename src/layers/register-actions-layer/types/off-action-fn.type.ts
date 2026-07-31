import { Context } from './context.type';

export type OffActionFnType = (routes: {
  off: <T = any>(
    action: string,
    handler: (context: Context<T>) => void,
  ) => unknown;
}) => any;
