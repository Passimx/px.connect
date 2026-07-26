import { TabsLayer } from '../tabs-layer';
import { ConnectionLayer } from '../connection-layer';
import { RegisterActionsLayer } from '../register-actions-layer';
import { ParamsType } from './types/params.type';
import { BroadcastChannelService } from '../../services/broadcast-channel.service';
import { RequestEventsEnum } from '../connection-layer/types/request-events.enum';
import { LocalEventsEnum } from '../register-actions-layer/types/local-events.enum';
import { CallToType } from '../connection-layer/types/call-to.type';
import { RegisterActionEventsEnum } from '../register-actions-layer/types/register-action-events.enum';
import { PxConnectInterface } from './types/px-connect.interface';

export class PxConnect implements PxConnectInterface {
  private readonly tabsLayer: TabsLayer;
  private readonly connectionLayer: ConnectionLayer;
  private readonly registerActionsLayer: RegisterActionsLayer;

  public connect: TabsLayer['connect'];
  public on: RegisterActionsLayer['on'];
  public createChannel: ConnectionLayer['createChannel'];
  public getConnectionId: ConnectionLayer['getConnectionId'];

  public disconnect() {
    this.tabsLayer.disconnect();
    this.connectionLayer.disconnect();
    this.registerActionsLayer.disconnect();

    if (typeof window !== 'undefined')
      window.removeEventListener('beforeunload', () => this.disconnect());
  }

  constructor(url: string, params?: Partial<ParamsType>) {
    if (typeof window !== 'undefined')
      window.addEventListener('beforeunload', () => this.disconnect());

    this.registerActionsLayer = new RegisterActionsLayer(
      params?.callActionWaitMs,
    );
    this.tabsLayer = new TabsLayer();
    this.connectionLayer = new ConnectionLayer(url);

    this.tabsLayer.onUpdate((payload) => this.onTabsUpdate(payload));

    this.connect = this.tabsLayer.connect.bind(this.tabsLayer);
    this.createChannel = this.connectionLayer.createChannel.bind(
      this.connectionLayer,
    );
    this.on = this.registerActionsLayer.on.bind(this.registerActionsLayer);
    this.getConnectionId = this.connectionLayer.getConnectionId.bind(
      this.connectionLayer,
    );
  }

  public joinConnectionToChannels(data: string[]) {
    BroadcastChannelService.send({
      event: RequestEventsEnum.SEND_MESSAGE,
      data: { event: RequestEventsEnum.JOIN_CONNECTION_TO_CHANNELS, data },
    });
  }

  public callAction<T = any>(
    to: CallToType,
    data: { action: string; payload?: unknown },
    callback?: (payload: T | undefined) => unknown,
  ) {
    const actionId = `${Date.now()}_${window.crypto.randomUUID()}`;

    BroadcastChannelService.send({
      event: RequestEventsEnum.SEND_MESSAGE,
      data: {
        event: RequestEventsEnum.CALL_ACTION,
        data: { to, action: data.action, actionId, payload: data.payload },
      },
    });

    if (callback) this.registerActionsLayer.onReply(actionId, callback);
  }

  private onTabsUpdate = async (isMainTab: boolean) => {
    if (isMainTab) await this.connectionLayer.connect();
    else this.connectionLayer.disconnect();

    BroadcastChannelService.send({
      event: RegisterActionEventsEnum.ON_EMIT,
      data: LocalEventsEnum.CONNECT,
    });
  };
}
