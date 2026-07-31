import { RegisterActionsLayerInterface } from '../../register-actions-layer/types/register-actions-layer.interface';
import { TabsLayerInterface } from '../../tabs-layer/types/tabs-layer.interface';
import { ConnectionLayerInterface } from '../../connection-layer/types/connection-layer.interface';
import { ConnectionLayer } from '../../connection-layer';

export interface PxConnectInterface {
  connect: TabsLayerInterface['connect'];

  disconnect(): void;

  on: RegisterActionsLayerInterface['on'];

  off: RegisterActionsLayerInterface['off'];

  getConnectionId: ConnectionLayerInterface['getConnectionId'];

  join(...data: string[]): void;

  leave(...data: string[]): void;

  createChannel: ConnectionLayer['createChannel'];

  callAction: RegisterActionsLayerInterface['callAction'];

  onAction: RegisterActionsLayerInterface['onAction'];

  offAction: RegisterActionsLayerInterface['offAction'];
}
