import chalk from 'chalk';
import { Nested, TypeSaveProperty } from 'dotup-ts-types';
import * as fs from 'fs';
import * as _ from 'lodash';
import { NpmApi, NpmVersion } from 'npm-registry-api';
import * as path from 'path';
import generator from 'yeoman-generator';
import { Project } from './project/Project';
import { ProjectInfo } from './project/ProjectInfo';
import { ProjectPathAnalyser } from './project/ProjectPathAnalyser';
// import { Question } from 'yeoman-generator';
import { IStepQuestion } from './questions/IStepQuestion';
import { Question } from './questions/Question';
import { SharedOptions } from './SharedOptions';
import { GeneratorOptions, IProperty, MethodsToRegister } from './Types';
import { TemplateType } from './project';

export abstract class BaseGenerator<TStep extends string> extends generator {

  static counter: number = 0;
  static sharedOptions: SharedOptions<string>;

  public get sharedOptions(): SharedOptions<TStep> {
    return BaseGenerator.sharedOptions;
  }

  readonly projectInfo: ProjectInfo;
  private readonly doNotEjsReplace: string[] = [];
  private readonly skippedTemplateFiles: string[] = [];
  private readonly generatorName: string;

  skipQuestions: boolean = false;
  skipGenerator: boolean = false;
  projectFiles: Project;

  conflictedProjectFiles: Project;

  answers: TypeSaveProperty<Nested<TStep, string>> = <TypeSaveProperty<Nested<TStep, string>>>{};

  questions: IStepQuestion<TStep>[] = [];

  currentStep: TStep;

  constructor(args: string | string[], options: GeneratorOptions<TStep>) {
    super(args, options);

    BaseGenerator.counter += 1;
    BaseGenerator.sharedOptions = (<IProperty>options)['sharedOptions']; // (<IProperty>options)['sharedOptions'];

    if (this.sharedOptions !== undefined) {
      _.merge(options, this.sharedOptions.values);
    }

    if ((<IProperty>options).skippedTemplateFiles !== undefined) {
      (<string[]>(<IProperty>options).skippedTemplateFiles).forEach(f => {
        this.addSkippedTemplateFiles(f);
      })
    }

    this.generatorName = this.constructor.name;
    this.projectInfo = new ProjectInfo();

    this.setRootPath();
  }

  compose(generator: string, passThroughAnswers: boolean = true, options?: any): void {
    const optArgs = options || {};
    if (passThroughAnswers) {
      _.merge(optArgs, this.answers);
    }
    optArgs['sharedOptions'] = this.sharedOptions;
    const filePath = require.resolve(generator,
      {
        paths: [
          path.join(this.sourceRoot(), '..')
        ]
      })
    this.composeWith(filePath, optArgs);
  }

  // trySubscribeSharedOption(questionName: TStep | string): void {
  //   if (this.sharedOptions !== undefined) {
  //     this.sharedOptions.subscribe(this, questionName);
  //   }
  // }

  addSkipEjsReplacement(targetPath: string): void {
    this.doNotEjsReplace.push(targetPath);
  }

  addSkippedTemplateFiles(targetPath: string): void {
    const tmp = path.normalize(targetPath);
    this.skippedTemplateFiles.push(tmp);
  }

  isAnswered(): boolean {
    const required = this.questions.filter(item => item.isRequired === true);

    // tslint:disable-next-line: no-any
    return required.every(item => (<any>this.answers)[item.name] !== undefined);
  }

  getQuestion(name: TStep): IStepQuestion<TStep> {
    return this.questions.find(item => item.name === name);
  }

  tryGetAnswer(questionName: TStep) {
    if (this.answers[questionName] !== undefined) {
      return this.answers[questionName];
    } else if (this.sharedOptions === undefined) {
      return undefined;
    } else {
      return this.sharedOptions.getAnswer(questionName);
    }
  }

  mergeAnswers(): void {
    if (this.sharedOptions === undefined) {
      return;
    }

    _.merge(this.answers, this.sharedOptions.values);
  }

