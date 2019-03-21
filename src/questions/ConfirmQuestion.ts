import { InquirerQuestionType } from '..';
import { Question } from './Question';
export class ConfirmQuestion<T> extends Question<T> {
  constructor(name: string, message: string, store: boolean = true) {
    super(name, undefined);
    this.store = store;
    this.type = InquirerQuestionType.confirm;
    this.message = message;
  }
}
