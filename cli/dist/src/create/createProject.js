"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
function createProject(options) {
    return new Promise((resolve, reject) => {
        const { framework = 'Vue', css, typescript, } = options;
        let tempFileName = `${framework.toLowerCase()}_template`;
        switch (framework) {
            case "Vue" /* FrameworkType.Vue */:
                tempFileName += '_2';
                break;
            case "Vue3" /* FrameworkType.Vue3 */:
                tempFileName += '_3';
                break;
        }
        if (typescript) {
            tempFileName += '_ts';
        }
        const tmpSource = path.join(options.templatePath, tempFileName);
        const jsonUrl = path.join(tmpSource, 'package.json');
        const packageData = fs.readJsonSync(jsonUrl);
        packageData.name = options.projectName;
        packageData.name = options.description;
        console.log(packageData);
        if (css !== "None" /* CSSType.None */) {
            if (css === "Less" /* CSSType.Less */) {
                packageData.devDependencies['less'] = '^4.2.0';
                packageData.devDependencies['less-loader'] = '^12.2.0';
            }
            else if (css === "Sass" /* CSSType.Sass */) {
                packageData.devDependencies['sass'] = '^1.72.0';
                packageData.devDependencies['sass-loader'] = '^14.1.1';
            }
            fs.writeJsonSync(jsonUrl, packageData, { spaces: 2 });
        }
        fs.copyAsync(tmpSource, path.join(options.projectRoot, options.projectName || tempFileName));
        resolve('success');
    });
}
exports.default = createProject;
