import { TabsMessagesType } from '../../layers/tabs-layer/types/tabs-messages.type';
import { RequestMessageType } from '../../layers/connection-layer/types/request-message.type';
import { RegisterActionMessagesType } from '../../layers/register-actions-layer/types/register-action-messages.type';

export type BroadcastMessageType =
  | TabsMessagesType
  | RequestMessageType
  | RegisterActionMessagesType;
