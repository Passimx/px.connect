import { FromConnection } from '../../connection-layer/types/from.type';
import { CallToType } from '../../connection-layer/types/call-to.type';

export type Context<T = any> = {
  from: FromConnection;
  to: CallToType;
  payload: T;
  data: Date;
  reply: (payload: unknown) => void;
};
