import { RegisterActionsLayerInterface } from './types/register-actions-layer.interface';
import { BroadcastMessageType } from '../../services/types/broadcast-message.type';
import { LocalEventsType } from './types/local-events-enum.type';
import { LocalHandlerFnType } from './types/local-handler-fn.type';
import { RegisterActionEventsEnum } from './types/register-action-events.enum';
import { ReplyCallbackType } from './types/reply-callback.type';
import { CallToType } from '../connection-layer/types/call-to.type';
import { CallDataType } from '../connection-layer/types/call-data.type';
import { BroadcastChannelService } from '../../services/broadcast-channel.service';
import { RequestEventsEnum } from '../connection-layer/types/request-events.enum';
import { ReplyCallbackFnType } from './types/reply-callback-fn.type';
import { OnActionFnType } from './types/on-action-fn.type';
import { OffActionFnType } from './types/off-action-fn.type';
import { Context } from './types/context.type';
import { RequestCallEventType } from '../connection-layer/types/request-call-event.type';
import { ResponseReplyType } from '../connection-layer/types/response-reply.type';

export class RegisterActionsLayer implements RegisterActionsLayerInterface {
  private readonly callActionWaitMs: number;

  private readonly broadcastChannel: BroadcastChannel;

  private readonly onLocalHandlers: Map<
    LocalEventsType,
    Set<LocalHandlerFnType>
  >;

  private readonly replyHandlers: Map<string, ReplyCallbackType>;

  private readonly onActionsHandlers: Map<string, Set<ReplyCallbackFnType>>;

  constructor(callActionWaitMs: number = 10 * 1000) {
    this.callActionWaitMs = callActionWaitMs;
    this.broadcastChannel = new BroadcastChannel('px-channel');
    this.broadcastChannel.onmessage = (
      event: MessageEvent<BroadcastMessageType>,
    ) => this.onBroadcastChannel(event);

    this.onLocalHandlers = new Map<LocalEventsType, Set<LocalHandlerFnType>>();
    this.replyHandlers = new Map<string, ReplyCallbackType>();
    this.onActionsHandlers = new Map<string, Set<ReplyCallbackFnType>>();
  }

  public disconnect() {
    this.broadcastChannel?.close();
  }

  public on(trigger: LocalEventsType, handler: LocalHandlerFnType) {
    const handlers = this.onLocalHandlers.get(trigger) ?? new Set();
    handlers.add(handler);
    this.onLocalHandlers.set(trigger, handlers);
  }

  public off(trigger: LocalEventsType, handler: LocalHandlerFnType) {
    const handlers = this.onLocalHandlers.get(trigger) ?? new Set();
    handlers.delete(handler);
    this.onLocalHandlers.set(trigger, handlers);
  }

  public callAction<T = any>(
    to: CallToType,
    data: CallDataType,
  ): Promise<T | undefined> {
    return new Promise((resolve) => {
      const actionId = `${Date.now()}_${globalThis.crypto.randomUUID()}`;

      BroadcastChannelService.send({
        event: RequestEventsEnum.SEND_MESSAGE,
        data: {
          event: RequestEventsEnum.CALL_ACTION,
          data: { to, action: data.action, actionId, payload: data.payload },
        },
      });

      const timeHandler = setTimeout(() => {
        resolve(undefined);
        this.replyHandlers.delete(actionId);
      }, this.callActionWaitMs);

      this.replyHandlers.set(actionId, { func: resolve, timeHandler });
    });
  }

  public onAction(callback: OnActionFnType) {
    const routes = {
      on: (action: string, handler: (ctx: Context) => unknown) => {
        const set = this.onActionsHandlers.get(action) ?? new Set();
        set.add(handler);
        this.onActionsHandlers.set(action, set);
      },
    };

    callback(routes);
  }

  public offAction(callback: OffActionFnType) {
    const routes = {
      off: (action: string, handler: (ctx: Context) => unknown) => {
        const set = this.onActionsHandlers.get(action) ?? new Set();
        set.delete(handler);

        if (set.size === 0) this.onActionsHandlers.delete(action);
        else this.onActionsHandlers.set(action, set);
      },
    };

    callback(routes);
  }

  private _on(event: LocalEventsType) {
    const handlers = this.onLocalHandlers.get(event) ?? new Set();
    for (const item of Array.from(handlers)) {
      void item();
    }
  }

  private _onAction(data: RequestCallEventType) {
    const handlers = this.onActionsHandlers.get(data.action);
    if (!handlers) return;

    for (const handler of Array.from(handlers)) {
      const context = {
        from: data.from,
        to: data.to,
        payload: data.payload,
        reply: (payload: unknown) => {
          BroadcastChannelService.send({
            event: RequestEventsEnum.SEND_MESSAGE,
            data: {
              event: RequestEventsEnum.REPLY_ACTION,
              data: {
                to: { connectionId: data.from.connection.id },
                actionId: data.actionId,
                payload,
              },
            },
          });
        },
      };

      handler(context);
    }
  }

  private _onReplyAction(data: ResponseReplyType) {
    const handler = this.replyHandlers.get(data.actionId);
    if (!handler) return;

    handler.func(data.payload);
    clearTimeout(handler.timeHandler);
    this.replyHandlers.delete(data.actionId);
  }

  private onBroadcastChannel(payload: MessageEvent<BroadcastMessageType>) {
    switch (payload.data.event) {
      case RegisterActionEventsEnum.ON:
        this._on(payload.data.data);
        break;
      case RegisterActionEventsEnum.ON_ACTION:
        this._onAction(payload.data.data);
        break;
      case RegisterActionEventsEnum.ON_REPLY_ACTION:
        this._onReplyAction(payload.data.data);
        break;
    }
  }
}
