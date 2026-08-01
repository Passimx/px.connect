export type ChannelInitType<T = unknown> = {
  ownerVerifyKeyString: string;
  sendVerifyKeyString: string;
  info?: T;
};
