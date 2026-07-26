import { TabsEnum } from './tabs.enum';

type CreateTab = {
  event: TabsEnum.DELETE_TAB;
  data: number;
};

type DeleteTab = {
  event: TabsEnum.CREATE_TAB;
  data: number;
};

type SyncTab = {
  event: TabsEnum.SYNC_TAB;
  data: number[];
};

export type TabsMessagesType = CreateTab | DeleteTab | SyncTab;
