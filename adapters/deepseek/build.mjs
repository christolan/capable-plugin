import { cp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderJsonTemplate } from '../render-json-template.mjs';

export async function buildDeepSeek(output, { name, version, description }) {
  const target = join(output, 'deepseek');
  await cp(new URL('./template/', import.meta.url), target, {
    recursive: true,
    filter: (entry) => !entry.endsWith('/.DS_Store'),
  });
  const pluginName = `${name}-deepseek`;
  await renderJsonTemplate(join(target, 'package.json'), {
    name: pluginName,
    version,
    description: `DeepSeek Harness Desktop 插件：${description}`,
  });
  const patchPath = join(target, 'cordis.patch.yml');
  const patch = await readFile(patchPath, 'utf8');
  await writeFile(patchPath, patch.replaceAll('{{name}}', () => pluginName));
  return target;
}
