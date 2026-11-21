import { cp, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const { name, version, description } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const src = join(root, 'src');
const core = await readFile(join(src, 'core.md'));
const skills = new Map();

if (!core.toString('utf8').trim()) throw new Error('src/core.md 不能为空');

for (const origin of ['personal', 'external']) {
  const directory = join(src, 'skills', origin);
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'README.md') continue;
    const path = join(directory, entry.name);
    if (!entry.isDirectory() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name)) {
      throw new Error(`无效的技能目录: ${path}`);
    }
    if (skills.has(entry.name)) throw new Error(`重复的技能目录名: ${entry.name}`);
    const skill = await readFile(join(path, 'SKILL.md'), 'utf8');
    if (!/^---\r?\n[\s\S]+?\r?\n---(?:\r?\n|$)/.test(skill)) {
      throw new Error(`缺少 YAML frontmatter: ${path}/SKILL.md`);
    }
    skills.set(entry.name, path);
  }
}

const stage = join(root, '.capable-build-stage');
await mkdir(stage);
const output = join(stage, 'dist');
const codex = join(output, 'codex');
const deepseek = join(output, 'deepseek');
const deepseekName = `${name}-deepseek`;

async function writeJson(path, value) {
  await writeFile(path, JSON.stringify(value, null, 2) + '\n');
}

let keepStage = false;
try {
  for (const target of [codex, deepseek]) {
    await mkdir(join(target, 'skills'), { recursive: true });
    await writeFile(join(target, 'core.md'), core);
    for (const [skill, path] of skills) {
      await cp(path, join(target, 'skills', skill), {
        recursive: true,
        filter: (entry) => !entry.endsWith('/.DS_Store'),
      });
    }
  }

  await mkdir(join(codex, '.codex-plugin'));
  await mkdir(join(codex, 'hooks'));
  await mkdir(join(output, '.agents', 'plugins'), { recursive: true });
  await writeJson(join(codex, '.codex-plugin', 'plugin.json'), {
    name, version, description, skills: './skills/', hooks: './hooks/hooks.json',
  });
  await writeJson(join(codex, 'hooks', 'hooks.json'), {
    hooks: {
      SessionStart: [{
        hooks: [{
          type: 'command',
          command: 'node "${PLUGIN_ROOT}/hooks/session-start.mjs"',
          commandWindows: 'node "$env:PLUGIN_ROOT/hooks/session-start.mjs"',
          statusMessage: '加载个人开发规范',
          additionalContextLimit: 0,
        }],
      }],
    },
  });
  await cp(join(root, 'adapters/codex/session-start.mjs'), join(codex, 'hooks/session-start.mjs'));
  await writeJson(join(output, '.agents/plugins/marketplace.json'), {
    name: 'capable-local',
    interface: { displayName: 'Capable Local' },
    plugins: [{
      name,
      source: { source: 'local', path: './codex' },
      policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
      category: 'Productivity',
    }],
  });

  await cp(join(root, 'adapters/deepseek/index.mjs'), join(deepseek, 'index.mjs'));
  await writeJson(join(deepseek, 'package.json'), {
    name: deepseekName, version,
    description: `DeepSeek Harness Desktop 插件：${description}`,
    type: 'module', exports: './index.mjs',
    files: ['index.mjs', 'core.md', 'skills', 'cordis.patch.yml'],
    keywords: ['dsh-plugin'],
    peerDependencies: {
      '@deepseek-ai/dsh-llm': '*',
      '@deepseek-ai/dsh-skill-filesystem': '*',
    },
    dsh: { bundle: { patch: './cordis.patch.yml' } },
  });
  await writeFile(join(deepseek, 'cordis.patch.yml'), `- insert:\n    - id: ${deepseekName}\n      name: ${deepseekName}\n`);

  const dist = join(root, 'dist');
  const previous = join(stage, 'previous');
  let hadPrevious = false;
  try {
    await rename(dist, previous);
    hadPrevious = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  try {
    await rename(output, dist);
  } catch (error) {
    if (hadPrevious) {
      keepStage = true;
      await rename(previous, dist);
      keepStage = false;
    }
    throw error;
  }
  console.log(`已生成 dist/codex 和 dist/deepseek（各 ${skills.size} 个技能）`);
} finally {
  if (!keepStage) await rm(stage, { recursive: true, force: true });
}
