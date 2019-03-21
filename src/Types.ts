import { FunctionNamesOnly, TypeSaveProperty, Nested } from 'dotup-ts-types';
import { BaseGenerator } from './BaseGenerator';

export interface StringProperty {
  [key: string]: string;
}


export type MethodsToRegister<T extends string> = FunctionNamesOnly<Pick<BaseGenerator<T>,
  'initializing' | 'prompting' | 'configuring' | 'default' | 'writing' |
  'install' | 'end'
>>;

export enum InquirerQuestionType {
  input = 'input',
  number = 'number',
  confirm = 'confirm',
  list = 'list',
  rawlist = 'rawlist',
  password = 'password'
}

export type GeneratorOptions<T extends string> = Partial<TypeSaveProperty<Nested<T, string>>>;