  setRootPath(rootPath?: string): void {

    if (this.sharedOptions === undefined || this.sharedOptions.rootPath === undefined) {
      return;
    }

    // We're in the wrong folder, try to set root
    if (this.destinationPath() !== this.sharedOptions.rootPath) {
      this.sourceRoot(this.sharedOptions.rootPath);
    }

    // If the destination path still points to another directory, a yo file is in parent folder.
    if (this.destinationPath() !== this.sharedOptions.rootPath) {
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
        if (BaseGenerator.sharedOptions) {
          BaseGenerator.sharedOptions.setAnswer(key, opt[key]);
        }
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

  loadTemplateFiles(): void {
    if (this.skipGenerator) return;

    this.logBlue(`Analyse template files. (${this.generatorName})`);
    const x = new ProjectPathAnalyser((...args) => this.templatePath(...args));
    this.projectFiles = x.getProjectFiles(this.projectInfo);
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
   * 
   * OVERRIDES
   * 
   */
  destinationRoot(rootPath?: string): string {
    if (this.sharedOptions !== undefined) {
      this.sharedOptions.setRootPath(rootPath);
    }

    return super.destinationRoot(rootPath);
  }

  composeWith(namespace: any, options: { [name: string]: any }, settings?: { local: string, link: 'weak' | 'strong' }): this {
    const optArgs = options || {};
    _.merge(optArgs, this.answers);
    optArgs['sharedOptions'] = this.sharedOptions;

    return super.composeWith(namespace, options, settings);
  }

  /**
   * 
   * RUN LOOP
   * 
   */

  /**
   * Your initialization methods(checking current project state, getting configs, etc)
   */
  async initializing(): Promise<void> { }

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
          // Maybe answer changed in callback
          if (BaseGenerator.sharedOptions) {
            BaseGenerator.sharedOptions.setAnswer(this.currentStep, this.answers[this.currentStep]);
          }
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

  async copyTemplateFiles(): Promise<void> {
    if (this.skipGenerator) return;

    this.mergeAnswers();

    this.conflictedProjectFiles = new Project(this.projectInfo);

    this.projectFiles.templateFiles.forEach(file => {

      // Get the file extension
      let ext = path.extname(file.filePath);

      // Remove the extension on renamable files
      if (file.typ === TemplateType.removeExtension) {
        ext = path.extname(file.targetPath);
      }

      if (ext === '') {
        ext = path.basename(file.filePath);
      }


      // Skip this file?
      if (this.skippedTemplateFiles.includes(file.targetPath)) {
        return;
      }

      if (this.fs.exists(this.destinationPath(file.targetPath))) {

        switch (ext) {
          case '.ts':
            throw new Error(`Resolving conflicted ${ext} files not implemented.`);

          case '.json':
            const newJsonContent = {};
            const existingJsonFileContent = this.fs.read(file.targetPath, 'utf-8');
            const existingJsonContent = JSON.parse(existingJsonFileContent);
            const addJsonFileContent = fs.readFileSync(file.filePath, 'utf-8');
            const addJsonContent = JSON.parse(addJsonFileContent);

            _.mergeWith(newJsonContent, addJsonContent, (objValue, srcValue) => {
              if (_.isArray(objValue)) {
                return objValue.concat(srcValue);
              }
            });
            _.mergeWith(newJsonContent, existingJsonContent, (objValue, srcValue) => {
              if (_.isArray(objValue)) {
                return objValue.concat(srcValue);
              }
            });

            // tslint:disable-next-line: no-unsafe-any
            // this.fs.extendJSON(this.destinationPath(file.targetPath), addJsonContent);
            this.fs.write(this.destinationPath(file.targetPath), JSON.stringify(newJsonContent, undefined, 2));
            if (!this.doNotEjsReplace.includes(file.targetPath)) {
              this.fs.copyTpl(this.destinationPath(file.targetPath), this.destinationPath(file.targetPath), this.answers);
            }
            break;

          case '.yml':
          case '.txt':
          case '.md':
          case '.gitignore':
          case '.npmignore':
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
   * Where you write the generator specific files(routes, controllers, etc)
   */
  // tslint:disable-next-line: no-reserved-keywords
  async default(): Promise<void> {
    if (this.skipGenerator) return;

    this.setRootPath();

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
  async install(): Promise<void> { }

  /**
   * Called last, cleanup, say good bye, etc
   */
  async end(): Promise<void> { }

}
