import { readFile, writeFile } from 'node:fs/promises';

export async function renderJsonTemplate(path, values) {
  const template = await readFile(path, 'utf8');
  const content = template.replace(/"\{\{(\w+)\}\}"/g, (_, key) => JSON.stringify(values[key]));
  await writeFile(path, content);
}
