import { TabsLayer } from '../layers/tabs-layer';
import { RegisterActionsLayer } from '../layers/register-actions-layer';
import { ParamsType } from './types/params.type';
import { BroadcastChannelService } from '../services/broadcast-channel.service';
import { LocalEventsEnum } from '../layers/register-actions-layer/types/local-events.enum';
import { RegisterActionEventsEnum } from '../layers/register-actions-layer/types/register-action-events.enum';
import { PxConnectInterface } from './types/px-connect.interface';
import { ChannelsLayers } from '../layers/channels-layers';
import { ChannelsInterface } from '../layers/channels-layers/types/channels.interface';
import { RegisterActionsLayerInterface } from '../layers/register-actions-layer/types/register-actions-layer.interface';
import { ConnectionLayerInterface } from '../layers/connection-layer/types/connection-layer.interface';
import { TabsLayerInterface } from '../layers/tabs-layer/types/tabs-layer.interface';
import { ConnectionLayer } from '../layers/connection-layer';

/**
 * Main orchestration class managing cross-tab communication and network connection layers.
 */
export class PxConnect implements PxConnectInterface {
  private readonly tabsLayer: TabsLayerInterface;
  private readonly channelsLayers: ChannelsLayers;
  private readonly connectionLayer: ConnectionLayerInterface;
  private readonly registerActionsLayer: RegisterActionsLayerInterface;

  /**
   * PxConnect instance constructor.
   *
   * @param url - Connection address.
   * @param params - Settings params.
   */
  constructor(url: string, params?: ParamsType) {
    if (typeof window !== 'undefined')
      window.addEventListener('beforeunload', () => this.disconnect());

    this.registerActionsLayer = new RegisterActionsLayer(
      params?.callActionWaitMs,
    );
    this.tabsLayer = new TabsLayer();
    this.channelsLayers = new ChannelsLayers();
    this.connectionLayer = new ConnectionLayer(url);

    this.tabsLayer.onUpdate((payload) => this.onTabsUpdate(payload));

    this.connect = this.tabsLayer.connect.bind(this.tabsLayer);
    this.createChannel = this.channelsLayers.createChannel.bind(
      this.channelsLayers,
    );
    this.on = this.registerActionsLayer.on.bind(this.registerActionsLayer);
    this.off = this.registerActionsLayer.off.bind(this.registerActionsLayer);
    this.getConnectionId = this.connectionLayer.getConnectionId.bind(
      this.connectionLayer,
    );
    this.join = this.channelsLayers.join.bind(this.channelsLayers);
    this.leave = this.channelsLayers.leave.bind(this.channelsLayers);
    this.callAction = this.registerActionsLayer.callAction.bind(
      this.registerActionsLayer,
    );
    this.onAction = this.registerActionsLayer.onAction.bind(
      this.registerActionsLayer,
    );
    this.offAction = this.registerActionsLayer.offAction.bind(
      this.registerActionsLayer,
    );
  }

  /**
   * Connects the current tab to the tab management system.
   */
  public connect: TabsLayerInterface['connect'];

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
   * Subscribes to local events or registered actions.
   */
  public on: RegisterActionsLayerInterface['on'];

  /**
   * Unsubscribes to local events or registered actions.
   */
  public off: RegisterActionsLayerInterface['off'];

  /**
   * Returns the unique identifier of the current active connection.
   */
  public getConnectionId: ConnectionLayerInterface['getConnectionId'];

  /**
   * Join the current connection to the channels.
   *
   * @param data - Array of channel ids to join.
   */
  public join: ChannelsInterface['join'];

  /**
   * Leave the current connection to the channels.
   *
   * @param data - Array of channel ids to leave.
   */
  public leave: ChannelsInterface['leave'];

  /**
   * Creates new channel for data transmission.
   */
  public createChannel: ChannelsInterface['createChannel'];

  /**
   * Creates new channel for data transmission.
   */
  public callAction: RegisterActionsLayerInterface['callAction'];

  /**
   * Add actions handlers
   */
  public onAction: RegisterActionsLayerInterface['onAction'];

  /**
   * Drop actions handlers
   */
  public offAction: RegisterActionsLayerInterface['offAction'];

  private onTabsUpdate = async (isMainTab: boolean) => {
    if (isMainTab) await this.connectionLayer.connect();
    else this.connectionLayer.disconnect();

    BroadcastChannelService.send({
      event: RegisterActionEventsEnum.ON,
      data: LocalEventsEnum.CONNECT,
    });
  };
}
