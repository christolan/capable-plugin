import { readFileSync } from 'node:fs';

const additionalContext = readFileSync(new URL('../core.md', import.meta.url), 'utf8');
process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext },
}));
