import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function runGit(...args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function readGitMetadata() {
  try {
    const status = runGit('status', '--porcelain=v1');
    return {
      hash: runGit('rev-parse', 'HEAD') || null,
      shortHash: runGit('rev-parse', '--short', 'HEAD') || null,
      branch: runGit('branch', '--show-current') || null,
      subject: runGit('log', '-1', '--pretty=%s') || null,
      dirty: status.length > 0,
      changedFiles: status
        ? status.split('\n').map((line) => ({
            status: line.slice(0, 2).trim() || '??',
            path: line.slice(3),
          }))
        : [],
    };
  } catch {
    return {
      hash: process.env.GIT_COMMIT ?? null,
      shortHash: process.env.GIT_COMMIT_SHORT ?? null,
      branch: process.env.GIT_BRANCH ?? null,
      subject: process.env.GIT_COMMIT_SUBJECT ?? null,
      dirty: null,
      changedFiles: [],
    };
  }
}

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(
  join(root, 'dist', 'version-metadata.json'),
  `${JSON.stringify({ ...readGitMetadata(), generatedAt: new Date().toISOString() }, null, 2)}\n`,
);