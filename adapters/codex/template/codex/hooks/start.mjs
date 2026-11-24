import { readFileSync } from 'node:fs';

const { hook_event_name: hookEventName } = JSON.parse(readFileSync(0, 'utf8'));
const additionalContext = readFileSync(new URL('../core.md', import.meta.url), 'utf8');
process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName, additionalContext },
}));
