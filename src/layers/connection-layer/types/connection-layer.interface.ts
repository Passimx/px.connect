import { CreateChannelPayload } from './create-channel-payload';

export interface ConnectionLayerInterface {
  connect(): unknown;

  disconnect(): unknown;

  getConnectionId(): string | undefined;

  createChannel(data?: CreateChannelPayload): unknown;
}
