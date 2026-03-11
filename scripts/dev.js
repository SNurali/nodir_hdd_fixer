#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const turboBin = path.join(repoRoot, 'node_modules', '.bin', 'turbo');
const apiPort = Number(process.env.APP_PORT || '3004');
const staleApiMarkers = [
  path.join(repoRoot, 'apps', 'api', 'dist', 'main'),
  path.join(repoRoot, 'apps', 'api', 'dist', 'main.js'),
  'node apps/api/dist/main',
  'node apps/api/dist/main.js',
];

function runCommand(command, args) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function getListeningPids(port) {
  try {
    const output = runCommand('lsof', ['-tiTCP:' + String(port), '-sTCP:LISTEN', '-n', '-P']);
    return output ? output.split('\n').map((value) => Number(value.trim())).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getProcessCommand(pid) {
  try {
    return runCommand('ps', ['-p', String(pid), '-o', 'args=']);
  } catch {
    return '';
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stopProcess(pid) {
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    return !isProcessAlive(pid);
  }

  await delay(1000);
  if (!isProcessAlive(pid)) {
    return true;
  }

  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    return !isProcessAlive(pid);
  }

  await delay(250);
  return !isProcessAlive(pid);
}

async function ensureApiPortAvailable() {
  const pids = getListeningPids(apiPort);
  if (pids.length === 0) {
    return;
  }

  const owners = pids.map((pid) => ({
    pid,
    command: getProcessCommand(pid),
  }));

  const staleOwners = owners.filter(({ command }) =>
    staleApiMarkers.some((marker) => command.includes(marker)),
  );

  if (staleOwners.length === owners.length) {
    for (const owner of staleOwners) {
      const stopped = await stopProcess(owner.pid);
      if (!stopped) {
        console.error(`Could not stop stale API process ${owner.pid} on port ${apiPort}.`);
        process.exit(1);
      }
      console.log(`Stopped stale API process ${owner.pid} on port ${apiPort}.`);
    }
    return;
  }

  console.error(`Port ${apiPort} is already in use.`);
  for (const owner of owners) {
    const description = owner.command || '<unknown command>';
    console.error(`- PID ${owner.pid}: ${description}`);
  }
  console.error('Stop the existing process or set APP_PORT to a different value before running dev.');
  process.exit(1);
}

async function main() {
  await ensureApiPortAvailable();

  const child = spawn(turboBin, ['run', 'dev'], {
    cwd: repoRoot,
    env: process.env,
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
