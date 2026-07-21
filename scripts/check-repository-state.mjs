import { execFileSync } from 'node:child_process';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function lines(value) {
  return value ? value.split(/\r?\n/).filter(Boolean) : [];
}

const ci = process.env.CI === 'true';
const branch = git('branch', '--show-current') || '(detached)';
const head = git('rev-parse', '--short=12', 'HEAD');
const status = lines(git('status', '--porcelain'));
const trackedChanges = status.filter((line) => !line.startsWith('??'));
const untrackedChanges = status.filter((line) => line.startsWith('??'));
const worktrees = lines(git('worktree', 'list', '--porcelain')).filter((line) =>
  line.startsWith('worktree ')
);

let basedOnMain = true;
try {
  git('merge-base', '--is-ancestor', 'origin/main', 'HEAD');
} catch {
  basedOnMain = false;
}

const report = {
  branch,
  head,
  basedOnOriginMain: basedOnMain,
  trackedChanges: trackedChanges.length,
  untrackedChanges: untrackedChanges.length,
  worktrees: worktrees.length,
};

console.log(JSON.stringify(report, null, 2));

const failures = [];
if (!basedOnMain) failures.push('HEAD is not based on origin/main.');
if (ci && trackedChanges.length > 0) {
  failures.push('CI checkout contains unexpected tracked changes.');
}

if (!ci && worktrees.length > 3) {
  console.warn(`Warning: ${worktrees.length} worktrees exist. Verify the active worktree before publishing.`);
}
if (!ci && untrackedChanges.length > 0) {
  console.warn(`Warning: ${untrackedChanges.length} untracked paths exist. Review them before staging.`);
}

if (failures.length) {
  for (const failure of failures) console.error(`Repository guard failed: ${failure}`);
  process.exit(1);
}

console.log('Repository guard passed.');
