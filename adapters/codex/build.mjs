import { cp } from 'node:fs/promises';
import { join } from 'node:path';
import { renderJsonTemplate } from '../render-json-template.mjs';

export async function buildCodex(output, { name, version, description }) {
  await cp(new URL('./template/', import.meta.url), output, {
    recursive: true,
    filter: (entry) => !entry.endsWith('/.DS_Store'),
  });
  const target = join(output, 'codex');
  await renderJsonTemplate(join(target, '.codex-plugin', 'plugin.json'), { name, version, description });
  await renderJsonTemplate(join(output, '.agents', 'plugins', 'marketplace.json'), { name });
  return target;
}
