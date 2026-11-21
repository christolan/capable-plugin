import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import * as filesystemSkills from '@deepseek-ai/dsh-skill-filesystem';

export const name = 'capable-plugin-deepseek';
export const inject = ['agents', 'skills'];

export function apply(ctx) {
  const text = readFileSync(new URL('./core.md', import.meta.url), 'utf8');

  ctx.on('agent/created', ({ agent }) => {
    agent.inject(createUserMessage({
      content: [{ type: 'text', text }],
      source: { kind: 'plugin', plugin: name },
    }));
  });

  ctx.plugin(filesystemSkills, {
    providerName: name,
    includeDefaultRoots: false,
    bundledSkillDir: fileURLToPath(new URL('./skills/', import.meta.url)),
  });
}
