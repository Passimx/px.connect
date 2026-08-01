/**
 * Initial data required to create or initialize a channel.
 */
export type ExportInitType<T = unknown> = {
  /** Verification key of the channel owner. */
  ownerVerifyKeyString: string;

  /** Verification key used to validate message sending events in the channel. */
  sendVerifyKeyString: string;

  /** Signature key of the channel owner. */
  ownerSignKeyString: string;

  /** Signature key used for sending messages. */
  sendSignKeyString: string;

  /** Initial baseline data of the channel. */
  info?: T;
};
