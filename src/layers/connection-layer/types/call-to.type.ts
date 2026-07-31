export type CallToChannel = {
  channelId: string;
};

export type CallToConnection = {
  connectionId: string;
};

export type CallToType = CallToChannel | CallToConnection;
