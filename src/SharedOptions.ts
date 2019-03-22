import { IProperty, ITypedProperty } from './Types';
import { BaseGenerator } from './BaseGenerator';
import { SharedOptionsSubscription } from './SharedOptionsSubscription';
import { ISharedOptionsSubscriber } from './ISharedOptionsSubscriber';

export class SharedOptions<TStep extends string> {

  values: ITypedProperty<string> = {};

  subscriber: SharedOptionsSubscription<TStep>[] = [];

  subscribe(subscriber: ISharedOptionsSubscriber, questionName: TStep | string): void {
    const question = <string>questionName;
    const questionSubscriber = this.subscriber.find(s => s.isSubscriber(subscriber));

    if (questionSubscriber === undefined) {
      const newSubscriber = new SharedOptionsSubscription(subscriber);
      newSubscriber.addStepSubscription(questionName);
      this.subscriber.push(newSubscriber);
    } else {
      questionSubscriber.addStepSubscription(question);
    }

  }

  getAnswer(questionName: TStep | string): string {
    //    return BaseGenerator.mergedAnswers[<string>questionName];
    return this.values[<string>questionName];
  }

  setAnswer(questionName: TStep | string, value: string): void {
    //    return BaseGenerator.mergedAnswers[<string>questionName];
    this.values[<string>questionName] = value;

    const subs = this.subscriber
      .filter(s => s.hasStepSubscription(<string>questionName))
      .map(x => x.getSubscriber());
    subs.forEach(x => x.onValue(<string>questionName, value));
  }

}