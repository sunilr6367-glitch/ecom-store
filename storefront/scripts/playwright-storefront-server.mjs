import { spawn } from 'node:child_process';

const cwd = process.cwd();
const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const nextCommand = process.execPath;
const nextArgs = ['node_modules/next/dist/bin/next', 'start', '-p', '3000', '-H', '0.0.0.0'];

const sharedEnv = {
  ...process.env,
  DESIGN_SYSTEM_LAB: 'true',
  NEXT_PUBLIC_DESIGN_SYSTEM_LAB: 'true',
  NEXT_PUBLIC_E2E: 'true',
  INTERNAL_API_URL: process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000',
};

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(npmCommand, ['run', 'build'], {
      cwd,
      env: sharedEnv,
      stdio: 'inherit',
      shell: isWindows,
    });

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Build failed with code ${code ?? 'null'} signal ${signal ?? 'none'}`));
    });

    child.on('error', reject);
  });
}

let nextChild = null;
let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (!nextChild || nextChild.exitCode !== null) {
    process.exit(exitCode);
    return;
  }

  const forceKillTimer = setTimeout(() => {
    if (nextChild && nextChild.exitCode === null) {
      nextChild.kill('SIGKILL');
    }
  }, 5000);

  nextChild.once('exit', (code) => {
    clearTimeout(forceKillTimer);
    process.exit(code ?? exitCode);
  });

  nextChild.kill('SIGTERM');
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(0));
}

try {
  await runBuild();

  nextChild = spawn(nextCommand, nextArgs, {
    cwd,
    env: sharedEnv,
    stdio: 'inherit',
    shell: false,
  });

  nextChild.on('exit', (code) => {
    if (!shuttingDown) {
      process.exit(code ?? 0);
    }
  });

  nextChild.on('error', (error) => {
    console.error(error);
    shutdown(1);
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}
