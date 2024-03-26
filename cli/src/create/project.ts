import * as inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import * as ora from 'ora';
import * as path from 'path';
import * as request from 'request';
import fetchTemplate from './fetchTemplate';
import { NpmType, CSSType, FrameworkType, CompilerType, ITemplates } from "../types";
import {
  DEFAULT_TEMPLATE_SRC_GITEE, DEFAULT_TEMPLATE_SRC,
  NONE_AVAILABLE_TEMPLATE
} from '../config/index';
import { checkNodeVersion, clearConsole, getRootPath } from "../utils";

export interface IProjectConf {
  projectName: string
  projectDir: string
  npm: NpmType
  templateSource: string
  clone?: boolean
  template: string
  description?: string
  typescript?: boolean
  css: CSSType
  date?: string
  src?: string
  sourceRoot?: string
  env?: string
  autoInstall?: boolean
  framework: FrameworkType
  compiler?: CompilerType
}

type CustomPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type IProjectConfOptions = CustomPartial<IProjectConf,  'projectName' | 'projectDir' | 'template' | 'css' | 'npm' | 'framework' | 'templateSource'>


interface AskMethods {
  (conf: IProjectConfOptions, prompts: Record<string, unknown>[], choices?: ITemplates[]): void
}

class Project {
  private conf: IProjectConfOptions = {};
  private _rootPath: string = '';

  constructor(options: IProjectConfOptions) {
    const unSupportedVer = checkNodeVersion();
    if (unSupportedVer) {
      throw new Error('Node.js 版本过低，推荐升级 Node.js 至 v8.0.0+')
    }
    this._rootPath = path.resolve(path.join(getRootPath()));
    this.conf = Object.assign(
      {
        projectName: '',
        projectDir: '',
        template: '',
        description: '',
        npm: ''
      },
      options
    )
  }
  init() {
    clearConsole()
    console.log(chalk.green('即将创建一个新项目!'))
    console.log()
  }
  async create() {
    try {
      const answers = await this.ask()
      console.log(answers);
      const date = new Date()
      this.conf = Object.assign(this.conf, answers)
      this.conf.date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
      console.log(this.conf)
      // await createProject(this.conf)
    } catch (error) {
      console.log(chalk.red('创建项目失败: ', error))
    }
  }

