
import * as fs from 'fs';
import * as path from 'path';
import { Project } from './Project';
import { ProjectInfo } from './ProjectInfo';
import { TemplateFileInfo } from './TemplateFileInfo';
import { TemplateType } from './TemplateType';

function to<T>(value: T): T { return value; }

export class ProjectPathAnalyser {
  // private readonly project: ProjectInfo;
  private readonly joinTemplatePath: (...args: string[]) => string;
  private readonly templatePath: string;
  constructor(templatePath: (...args: string[]) => string) {
    // this.project = project;
    this.joinTemplatePath = templatePath;
    this.templatePath = templatePath();
  }

  getProjectFiles(project: ProjectInfo): Project {
    const projectFiles = new Project(project);
    const allFiles: TemplateFileInfo[] = [];

    // TODO: Files in root/templates
    const rootFiles = this.getDeepFiles(this.templatePath);
    projectFiles.templateFiles = rootFiles;

    // For each source template type
    // const templateTypes = Object.keys(TemplateType);
    // templateTypes.map(t => {
    //   const typ = TemplateType[<any>t];
    //   const files: string[] = [];

    //   // Get the path: root/templates/__typ__/language
    //   const languageDir = this.getPath(typ, project.language);
    //   const templateDir = path.relative(this.templatePath, languageDir);

    //   const f = this.getDeepFiles(languageDir, [typ, project.language].join('\\'));
    //   allFiles.push(...f);
    // });

    return projectFiles;
  }

  // tslint:disable: newline-per-chained-call

  getDeepFiles(dir: string): TemplateFileInfo[] {
    const f = this.getFiles(dir);
    const dirs = this.getDirectoryDirectories(dir);

    const dirFiles = dirs.map(d =>
      this.getDeepFiles(
        path.join(dir, d)
      )
    );
    const df = dirFiles.length < 1 ? [] : dirFiles.reduce((prev, cur) => prev.concat(cur));

    return f.concat(df);
  }

  getFiles(dir: string): TemplateFileInfo[] {
    const files = this.getDirectoryFiles(dir);

    // tslint:disable-next-line: no-unnecessary-local-variable
    const typed = files.map(file => {
      let typ: TemplateType;
      const filePath = path.join(dir, file);

      let relativePath = path.relative(this.templatePath, filePath);

      // TODO: NOT NICE! Refactor!
      // if (/\b__copy__\b/.test(dir)) {
      //   relativePath = relativePath.replace(/\b__copy__\\ts\\\b/g, '');
      //   relativePath = relativePath.replace(/\b__copy__\\\b/g, '');
      //   typ = TemplateType.copyOnly;
      // } else if (/\b__ejs__\b/.test(dir)) {
      //   relativePath = relativePath.replace(/\b__ejs__\\ts\\\b/g, '');
      //   relativePath = relativePath.replace(/\b__ejs__\\\b/g, '');
      //   typ = TemplateType.ejs;
      // } else {
      typ = this.categorizeFile(file);
      // }
      if (typ === TemplateType.removeExtension) {
        const newName = path.join(dir, path.basename(file, path.extname(file)));
        relativePath = path.relative(this.templatePath, newName);
      }
      
      return to<TemplateFileInfo>({
        // name: file,
        filePath: filePath,
        targetPath: relativePath,
        typ: typ
      });
    });

    return typed;
  }

  getDirectoryDirectories(dir: string): string[] {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const dirContent = fs.readdirSync(dir);

    return dirContent.filter(f => {
      return fs.lstatSync(path.join(dir, f)).isDirectory();
    });
  }

  getDirectoryFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const dirContent = fs.readdirSync(dir);

    return dirContent.filter(f => {
      return fs.lstatSync(path.join(dir, f)).isFile();
    });
  }

  // private getPath(typ: string, projectLanguage: string, projectTyp?: string, projectRuntime?: string): string {
  //   let typPrefix = '';

  //   switch (typ) {
  //     case TemplateType.copyOnly:
  //     case TemplateType.ejs:
  //       typPrefix = typ;
  //   }

  //   if (projectRuntime !== undefined) {
  //     return this.joinTemplatePath(typPrefix, projectLanguage, projectTyp, projectRuntime);
  //   } else if (projectTyp !== undefined) {
  //     return this.joinTemplatePath(typPrefix, projectLanguage, projectTyp);
  //   } else if (projectLanguage !== undefined) {
  //     return this.joinTemplatePath(typPrefix, projectLanguage);
  //   } else {
  //     return this.joinTemplatePath(typPrefix);
  //   }
  // }

  categorizeFile(name: string): TemplateType {

    if (name.startsWith(TemplateType.copyOnly)) {
      return TemplateType.copyOnly;
      // } else if (name.startsWith(TemplateType.ejs)) {
      //   return TemplateType.ejs;
      // } else if (name.startsWith(TemplateType.merge)) {
      //   return TemplateType.merge;
      // } else if (path.extname(name) === '.ejs') {
      //   return TemplateType.ejs;
    } else if (path.extname(name) === '._') {
      return TemplateType.removeExtension;
    } else {
      return TemplateType.copyOnly;
    }

  }

  // categorizeFolder(name: string): TemplateType {

  //   if (name.match(/\b__copy__\b/)) {
  //     return TemplateType.copyOnly;
  //   } else if (name.match(/\b__ejs__\b/)) {
  //     return TemplateType.ejs;
  //   } else if (path.extname('.ejs')) {
  //     return TemplateType.projectTypeFolder;
  //   } else {
  //     return TemplateType.copyOnly;
  //   }

  // }

}
