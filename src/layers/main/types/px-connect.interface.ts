import { CallToType } from '../../connection-layer/types/call-to.type';
import { CreateChannelPayload } from '../../connection-layer/types/create-channel-payload';
import { CreatedChannelType } from '../../connection-layer/types/created-channel.type';

export interface PxConnectInterface {
  connect(...args: unknown[]): unknown;

  disconnect(): unknown;

  on(...args: unknown[]): unknown;

  getConnectionId(): string | undefined;

  join(data: string[]): unknown;

  createChannel(payload?: CreateChannelPayload): Promise<CreatedChannelType>;

  callAction<T = any>(
    to: CallToType,
    data: { action: string; payload?: unknown },
    callback?: (payload: T | undefined) => unknown,
  ): unknown;

  // action(): unknown;
}
