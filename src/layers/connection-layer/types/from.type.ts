import { ChannelInitType } from './channel-init.type';

export type FromChannel = {
  channel: {
    id: string;
    init: ChannelInitType;
    data?: unknown;
  };
};

export type FromConnection = { connection: { id: string } };

export type FromType = FromChannel | FromConnection;
