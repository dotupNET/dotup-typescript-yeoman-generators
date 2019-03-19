// tslint:disable: max-classes-per-file
import { Answers, ChoiceType } from 'inquirer';
import { InquirerQuestionType } from './BaseGenerator';
import { IStepQuestion } from './IStepQuestion';

export class Question<T> implements IStepQuestion<T> {
  isRequired?: boolean = true;
  isOption?: boolean = true;
  description?: string;
  optionType?: BooleanConstructor | StringConstructor | NumberConstructor;
  nextQuestion?: T;
  store?: boolean;
  // tslint:disable-next-line: no-reserved-keywords
  type?: string;
  name?: string;
  // tslint:disable-next-line: no-reserved-keywords : no-any
  default?: any;
  paginated?: boolean;
  pageSize?: number;
  mask?: string;
  prefix?: string;
  suffix?: string;
  // name: string;
  message?: string | ((answers: Answers) => string);
  // tslint:disable-next-line: max-line-length
  choices?: ReadonlyArray<ChoiceType> | ((answers: Answers) => ReadonlyArray<ChoiceType>) | ((answers: Answers) => Promise<ReadonlyArray<ChoiceType>>);
  When?: ((answers: Answers) => boolean); // boolean | ((answers: Answers) => boolean) | ((answers: Answers) => Promise<boolean>);
  // tslint:disable-next-line: no-any
  filter?(input: string): any;
  transformer?(input: string): string;
  // tslint:disable-next-line: no-any
  validate?(input: any, answers?: Answers): string | boolean | Promise<string | boolean>;
  acceptAnswer?(answer?: string | boolean | number): string | boolean | number | Promise<string | boolean | number>;

  // constructor(name: string, isRequired: boolean = true, isOption: boolean = true) {
  constructor(name: string, props?: Partial<Question<T>>) {
    if (props !== undefined) {
      this.setProps(props);
    }
    this.name = name;
  }

  protected setProps(props: Partial<Question<T>>): void {
    Object
      .keys(props)
      .forEach(p => {
        // tslint:disable-next-line: no-any
        (<any>this)[p] = (<any>props)[p];
      });

  }
}

export class OptionalQuestion<T> extends Question<T> {
  constructor(name: string, props: Partial<Question<T>>) {
    super(name, props);
    this.isRequired = false;
  }
}

export class StoreQuestion<T> extends Question<T> {
  constructor(name: string, props: Partial<Question<T>>) {
    super(name, props);
    this.store = true;
  }
}

export class InputQuestion<T> extends Question<T> {
  constructor(name: string, message: string, store: boolean = true) {
    super(name, undefined);
    this.store = store;
    this.type = InquirerQuestionType.input;
    this.message = message;
  }
}

export class ConfirmQuestion<T> extends Question<T> {
  constructor(name: string, message: string, store: boolean = true) {
    super(name, undefined);
    this.store = store;
    this.type = InquirerQuestionType.confirm;
    this.message = message;
  }
}
