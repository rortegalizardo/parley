import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);

async function inspectProcess(pid) {
  const { stdout } = await execFileAsync('/bin/ps', ['-p', String(pid), '-o', 'ppid=', '-o', 'comm=', '-o', 'args='], { timeout: 1500, maxBuffer: 128 * 1024 });
  const match = stdout.trim().match(/^(\d+)\s+(\S+)\s+([\s\S]+)$/);
  if (!match) throw new Error('Unavailable process ancestry');
  return { parentPid: Number(match[1]), executable: match[2], command: match[3] };
}

// Inspect only local ancestor metadata. No credentials, libraries or network are
// accessed. Old Parley servers do not set PARLEY_ROOM_AGENT, so the inherited
// environment marker alone cannot safely support global MCP registrations.
export async function bridgeContextAllowed({ env = process.env, parentPid = process.ppid, platform = process.platform, inspect = inspectProcess } = {}) {
  if (env.PARLEY_ROOM_AGENT === '1') return false;
  if (!['darwin', 'linux'].includes(platform)) return false;
  const visited = new Set();
  const deadline = Date.now() + 5000;
  try {
    let pid = parentPid;
    for (let depth = 0; depth < 64 && Date.now() < deadline; depth++) {
      if (!Number.isSafeInteger(pid) || pid < 1 || visited.has(pid)) return false;
      // PID 1 is the OS supervisor, beyond the user process ancestry.
      if (pid === 1) return true;
      visited.add(pid);
      const ancestor = await inspect(pid);
      if (typeof ancestor.executable !== 'string' || typeof ancestor.command !== 'string') return false;
      const nodeProcess = /^node(?:js)?$/.test(path.basename(ancestor.executable)) || /^(?:\S*\/)?node(?:js)?\s/.test(ancestor.command);
      if (nodeProcess && /(?:^|[\/\s])(?:parley|roundtable)(?:-mine)?(?:\.mjs)?(?:\s|$)/.test(ancestor.command)) return false;
      pid = ancestor.parentPid;
    }
  } catch { /* Unknown context is deliberately disabled. */ }
  return false;
}
