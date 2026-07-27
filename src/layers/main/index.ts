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

/**
 * Main orchestration class managing cross-tab communication and network connection layers.
 */
export class PxConnect implements PxConnectInterface {
  private readonly tabsLayer: TabsLayer;
  private readonly connectionLayer: ConnectionLayer;
  private readonly registerActionsLayer: RegisterActionsLayer;

  /**
   * Connects the current tab to the tab management system.
   */
  public connect: TabsLayer['connect'];

  /**
   * Subscribes to local events or registered actions.
   */
  public on: RegisterActionsLayer['on'];

  /**
   * Creates a new communication channel for data transmission.
   */
  public createChannel: ConnectionLayer['createChannel'];

  /**
   * Returns the unique identifier of the current active connection.
   */
  public getConnectionId: ConnectionLayer['getConnectionId'];

  /**
   * Disconnects active layers, clears internal subscriptions, and removes window lifecycle listeners.
   */
  public disconnect() {
    this.tabsLayer.disconnect();
    this.connectionLayer.disconnect();
    this.registerActionsLayer.disconnect();

    if (typeof window !== 'undefined')
      window.removeEventListener('beforeunload', () => this.disconnect());
  }

  /**
   * PxConnect instance constructor.
   *
   * @param {string} url - Connection address
   * @param {ParamsType} [params] - Settings params.
   */
  constructor(url: string, params?: ParamsType) {
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

  /**
   * Joins the current connection to the channels.
   *
   * @param data - Array of channel names to join.
   */
  public join(data: string[]) {
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
