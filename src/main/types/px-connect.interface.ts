import { RegisterActionsLayerInterface } from '../../layers/register-actions-layer/types/register-actions-layer.interface';
import { TabsLayerInterface } from '../../layers/tabs-layer/types/tabs-layer.interface';
import { ConnectionLayerInterface } from '../../layers/connection-layer/types/connection-layer.interface';
import { ChannelsInterface } from '../../layers/channels-layers/types/channels.interface';

export interface PxConnectInterface {
  connect: TabsLayerInterface['connect'];

  disconnect(): void;

  on: RegisterActionsLayerInterface['on'];

  off: RegisterActionsLayerInterface['off'];

  getConnectionId: ConnectionLayerInterface['getConnectionId'];

  join: ChannelsInterface['join'];

  leave: ChannelsInterface['leave'];

  createChannel: ChannelsInterface['createChannel'];

  callAction: RegisterActionsLayerInterface['callAction'];

  onAction: RegisterActionsLayerInterface['onAction'];

  offAction: RegisterActionsLayerInterface['offAction'];
}
