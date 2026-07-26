import { OnUpdateFunc } from './on-update-func.type';

export interface TabsLayerInterface {
  connect(): unknown;

  disconnect(): unknown;

  onUpdate(func: OnUpdateFunc): unknown;
}
