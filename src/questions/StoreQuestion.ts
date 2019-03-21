import { Question } from './Question';
export class StoreQuestion<T> extends Question<T> {
  constructor(name: string, props: Partial<Question<T>>) {
    super(name, props);
    this.store = true;
  }
}
