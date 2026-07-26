import { RegisterActionsLayerInterface } from './types/register-actions-layer.interface';
import { BroadcastMessageType } from '../../services/types/broadcast-message.type';
import { LocalHandler } from './types/local-handler';
import { LocalEventsType } from './types/local-events-enum.type';
import { LocalHandlerFnType } from './types/local-handler-fn.type';
import { RegisterActionEventsEnum } from './types/register-action-events.enum';
import { ReplyCallbackType } from './types/reply-callback.type';
import { ReplyCallbackFnType } from './types/reply-callback-fn.type';

export class RegisterActionsLayer implements RegisterActionsLayerInterface {
  private broadcastChannel: BroadcastChannel;

  private onLocalHandlers: LocalHandler[] = [];
  private replyHandlers: Map<string, ReplyCallbackType> = new Map<
    string,
    ReplyCallbackType
  >();

  private readonly callActionWaitMs: number;

  constructor(callActionWaitMs: number = 10 * 1000) {
    this.callActionWaitMs = callActionWaitMs;
    this.broadcastChannel = new BroadcastChannel('px-channel');
    this.broadcastChannel.onmessage = (
      event: MessageEvent<BroadcastMessageType>,
    ) => this.onBroadcastChannel(event);
  }

  public on(trigger: LocalEventsType, handler: LocalHandlerFnType) {
    this.onLocalHandlers.push({ trigger, handler });
  }

  public onReply(actionId: string, callback: ReplyCallbackFnType) {
    const timeHandler = setTimeout(() => {
      this.onReplyEmit(actionId);
    }, this.callActionWaitMs);

    this.replyHandlers.set(actionId, { func: callback, timeHandler });
  }

  public disconnect() {
    this.broadcastChannel?.close();
  }

  private emit(event: LocalEventsType) {
    for (const item of this.onLocalHandlers) {
      if (item.trigger === event) {
        void item.handler();
      }
    }
  }

  private onReplyEmit(actionId: string, payload?: unknown) {
    const handler = this.replyHandlers.get(actionId);

    if (handler) {
      handler.func(payload);
    }
    this.replyHandlers.delete(actionId);
  }

  private onBroadcastChannel(payload: MessageEvent<BroadcastMessageType>) {
    switch (payload.data.event) {
      case RegisterActionEventsEnum.ON_EMIT:
        this.emit(payload.data.data);
        break;
      case RegisterActionEventsEnum.ON_REPLY_EMIT:
        this.onReplyEmit(payload.data.data.actionId, payload.data.data.payload);
        break;
      // case RegisterActionEventsEnum.ON_CHANNEL_EMIT:
      //   this.onChannelEmit(
      //     payload.data.data.channelId,
      //     payload.data.data.action,
      //     payload.data.data.payload,
      //   );
      //   break;
      case RegisterActionEventsEnum.ON_MESSAGE_EMIT:
        break;
    }
  }
}
