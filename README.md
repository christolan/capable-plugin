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

先启动一次 Desktop 初始化 `desktop` profile，然后完全退出应用。使用 **Desktop 自带的** `dsh`（Windows 为 `dsh.cmd`），位于应用资源目录下的 `runtime/cli/bin/`。[Desktop 内置命令运行时](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.zh.md)

在仓库根目录构建后，可用该命令安装本地目录：

```sh
dsh plugin --profile desktop add "file:$PWD/dist/deepseek"
```

通过私有渠道分发时，在发布端运行 `npm pack ./dist/deepseek`，安装端下载生成的 `.tgz` 即可：

```sh
dsh plugin --profile desktop add /path/to/capable-plugin-deepseek-0.1.0.tgz
```

安装后重新打开 Desktop 并新建会话。插件通过 `agent/created` 注入 `core.md`，并注册包内的技能。添加技能并重新构建后，可在技能列表中查找对应技能。更新时重新安装新版产物并重启 Desktop。[技能发现](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/README.md)
