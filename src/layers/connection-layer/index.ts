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
import { CreateChannelPayload } from './types/create-channel-payload';
import { ChannelInitType } from './types/channel-init.type';
import { CryptoService } from '../../services/crypto.service';
import { CreatedChannelType } from './types/created-channel.type';
import { ExportInitType } from './types/export-init.type';

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
  private channels: Map<string, CreatedChannelType> = new Map();

  constructor(url: string) {
    this.url = url;

    this.broadcastChannel = new BroadcastChannel('px-channel');
    this.broadcastChannel.onmessage = (
      event: MessageEvent<BroadcastMessageType>,
    ) => this.onBroadcastChannel(event);
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws) return resolve();

      this.ws = new WebSocket(this.url);

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
            case ResponseEventsEnum.REPLY_ACTION:
              BroadcastChannelService.send({
                event: RegisterActionEventsEnum.ON_REPLY_EMIT,
                data: {
                  actionId: payload.data.actionId,
                  payload: payload.data.payload,
                },
              });
              break;
            default:
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

      this.ws.onclose = () => {
        this.scheduleReconnect();
        BroadcastChannelService.send({
          event: RegisterActionEventsEnum.ON_EMIT,
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

  public async createChannel(
    payload?: CreateChannelPayload,
  ): Promise<CreatedChannelType> {
    let init: ChannelInitType | undefined;
    let ownerSignKey: CryptoKey | undefined;
    let sendSignKey: CryptoKey | undefined;
    let exportInit: ExportInitType | undefined;

    const data = payload?.data;

    if (payload && 'exportInit' in payload) {
      const [
        ownerVerifyKeyExist,
        ownerSignKeyExist,
        sendVerifyKeyExist,
        sendSignKeyExist,
      ] = await Promise.all([
        CryptoService.importEd25519Key(
          payload.exportInit.ownerVerifyKeyString,
          'public',
        ),
        CryptoService.importEd25519Key(
          payload.exportInit.ownerSignKeyString,
          'private',
        ),
        CryptoService.importEd25519Key(
          payload.exportInit.sendVerifyKeyString,
          'public',
        ),
        CryptoService.importEd25519Key(
          payload.exportInit.sendSignKeyString,
          'private',
        ),
      ]);

      const checkResults = await Promise.all([
        CryptoService.checkEd25519Keys({
          publicKey: ownerVerifyKeyExist,
          privateKey: ownerSignKeyExist,
        }),
        CryptoService.checkEd25519Keys({
          publicKey: sendVerifyKeyExist,
          privateKey: sendSignKeyExist,
        }),
      ]);

      if (checkResults.find((result) => !result))
        throw new Error(
          `${CryptoService.name}.${CryptoService.verifyByEd25519.name} is not valid`,
        );

      ownerSignKey = ownerSignKeyExist;
      sendSignKey = sendSignKeyExist;

      exportInit = payload.exportInit;
      init = {
        sendVerifyKeyString: exportInit.sendVerifyKeyString,
        ownerVerifyKeyString: exportInit.ownerVerifyKeyString,
        info: exportInit.info,
      };
    } else {
      const [ownerKeysPair, sendKeysPair] = await Promise.all([
        CryptoService.generateEd25519Keys(),
        CryptoService.generateEd25519Keys(),
      ]);

      const [
        ownerVerifyKeyString,
        sendVerifyKeyString,
        sendSignKeyString,
        ownerSignKeyString,
      ] = await Promise.all([
        CryptoService.exportKey(sendKeysPair.publicKey),
        CryptoService.exportKey(ownerKeysPair.publicKey),
        CryptoService.exportKey(sendKeysPair.privateKey),
        CryptoService.exportKey(ownerKeysPair.privateKey),
      ]);

      ownerSignKey = ownerKeysPair.privateKey;
      sendSignKey = sendKeysPair.privateKey;

      init = {
        ownerVerifyKeyString,
        sendVerifyKeyString,
        info: payload?.info,
      };

      exportInit = {
        ownerVerifyKeyString,
        sendVerifyKeyString,
        info: payload?.info,
        ownerSignKeyString,
        sendSignKeyString,
      };
    }

    const signature = await CryptoService.signByEd25519(ownerSignKey, init);
    if (!signature)
      throw new Error(
        `${CryptoService.name}.${CryptoService.signByEd25519.name} is not valid`,
      );

    const id = await CryptoService.getHash(init);
    const channel: CreatedChannelType = {
      id,
      init,
      data,
      ownerSignKey,
      sendSignKey,
      exportInit,
    };

    this.channels.set(id, channel);

    BroadcastChannelService.send({
      event: RequestEventsEnum.SEND_MESSAGE,
      data: {
        event: RequestEventsEnum.CREATE_CHANNEL,
        data: { init, data },
      },
    });

    return channel;
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
