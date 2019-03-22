import chalk from 'chalk';
import { FunctionNamesOnly, Nested, TypeSaveProperty } from 'dotup-ts-types';
import * as fs from 'fs';
import * as _ from 'lodash';
import { NpmApi, NpmVersion } from 'npm-registry-api';
import * as path from 'path';
import generator from 'yeoman-generator';
// import { Question } from 'yeoman-generator';
import { IStepQuestion } from './questions/IStepQuestion';
import { Project } from './project/Project';
import { ProjectInfo } from './project/ProjectInfo';
import { ProjectPathAnalyser } from './project/ProjectPathAnalyser';
import { Question } from './questions/Question';
import { GeneratorOptions, MethodsToRegister, IProperty, ITypedProperty } from './Types';
import { SharedOptions } from './SharedOptions';
import { ISharedOptionsSubscriber } from "./ISharedOptionsSubscriber";

export abstract class BaseGenerator<TStep extends string> extends generator implements ISharedOptionsSubscriber {
  onValue(key: string, value: any): void {
    (<IProperty>this.options)[key] = value;
  };

  static counter: number = 0;
  static sharedOptions: SharedOptions<string>;


  public get sharedOptions(): SharedOptions<TStep> {
    return BaseGenerator.sharedOptions;
  }

  readonly projectInfo: ProjectInfo;
  private readonly doNotEjsReplace: string[] = [];

  skipQuestions: boolean = false;
  skipGenerator: boolean = false;
  projectFiles: Project;

  conflictedProjectFiles: Project;

  generatorName: string;

  answers: TypeSaveProperty<Nested<TStep, string>> = <TypeSaveProperty<Nested<TStep, string>>>{};

  questions: IStepQuestion<TStep>[] = [];

  currentStep: TStep;

  constructor(args: string | string[], options: GeneratorOptions<TStep>, sharedOptions?: SharedOptions<TStep>) {
    super(args, options);

    BaseGenerator.counter += 1;
    BaseGenerator.sharedOptions = sharedOptions; // (<IProperty>options)['sharedOptions'];

    this.generatorName = this.constructor.name;
    this.projectInfo = new ProjectInfo();

    this.setRootPath();
  }

  compose(generator: string, passThroughAnswers: boolean = true, options?: any): void {
    const optArgs = passThroughAnswers ? this.answers : options;
    this.composeWith(require.resolve('generator'), optArgs);
  }

  trySubscribeSharedOption(questionName: TStep | string): void {
    if (this.sharedOptions !== undefined) {
      this.sharedOptions.subscribe(this, questionName);
    }
  }

  addSkipEjsReplacement(targetPath: string): void {
    this.doNotEjsReplace.push(targetPath);
  }

  isAnswered(): boolean {
    const required = this.questions.filter(item => item.isRequired === true);

    // tslint:disable-next-line: no-any
    return required.every(item => (<any>this.answers)[item.name] !== undefined);
  }

  getQuestion(name: TStep): IStepQuestion<TStep> {
    return this.questions.find(item => item.name === name);
  }

  setRootPath(): void {
    const opt = <IProperty>this.options;

    // We're in the wrong folder, try to set root
    if (opt.rootPath && this.destinationPath() !== opt.rootPath) {
      this.sourceRoot(opt.rootPath);
    }

    // If the destination path still points to another directory, a yo file is in parent folder.
    if (opt.rootPath && this.destinationPath() !== opt.rootPath) {
      this.logRed(`${this.generatorName}: Project target path is ${this.destinationPath()}`);
      this.logRed(`You've to delete the yo file to continue: ${this.destinationPath('.yo-rc.json')}`);
      throw new Error(`You've to delete the yo file to continue: ${this.destinationPath('.yo-rc.json')}`);
    } else {
      this.logGreen(`${this.generatorName}: Project target path is ${this.destinationPath()}`);
    }
  }

  registerMethod(self: BaseGenerator<TStep>): void {
    const methods: MethodsToRegister<TStep>[] = [
      'prompting', 'configuring', 'default', 'writing'
    ];
    methods.forEach(method => {
      // tslint:disable-next-line: no-unsafe-any
      self.constructor.prototype[method] = this[method];
    });
  }

  addQuestion(question: Question<TStep>): void {
    this.addStepQuestion(<TStep>question.name, question);
  }

