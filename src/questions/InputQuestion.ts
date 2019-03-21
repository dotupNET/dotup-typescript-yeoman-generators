import { Question } from './Question';
import { InquirerQuestionType } from '../Types';
export class InputQuestion<T> extends Question<T> {
  constructor(name: string, message: string, store: boolean = true) {
    super(name, undefined);
    this.store = store;
    this.type = InquirerQuestionType.input;
    this.message = message;
  }
}
