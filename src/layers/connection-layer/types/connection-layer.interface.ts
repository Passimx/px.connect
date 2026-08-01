export interface ConnectionLayerInterface {
  connect(): unknown;

  disconnect(): unknown;

  getConnectionId(): string | undefined;
}
