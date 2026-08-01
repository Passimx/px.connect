import { ConnectionLayerInterface } from './types/connection-layer.interface';
import {
  intervalPing,
  maxReconnectDelay,
  minReconnectDelay,
  waitPong,
} from './constants';
import { BroadcastMessageType } from '../../services/types/broadcast-message.type';
import { RequestEventsEnum } from './types/request-events.enum';
import { RequestMessageType } from './types/request-message.type';
import { BroadcastChannelService } from '../../services/broadcast-channel.service';
import { ResponseEventsEnum } from './types/response-events.enum';
import { ResponseEventsType } from './types/response-events.type';
import { RegisterActionEventsEnum } from '../register-actions-layer/types/register-action-events.enum';
import { LocalEventsEnum } from '../register-actions-layer/types/local-events.enum';

export class ConnectionLayer implements ConnectionLayerInterface {
  private connectionId: string | undefined = undefined;
  private url: string;
  private messages: string[] = [];
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | undefined;
  private reconnectDelay: number = minReconnectDelay;
  private pongTimeoutTimer: NodeJS.Timeout | undefined;
  private pingIntervalTimer: NodeJS.Timeout | undefined;
  private broadcastChannel: BroadcastChannel;

  constructor(url: string) {
    this.url = url;
    this.broadcastChannel = new BroadcastChannel('px-channel');
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws) return resolve();

      this.ws = new WebSocket(this.url);

      this.broadcastChannel.onmessage = (
        event: MessageEvent<BroadcastMessageType>,
      ) => this.onBroadcastChannel(event);

      this.ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const payload = JSON.parse(event.data) as ResponseEventsType;

          switch (payload.event) {
            case ResponseEventsEnum.PONG:
              clearTimeout(this.pongTimeoutTimer);
              clearTimeout(this.pingIntervalTimer);
              this.pingIntervalTimer = setTimeout(
                () => this.sendPing(),
                intervalPing,
              );
              break;

            case ResponseEventsEnum.GET_CONNECTION_ID:
              this.connectionId = payload.data;
              resolve();
              break;

            case ResponseEventsEnum.CALL_ACTION:
              BroadcastChannelService.send({
                event: RegisterActionEventsEnum.ON_ACTION,
                data: payload.data,
              });
              break;

            case ResponseEventsEnum.REPLY_ACTION:
              BroadcastChannelService.send({
                event: RegisterActionEventsEnum.ON_REPLY_ACTION,
                data: payload.data,
              });
              break;
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          reject(new Error(`Error connection to the server: ${this.url}`));
        }
      };

      this.ws.onopen = () => {
        this.reconnectDelay = minReconnectDelay;
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;

        this.messages.forEach((message) => {
          this.ws?.send(message);
        });
        this.messages = [];
      };

      this.ws.onerror = () => {
        this.scheduleReconnect();
      };

      this.ws.onclose = () => {
        this.scheduleReconnect();
        BroadcastChannelService.send({
          event: RegisterActionEventsEnum.ON,
          data: LocalEventsEnum.DISCONNECT,
        });
      };
    });
  }

  public disconnect() {
    if (this.ws) {
      this.clearAllTimeouts();
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
      this.broadcastChannel?.close();
    }
  }

  private send(payload: RequestMessageType) {
    const message = JSON.stringify(payload);

    if (this.ws?.readyState === WebSocket.OPEN) this.ws?.send(message);
    else this.messages.push(message);
  }

  private onBroadcastChannel(payload: MessageEvent<BroadcastMessageType>) {
    switch (payload.data.event) {
      case RequestEventsEnum.SEND_MESSAGE:
        this.send(payload.data);
        break;
    }
  }

  private sendPing() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({ event: 'ping' }));

    clearTimeout(this.pongTimeoutTimer);

    this.pongTimeoutTimer = setTimeout(() => {
      console.error(
        `[${ConnectionLayer.name}] Pong timeout expiration. Closing...`,
      );
      this.ws?.close();
    }, waitPong);
  }

  public getConnectionId() {
    return this.connectionId;
  }

  private clearAllTimeouts() {
    clearTimeout(this.pingIntervalTimer);
    clearTimeout(this.pongTimeoutTimer);
    clearTimeout(this.reconnectTimer);
  }

  private scheduleReconnect() {
    this.ws = null;
    this.clearAllTimeouts();
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, maxReconnectDelay);
  }
}