  addStepQuestion(stepName: TStep, question: IStepQuestion<TStep>): void {

    // Avoid registering twice
    if (this.getQuestion(stepName) !== undefined) {
      throw new Error(`Question '${stepName}' already configured.`);
    }

    // If the name isn't set..
    if (question.name === undefined) {
      question.name = stepName;
    }

    // Build generator options
    // if (question.isOption) {
    //   this.option(question.name, {
    //     type: question.optionType || String,
    //     description: typeof question.message === 'function' ? '' : question.message // 'Name of the repository'
    //   });
    // }

    // With the first question
    if (this.currentStep === undefined) {
      this.currentStep = stepName;
    } else {

      // Set next question
      const keys = Object.keys(this.questions);
      // tslint:disable-next-line: no-any
      const prevQuestion = <IStepQuestion<TStep>>(<any>this.questions)[keys[keys.length - 1]];
      if (prevQuestion !== undefined && prevQuestion.nextQuestion === undefined) {
        prevQuestion.nextQuestion = stepName;
      }

    }

    // Add to questions
    // this.questions[stepName] = question;
    this.questions.push(question);

  }

  getDefaultProjectName(): string {
    const opt = <IProperty>this.options;

    if (opt.projectName) {
      return _.kebabCase(opt.projectName);
    } else {
      return _.kebabCase(this.appname);
    }
  }

  destinationIsProjectFolder(projectName: string): boolean {
    const root = path.basename(this.destinationPath());
    if (root.toLowerCase() === projectName.toLowerCase()) {
      return true;
    } else {
      return false;
    }
  }

  // tslint:disable-next-line: no-any
  writeOptionsToAnswers(propertyDescriptor: any): any {
    const keys = Object
      // tslint:disable-next-line: no-unsafe-any
      .keys(propertyDescriptor)
      .map(x => <TStep>x);

    const opt = <IProperty>this.options;
    keys.forEach(key => {
      if (opt[key] !== undefined) {
        this.answers[key] = opt[key];
      }
    });
  }

  validateString(value: string): boolean {
    if (value !== undefined && value.length > 0) {
      return true;
    } else {
      this.logRed(`${this.getQuestion(this.currentStep).message} is required.`);

      return false;
    }
  }

  logGreen(message: string): void {
    this.log(chalk.green(message));
  }

  logRed(message: string): void {
    this.log(chalk.red(message));
  }

  logBlue(message: string): void {
    this.log(chalk.blue(message));
  }

  logYellow(message: string): void {
    this.log(chalk.yellow(message));
  }

  /**
   * Your initialization methods(checking current project state, getting configs, etc)
   */
  abstract async initializing(): Promise<void>;

  /**
   * Where you prompt users for options(where you’d call this.prompt())
   */
  async prompting(): Promise<void> {
    if (this.skipGenerator) return;

    if (this.skipQuestions || this.questions.length < 1) {
      return;
    }

    // No entry point
    if (this.currentStep === undefined) {
      throw new Error('Initial step not set');
    }

    do {
      // Do we have user input?
      let hasInput = false;

      // Get current question
      const question = this.getQuestion(this.currentStep);

      // Set name to avoid writing the name twice on the definition
      question.name = this.currentStep;

      // Should ask?
      let ask = true;

      if (question.When !== undefined) {
        ask = await question.When(this.answers);
      }

      if (ask) {
        // Prompt
        const answer = await this.prompt(question);
        // Store answer
        if (answer[this.currentStep] !== undefined) {
          hasInput = true;
          this.answers[this.currentStep] = answer[this.currentStep];
          if (BaseGenerator.sharedOptions) {
            BaseGenerator.sharedOptions.setAnswer(this.currentStep, answer[this.currentStep]);
          }
        }
      }

      // Accept answer callback configured?
      if (hasInput && question.acceptAnswer !== undefined) {

        const accepted = await this
          .getQuestion(this.currentStep)
          .acceptAnswer(this.answers[this.currentStep]);

        // Should we ask again same step?
        if (accepted === true) {
          // Set next step
          this.currentStep = question.nextQuestion;
        }

      } else {

        // Set next step
        this.currentStep = question.nextQuestion;
      }

    } while (this.currentStep !== undefined);
  }

  /**
   * Saving configurations and configure the project(creating.editorconfig files and other metadata files)
   */
  async configuring(): Promise<void> {
    if (this.skipGenerator) return;
    // tslint:disable-next-line: no-backbone-get-set-outside-model
    // this.config.set('answers', this.answers);
    // this.config.save();
  }

  loadTemplateFiles(): void {
    if (this.skipGenerator) return;

    this.logBlue(`Analyse template files. (${this.generatorName})`);
    const x = new ProjectPathAnalyser((...args) => this.templatePath(...args));
    this.projectFiles = x.getProjectFiles(this.projectInfo);
  }

