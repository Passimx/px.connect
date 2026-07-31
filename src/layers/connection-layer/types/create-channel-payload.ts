import { ExportInitType } from './export-init.type';

/**
 * Structure representing an existing channel.
 */
type ChannelExistsType = {
  /** Initial channel data that determines the final channel ID. */
  exportInit: ExportInitType;

  /** Mutable part of the channel data. */
  data?: unknown;
};

/**
 * Structure representing a new channel.
 */
type NewChannelType = {
  /** Additional information about the new channel. */
  info?: unknown;

  /** Mutable part of the channel data. */
  data?: unknown;
};

export type CreateChannelPayload = ChannelExistsType | NewChannelType;
