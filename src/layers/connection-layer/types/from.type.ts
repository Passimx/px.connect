import { ChannelInitType } from '../../channels-layers/types/channel-init.type';

export type FromChannel = {
  channel: {
    id: string;
    init: ChannelInitType;
    data?: unknown;
  };
};

export type FromConnection = { connection: { id: string } };

export type FromType = FromChannel | FromConnection;
