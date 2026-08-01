import { TabsLayerInterface } from './types/tabs-layer.interface';
import { BroadcastChannelService } from '../../services/broadcast-channel.service';
import { TabsEnum } from './types/tabs.enum';
import { OnUpdateFunc } from './types/on-update-func.type';
import { BroadcastMessageType } from '../../services/types/broadcast-message.type';

export class TabsLayer implements TabsLayerInterface {
  private readonly tabId: number;
  private readonly broadcastChannel: BroadcastChannel;
  private tabs: number[];
  private isMainTab: boolean;
  private electionTimeout: NodeJS.Timeout | undefined;
  private onUpdateFunc: OnUpdateFunc | undefined;

  constructor() {
    this.tabId = Date.now() + Math.random();
    this.tabs = [this.tabId];
    this.electionTimeout = undefined;
    this.isMainTab = false;

    this.broadcastChannel = BroadcastChannelService.getChannel();
    this.broadcastChannel.onmessage = this.onmessage;
  }

  public connect = () => {
    BroadcastChannelService.send({
      event: TabsEnum.CREATE_TAB,
      data: this.tabId,
    });
  };

  public disconnect = () => {
    clearTimeout(this.electionTimeout);
    this.broadcastChannel?.close();
    BroadcastChannelService.send({
      event: TabsEnum.DELETE_TAB,
      data: this.tabId,
    });
  };

  public onUpdate = (func: OnUpdateFunc) => {
    this.onUpdateFunc = func;
  };

  private onmessage = ({ data }: MessageEvent<BroadcastMessageType>) => {
    switch (data.event) {
      case TabsEnum.CREATE_TAB:
        this.tabs = Array.from(new Set([...this.tabs, data.data])).sort(
          (a, b) => a - b,
        );
        if (this.tabs[0] === this.tabId)
          BroadcastChannelService.send({
            event: TabsEnum.SYNC_TAB,
            data: this.tabs,
          });
        break;
      case TabsEnum.SYNC_TAB:
        clearTimeout(this.electionTimeout);
        this.tabs = Array.from(new Set([...this.tabs, ...data.data])).sort(
          (a, b) => a - b,
        );
        this.updateMainTabStatus();
        break;
      case TabsEnum.DELETE_TAB:
        this.tabs = this.tabs.filter((id) => id !== data.data);
        this.updateMainTabStatus();
        break;
    }
  };

  private updateMainTabStatus = () => {
    const isCurrentMain = this.tabs[0] === this.tabId;
    if (isCurrentMain === this.isMainTab) return;
    this.isMainTab = isCurrentMain;

    if (this.onUpdateFunc) this.onUpdateFunc(this.isMainTab);
  };
}
