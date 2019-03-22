// tslint:disable
// import { ISharedOptionsSubscriber } from "./ISharedOptionsSubscriber";
// export class SharedOptionsSubscription<TStep extends string> {
//   private subscriber: ISharedOptionsSubscriber;
//   stepNames: string[] = [];
//   constructor(subscriber: ISharedOptionsSubscriber) {
//     this.subscriber = subscriber;
//   }
//   isSubscriber(subscriber: ISharedOptionsSubscriber): boolean {
//     return subscriber === this.subscriber;
//   }
//   getSubscriber(): ISharedOptionsSubscriber {
//     return this.subscriber;
//   }
//   getStepSubscriber(stepname: string): ISharedOptionsSubscriber {
//     if (this.hasStepSubscription(stepname)) {
//       return undefined;
//     }
//     return this.subscriber;
//   }
//   addStepSubscription(stepname: string): void {
//     if (this.hasStepSubscription(stepname)) {
//       return;
//     }
//     this.stepNames.push(stepname);
//   }
//   hasStepSubscription(stepname: string): boolean {
//     if (this.subscriber === undefined) {
//       return false;
//     }
//     return this.stepNames.some(n => n.includes(stepname));
//   }
//   dispose(): void {
//     this.subscriber = undefined;
//   }
// }
