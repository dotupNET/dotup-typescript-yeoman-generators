import { Question } from './Question';
export class OptionalQuestion<T> extends Question<T> {
  constructor(name: string, props: Partial<Question<T>>) {
    super(name, props);
    this.isRequired = false;
  }
}
