import { ExportInitType } from './export-init.type';

type ChannelExistsType = {
  exportInit: ExportInitType;
  data?: unknown;
};

type NewChannelType = {
  info?: unknown;
  data?: unknown;
};

export type CreateChannelPayload = ChannelExistsType | NewChannelType;
