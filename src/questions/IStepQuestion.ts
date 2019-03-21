import { Question } from 'yeoman-generator';
import { Answers } from 'inquirer';

export interface IStepQuestion<T> extends Question {
  isRequired?: boolean;
  isOption?: boolean;
  description?: string;
  optionType?: BooleanConstructor | StringConstructor | NumberConstructor;
  When?: ((answers: Answers) => boolean) | ((answers: Answers) => Promise<boolean>);

  nextQuestion?: T;
  // tslint:disable-next-line: no-any
  acceptAnswer?(answer?: string | boolean | number): string | boolean | number | Promise<string | boolean | number>;
}
