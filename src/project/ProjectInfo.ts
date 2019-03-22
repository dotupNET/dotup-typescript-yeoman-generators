import { ProjectLanguage } from './ProjectLanguage';
import { ProjectType } from './ProjectType';

export class ProjectInfo {
  language: ProjectLanguage; // 'ts' | 'js';
  typ: ProjectType; // 'app' | 'lib';
  runtime: 'node';
  // sourceDirName: string;
}
