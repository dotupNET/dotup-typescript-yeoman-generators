import { TemplateType } from './TemplateType';
// export enum TemplateGroupType {
//   copyOnly = '__copy__',
//   ejs = '__ejs__'
// }
export class TemplateFileInfo {
  filePath: string;
  targetPath: string;
  typ: TemplateType;
}
