import { cp, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function renderJsonTemplate(path, values) {
  const template = await readFile(path, 'utf8');
  const content = template.replace(/"\{\{(\w+)\}\}"/g, (_, key) => JSON.stringify(values[key]));
  await writeFile(path, content);
}

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

let keepStage = false;
try {
  const templates = join(src, 'templates');
  const copyOptions = {
    recursive: true,
    filter: (entry) => !entry.endsWith('/.DS_Store'),
  };

  const codex = join(output, 'codex');
  await cp(join(templates, 'codex'), output, copyOptions);
  await renderJsonTemplate(join(codex, '.codex-plugin', 'plugin.json'), { name, version, description });
  await renderJsonTemplate(join(output, '.agents', 'plugins', 'marketplace.json'), { name });

  const deepseek = join(output, 'deepseek');
  await cp(join(templates, 'deepseek'), deepseek, copyOptions);
  const deepseekName = `${name}-deepseek`;
  await renderJsonTemplate(join(deepseek, 'package.json'), {
    name: deepseekName,
    version,
    description: `DeepSeek Harness Desktop 插件：${description}`,
  });
  const patchPath = join(deepseek, 'cordis.patch.yml');
  const patch = await readFile(patchPath, 'utf8');
  await writeFile(patchPath, patch.replaceAll('{{name}}', () => deepseekName));

  for (const target of [codex, deepseek]) {
    await mkdir(join(target, 'skills'));
    await writeFile(join(target, 'core.md'), core);
    for (const [skill, path] of skills) {
      await cp(path, join(target, 'skills', skill), copyOptions);
    }
  }

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
