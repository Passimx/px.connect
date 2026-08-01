import { ChannelsInterface } from './types/channels.interface';
import { CreatedChannelType } from './types/created-channel.type';
import { CreateChannelPayload } from './types/create-channel-payload';
import { ChannelInitType } from './types/channel-init.type';
import { ExportInitType } from './types/export-init.type';
import { CryptoService } from '../../services/crypto.service';
import { BroadcastChannelService } from '../../services/broadcast-channel.service';
import { RequestEventsEnum } from '../connection-layer/types/request-events.enum';
import { BroadcastMessageType } from '../../services/types/broadcast-message.type';
import { LocalEventsEnum } from '../register-actions-layer/types/local-events.enum';
import { RegisterActionEventsEnum } from '../register-actions-layer/types/register-action-events.enum';

export class ChannelsLayers implements ChannelsInterface {
  private readonly joinedChannels: Set<string>;
  private readonly ownerChannels: Map<string, CreatedChannelType>;

  private readonly broadcastChannel: BroadcastChannel;

  constructor() {
    this.ownerChannels = new Map<string, CreatedChannelType>();
    this.joinedChannels = new Set();
    this.broadcastChannel = BroadcastChannelService.getChannel();
    this.broadcastChannel.onmessage = (
      event: MessageEvent<BroadcastMessageType>,
    ) => this.onBroadcastChannel(event);
  }

  public join(...data: string[]) {
    for (const channel of data) {
      this.joinedChannels.add(channel);
    }

    BroadcastChannelService.send({
      event: RequestEventsEnum.SEND_MESSAGE,
      data: { event: RequestEventsEnum.JOIN_CONNECTION_TO_CHANNELS, data },
    });
  }

  public leave(...data: string[]) {
    for (const channel of data) {
      this.joinedChannels.delete(channel);
    }

    BroadcastChannelService.send({
      event: RequestEventsEnum.SEND_MESSAGE,
      data: { event: RequestEventsEnum.LEAVE_CONNECTION_TO_CHANNELS, data },
    });
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

    this.ownerChannels.set(id, channel);

    BroadcastChannelService.send({
      event: RequestEventsEnum.SEND_MESSAGE,
      data: {
        event: RequestEventsEnum.CREATE_CHANNEL,
        data: { init, data },
      },
    });

    return channel;
  }

  private onBroadcastChannel(payload: MessageEvent<BroadcastMessageType>) {
    if (
      payload.data.event !== RegisterActionEventsEnum.ON ||
      payload.data.data !== `${LocalEventsEnum.RECONNECT}`
    )
      return;

    for (const channel of Array.from(this.ownerChannels.values())) {
      const { init, data } = channel;
      BroadcastChannelService.send({
        event: RequestEventsEnum.SEND_MESSAGE,
        data: {
          event: RequestEventsEnum.CREATE_CHANNEL,
          data: { init, data },
        },
      });
    }

    const channels = Array.from(this.joinedChannels);
    if (channels.length > 0) this.join(...channels);
  }
}
