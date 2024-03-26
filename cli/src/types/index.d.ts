export type AnyJson  = {
  [key: string] : any
}
export class Creator {
  templateRoot: string
  destinationRoot: string
  constructor(templateRoot: string, destinationRoot: string)
  createFileFromTemplate(templateName: string, templatePath: string, destPath: string, options: CreateOptions): Promise<void>
}

export const enum CompilerType {
  Webpack5 = 'Webpack5',
  Webpack4 = 'Webpack4',
  Vite = 'Vite'
}

export interface CreateOptions {
  css?: CSSType
  cssExt?: string
  framework?: FrameworkType
  description?: string
  projectName: string
  version?: string
  date?: string
  typescript?: boolean
  template: string
  pageName?: string
  compiler?: CompilerType
  setPageName?: string
  changeExt?: boolean
  isCustomTemplate?: boolean
  pluginType?: string
}

export function createPage(conf: Page, handlers: Record<string, (err: Error | null, arg: CreateOptions) => any>): Promise<void>

export function createPlugin(conf: Plugin): Promise<void>

export function createProject(conf: Project, handlers: Record<string, (err: Error | null, arg: CreateOptions) => any>): Promise<void>

export const enum CSSType {
  None = 'None',
  Sass = 'Sass',
  Stylus = 'Stylus',
  Less = 'Less'
}

export const enum FrameworkType {
  React = 'React',
  Vue = 'Vue',
  Vue3 = 'Vue3'
}

export const enum NpmType {
  Yarn = 'Yarn',
  Cnpm = 'Cnpm',
  Pnpm = 'Pnpm',
  Npm = 'Npm'
}

export interface Page {
  projectDir: string
  projectName: string
  template: string
  templateRoot: string
  description?: string
  pageName: string
  date?: string
  framework: FrameworkType
  css: CSSType
  typescript?: boolean
  compiler?: CompilerType
  version?: string
  isCustomTemplate?: boolean
  customTemplatePath?: string
  basePageFiles: Array<string>
  period: PeriodType
}

export const enum PeriodType {
  CreateAPP = 'CreateAPP',
  CreatePage = 'CreatePage'
}

export interface Plugin {
  projectRoot: string
  projectName: string
  description?: string
  pluginType: string
  templateRoot: string
  version: string
  template: string
}

export interface Project {
  projectRoot: string
  projectName: string
  npm: NpmType
  description?: string
  typescript?: boolean
  template: string
  css: CSSType
  autoInstall?: boolean
  framework: FrameworkType
  templateRoot: string
  version: string
  date?: string
  compiler?: CompilerType
  period: PeriodType
}
export interface ITemplates {
  name: string
  platforms?: string | string[]
  desc?: string
}