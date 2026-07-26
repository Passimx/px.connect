import { ChannelInitType } from './channel-init.type';

export type RequestFromType = {
  connection?: { id: string };
  channel?: {
    id: string;
    init: ChannelInitType;
    data?: unknown;
  };
};