  async copyTemplateFiles(): Promise<void> {
    if (this.skipGenerator) return;

    this.conflictedProjectFiles = new Project(this.projectInfo);

    this.projectFiles.templateFiles.forEach(file => {

      // Get the file extension
      let ext = path.extname(file.filePath);
      if (ext === '') {
        ext = path.basename(file.filePath);
      }

      if (this.fs.exists(this.destinationPath(file.targetPath))) {

        switch (ext) {
          case '.ts':
            throw new Error(`Resolving conflicted ${ext} files not implemented.`);

          case '.json':
            const fileContent = fs.readFileSync(file.filePath, 'utf-8');
            const addJsonContent = JSON.parse(fileContent);
            // tslint:disable-next-line: no-unsafe-any
            this.fs.extendJSON(this.destinationPath(file.targetPath), addJsonContent);
            if (!this.doNotEjsReplace.includes(file.targetPath)) {
              this.fs.copyTpl(this.destinationPath(file.targetPath), this.destinationPath(file.targetPath), this.answers);
            }
            break;

          case '.yml':
          case '.txt':
          case '.md':
          case '.gitignore':
            const newGitContent = fs.readFileSync(file.filePath, 'utf-8');
            const gitContent = this.fs.read(this.destinationPath(file.targetPath), 'utf-8');
            const newFileContent = `${gitContent}\n\n# ${this.generatorName} related:\n${newGitContent}`;

            this.fs.write(this.destinationPath(file.targetPath), newFileContent);
            if (!this.doNotEjsReplace.includes(file.targetPath)) {
              this.fs.copyTpl(this.destinationPath(file.targetPath), this.destinationPath(file.targetPath), this.answers);
            }
            break;

          default:
            this.conflictedProjectFiles.templateFiles.push(file);
            throw new Error(`Could not resolve conflicted ${ext} files.`);

        }

      } else {

        switch (ext) {

          case '.yml':
          case '.txt':
          case '.js':
          case '.md':
          case '.json':
          case '.gitignore':
          case '.npmignore':
            if (this.doNotEjsReplace.includes(file.targetPath)) {
              this.fs.copy(file.filePath, this.destinationPath(file.targetPath));
            } else {
              this.fs.copyTpl(file.filePath, this.destinationPath(file.targetPath), this.answers);
            }
            break;

          default:
            this.fs.copy(file.filePath, this.destinationPath(file.targetPath));

        }

      }
    });

    const npm = new NpmApi();
    const packegeJson = <NpmVersion>this.fs.readJSON(this.destinationPath('package.json'));

    if (packegeJson !== undefined) {
      await npm.updateDependencies(packegeJson);
      this.fs.writeJSON('package.json', packegeJson);
    }
  }

  /**
   * If the method name doesn’t match a priority, it will be pushed to this group.
   */
  // tslint:disable-next-line: no-reserved-keywords
  // abstract async default(): Promise<void>;

  /**
   * Where you write the generator specific files(routes, controllers, etc)
   */
  // abstract async writing(): Promise<void>;
  // tslint:disable-next-line: no-reserved-keywords
  async default(): Promise<void> {
    if (this.skipGenerator) return;

    this.loadTemplateFiles();
  }

  async writing(): Promise<void> {
    if (this.skipGenerator) return;

    await this.copyTemplateFiles();
  }

  /**
   * Where conflicts are handled(used internally)
   */
  // abstract async conflicts(): Promise<void>;

  // async resolveConflicts(): Promise<void> {
  //   const conflicted = this.conflictedProjectFiles.templateFiles;

  //   conflicted.forEach(file => {
  //     const ext = path.extname(file.filePath);

  //     switch (ext) {
  //       case '.ts':
  //         throw new Error(`Resolving conflicted ${ext} files not implemented.`);

  //       case '.json':
  //         const fileContent = fs.readFileSync(file.filePath, 'utf-8');
  //         const addJsonContent = JSON.parse(fileContent);
  //         this.fs.extendJSON(this.destinationPath(file.targetPath), addJsonContent);
  //         break;

  //       default:
  //         throw new Error(`Could not resolve conflicted ${ext} files.`);

  //     }

  //   });
  // }

  /**
   * Where installations are run(npm, bower)
   */
  abstract async install(): Promise<void>;

  /**
   * Called last, cleanup, say good bye, etc
   */
  abstract async end(): Promise<void>;

}
