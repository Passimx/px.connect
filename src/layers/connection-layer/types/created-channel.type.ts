import { ChannelInitType } from './channel-init.type';
import { ExportInitType } from './export-init.type';

export type CreatedChannelType = {
  id: string;
  init: ChannelInitType;
  data?: unknown;
  ownerSignKey: CryptoKey;
  sendSignKey: CryptoKey;
  exportInit: ExportInitType;
};
