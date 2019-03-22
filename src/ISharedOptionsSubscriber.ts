export interface ISharedOptionsSubscriber {
  onValue: (key: string, value: any) => void;
}
