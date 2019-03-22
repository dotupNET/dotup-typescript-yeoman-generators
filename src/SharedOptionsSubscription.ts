import { ISubscriber } from './SharedOptions';
export class SharedOptionsSubscription<TStep extends string> {
  private subscriber: ISubscriber;
  stepNames: string[] = [];
  constructor(subscriber: ISubscriber) {
    this.subscriber = subscriber;
  }
  isSubscriber(subscriber: ISubscriber): boolean {
    return subscriber === this.subscriber;
  }
  getSubscriber(): ISubscriber {
    return this.subscriber;
  }
  getStepSubscriber(stepname: string): ISubscriber {
    if (this.hasStepSubscription(stepname)) {
      return undefined;
    }
    return this.subscriber;
  }
  addStepSubscription(stepname: string): void {
    if (this.hasStepSubscription(stepname)) {
      return;
    }
    this.stepNames.push(stepname);
  }
  hasStepSubscription(stepname: string): boolean {
    if (this.subscriber === undefined) {
      return false;
    }
    return this.stepNames.some(n => n.includes(stepname));
  }
  dispose(): void {
    this.subscriber = undefined;
  }
}
