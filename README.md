# Capable Plugin

一个个人开发经验库。维护一份规范和技能，用同一条构建命令生成 Codex 和 DeepSeek Harness Desktop 插件。

## 维护内容

| 路径 | 用途 |
| --- | --- |
| [src/core.md](src/core.md) | 会话启动时由 hook 加载的通用开发规范。 |
| [src/skills/personal/](src/skills/personal/) | 自建技能。 |
| [src/skills/external/](src/skills/external/) | 引入的外部技能。随技能保存来源、固定版本和许可证。 |
| [adapters/](adapters/) | 两个 harness 的运行时适配代码。 |
| [dist/](dist/) | 可安装的本地构建产物，已加入 Git 忽略规则。 |

每个技能放在单独的 `<skill-name>/` 目录，包含 `SKILL.md`，YAML frontmatter 至少填写 `name` 和 `description`。目录名使用小写 kebab-case，并与 `name` 一致。自建与外部技能共用安装后的命名空间，目录名需唯一。脚本、示例和参考资料放在所属技能目录中。

## 构建

需要 Node.js 22 或更新版本。构建只用 Node.js 标准库。

```sh
npm run build
```

构建将 `core.md` 和完整技能目录复制到两个插件。修改后重新构建，并提交源文件。将需要按任务加载的细节写进技能，保持每次注入的核心规范简短。

## 安装到 Codex

在仓库根目录执行。运行 Codex 的环境需要能从 PATH 找到 `node`。

```sh
codex plugin marketplace add "$PWD/dist"
codex plugin add capable-plugin@capable-local
```

如使用桌面端，也可从插件目录的 **Capable Local** 来源安装。启动 Codex 后用 `/hooks` 审阅并信任插件的 `SessionStart`，再开启新会话。该 hook 从安装目录读取 `core.md` 并返回完整的 `additionalContext`。添加技能并重新构建后，可在技能列表中查找对应技能。重新构建后，通过插件管理刷新安装的副本。[Codex 插件打包](https://developers.openai.com/plugins/build/plugins) · [Codex Hooks](https://developers.openai.com/docs/hooks)

## 安装到 DeepSeek Harness Desktop

可安装的产物目录是 **`dist/deepseek/`**。如果通过私有渠道分发，将这个目录整体打包，安装端下载并解压即可。

1. 在 DeepSeek Harness Desktop 打开 **插件（Plugins）→ 添加插件（Add plugin）**。
2. 输入产物目录的**绝对路径**，指向直接包含 `package.json` 和 `cordis.patch.yml` 的那一层。例如 macOS 上的 `/Users/yourname/Downloads/capable-plugin/dist/deepseek`，或 Windows 上的 `C:\Users\yourname\Downloads\capable-plugin\dist\deepseek`。
3. 安装完成后，按界面提示重启 Desktop，再打开新会话。

[Desktop 插件管理](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.md) · [添加插件支持绝对路径](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-plugin-manager/README.md)
