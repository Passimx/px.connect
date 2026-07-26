type CallToChannel = {
  channelId: string;
};

type CallToConnection = {
  connectionId: string;
};

export type CallToType = CallToChannel | CallToConnection;