  async ask() {
    let prompts: Record<string, unknown>[] = []
    const conf = this.conf
    this.askProjectName(conf, prompts)
    this.askDescription(conf, prompts)
    this.askFramework(conf, prompts)
    this.askTypescript(conf, prompts)
    this.askCSS(conf, prompts)
    this.askCompiler(conf, prompts)
    this.askNpm(conf, prompts)
    await this.askTemplateSource(conf, prompts)

    const answers = await inquirer.prompt(prompts);

    prompts = [];
    const templates = await this.fetchTemplates(answers)
    await this.askTemplate(conf, prompts, templates)
    const templateChoiceAnswer = await inquirer.prompt<IProjectConf>(prompts)

    return {
      ...answers,
      ...templateChoiceAnswer
    }

  }
  // 项目名称
  askProjectName: AskMethods = function (conf, prompts) {
    if ((typeof conf.projectName) !== 'string') {
      prompts.push({
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称！',
        validate (input: string) {
          if (!input) {
            return '项目名不能为空！'
          }
          // 查找文件是否存在
          if (fs.existsSync(input)) {
            return '当前目录已经存在同名项目，请换一个项目名！'
          }
          return true
        }
      })
    } else if (fs.existsSync(conf.projectName!)) {
      prompts.push({
        type: 'input',
        name: 'projectName',
        message: '当前目录已经存在同名项目，请换一个项目名！',
        validate (input: string) {
          if (!input) {
            return '项目名不能为空！'
          }
          if (fs.existsSync(input)) {
            return '项目名依然重复！'
          }
          return true
        }
      })
    }
  }
  // 项目描述
  askDescription: AskMethods = function (conf, prompts) {
    if (typeof conf.description !== 'string') {
      prompts.push({
        type: 'input',
        name: 'description',
        message: '请输入项目介绍'
      })
    }
  }
  // 是否使用ts
  askTypescript: AskMethods = function (conf, prompts) {
    if (typeof conf.typescript !== 'boolean') {
      prompts.push({
        type: 'confirm',
        name: 'typescript',
        message: '是否需要使用 TypeScript ？'
      })
    }
  }
  // css
  askCSS: AskMethods = function (conf, prompts) {
    if (typeof conf.css !== 'string') {
      prompts.push({
        type: 'list',
        name: 'css',
        message: '请选择 CSS 预处理器（Sass/Less/Stylus）',
        choices: [
          {
            name: 'Sass',
            value: CSSType.Sass
          },
          {
            name: 'Less',
            value: CSSType.Less
          },
          {
            name: 'Stylus',
            value: CSSType.Stylus
          },
          {
            name: '无',
            value: CSSType.None
          }
        ]
      })
    }
  }
  // 打包工具
  askCompiler: AskMethods = function (conf, prompts) {
    if (typeof conf.compiler !== 'string') {
      prompts.push({
        type: 'list',
        name: 'compiler',
        message: '请选择编译工具',
        choices: [
          {
            name: 'Webpack5',
            value: CompilerType.Webpack5
          },
          {
            name: 'Webpack4',
            value: CompilerType.Webpack4
          }
        ]
      })
    }
  }
  // 框架
  askFramework: AskMethods = function (conf, prompts) {
    if (typeof conf.framework !== 'string') {
      prompts.push({
        type: 'list',
        name: 'framework',
        message: '请选择框架',
        choices: [
          {
            name: 'React',
            value: FrameworkType.React
          },
          {
            name: 'Vue',
            value: FrameworkType.Vue
          },
          {
            name: 'Vue3',
            value: FrameworkType.Vue3
          }
        ]
      })
    }
  }
  // 安装依赖的方式
  askNpm: AskMethods = function (conf, prompts) {
    if ((typeof conf.npm as string | undefined) !== 'string') {
      prompts.push({
        type: 'list',
        name: 'npm',
        message: '请选择包管理工具',
        choices: [
          {
            name: 'yarn',
            value: NpmType.Yarn
          },
          {
            name: 'pnpm',
            value: NpmType.Pnpm
          },
          {
            name: 'npm',
            value: NpmType.Npm
          },
          {
            name: 'cnpm',
            value: NpmType.Cnpm
          }
        ]
      })
    }
  }
  askTemplateSource: AskMethods = async function (conf, prompts) {
    if (conf.template === 'default' || conf.templateSource) return

    const choices = [
      {
        name: 'Gitee（最快）',
        value: DEFAULT_TEMPLATE_SRC_GITEE
      },
      {
        name: 'Github（最新）',
        value: DEFAULT_TEMPLATE_SRC
      },
      {
        name: 'CLI 内置默认模板',
        value: 'default-template'
      },
      {
        name: '自定义',
        value: 'self-input'
      },
      {
        name: '社区优质模板源',
        value: 'open-source'
      }
    ]

    prompts.push({
      type: 'list',
      name: 'templateSource',
      message: '请选择模板源',
      choices
    }, {
      type: 'input',
      name: 'templateSource',
      message: '请输入模板源！',
      askAnswered: true,
      when (answers: any) {
        return answers.templateSource === 'self-input'
      }
    }, {
      type: 'list',
      name: 'templateSource',
      message: '请选择社区模板源',
      async choices (answers: any) {
        return await getOpenSourceTemplates(answers.framework)
      },
      askAnswered: true,
      when (answers: any) {
        return answers.templateSource === 'open-source'
      }
    })
  }
  askTemplate: AskMethods = function (conf, prompts, list = []) {
    const choices = [
      {
        name: '默认模板',
        value: 'default'
      },
      ...list.map(item => ({
        name: item.desc ? `${item.name}（${item.desc}）` : item.name,
        value: item.name
      }))
    ]

    if ((typeof conf.template as 'string' | undefined) !== 'string') {
      prompts.push({
        type: 'list',
        name: 'template',
        message: '请选择模板',
        choices
      })
    }
  }
  async fetchTemplates (answers: IProjectConf): Promise<ITemplates[]> {
    const { templateSource, framework } = answers
    this.conf.templateSource = this.conf.templateSource || templateSource

    // 使用默认模版
    if (answers.templateSource === 'default-template') {
      this.conf.template = 'default'
      answers.templateSource = DEFAULT_TEMPLATE_SRC_GITEE
    }
    if (this.conf.template === 'default' || answers.templateSource === NONE_AVAILABLE_TEMPLATE) return Promise.resolve([])

    // 从模板源下载模板
    const isClone = /gitee/.test(this.conf.templateSource) || this.conf.clone
    const templateChoices = await fetchTemplate(this.conf.templateSource, this.templatePath(''), isClone)

    // 根据用户选择的框架筛选模板
    return templateChoices.filter(templateChoice => {
        const { platforms } = templateChoice
        if (typeof platforms === 'string' && platforms) {
          return framework === templateChoice.platforms
        } else if (Array.isArray(platforms)) {
          return templateChoice.platforms?.includes(framework)
        } else {
          return true
        }
      })
  }
  templatePath (...args: string[]): string {
    let filepath = path.join.apply(path, args)
    if (!path.isAbsolute(filepath)) {
      filepath = path.join(this._rootPath, 'templates', filepath)
    }
    return filepath
  }
  /*write (cb?: () => void) {
    this.conf.src = SOURCE_DIR
    const { projectName, projectDir, template, autoInstall = true, framework, npm } = this.conf as IProjectConf
    // 引入模板编写者的自定义逻辑
    const templatePath = this.templatePath(template)
    const handlerPath = path.join(templatePath, TEMPLATE_CREATOR)
    const handler = fs.existsSync(handlerPath) ? require(handlerPath).handler : {}
    createProject({
      projectRoot: projectDir,
      projectName,
      template,
      npm,
      framework,
      css: this.conf.css || CSSType.None,
      autoInstall: autoInstall,
      templateRoot: getRootPath(),
      version: getPkgVersion(),
      typescript: this.conf.typescript,
      date: this.conf.date,
      description: this.conf.description,
      compiler: this.conf.compiler,
      period: PeriodType.CreateAPP,
    }, handler).then(() => {
      cb && cb()
    })
  }*/
}

function getOpenSourceTemplates (platform) {
  return new Promise((resolve, reject) => {
    const spinner = ora({ text: '正在拉取开源模板列表...', discardStdin: false }).start()
    request.get('https://gitee.com/NervJS/awesome-taro/raw/next/index.json', (error, _response, body) => {
      if (error) {
        spinner.fail(chalk.red('拉取开源模板列表失败！'))
        return reject(new Error())
      }

      spinner.succeed(`${chalk.grey('拉取开源模板列表成功！')}`)

      const collection = JSON.parse(body)

      switch (platform) {
        case 'react':
          return resolve(collection.react)
        case 'vue':
          return resolve(collection.vue)
        default:
          return resolve(['无可用模板'])
      }
    })
  })
}
export default Project;