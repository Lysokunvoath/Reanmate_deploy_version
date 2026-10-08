import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';

type ChangedFile = {
  path: string;
  status: string;
};

type GitMetadata = {
  hash: string | null;
  shortHash: string | null;
  branch: string | null;
  subject: string | null;
  dirty: boolean | null;
  changedFiles: ChangedFile[];
};

export type VersionInfo = {
  service: string;
  version: string;
  environment: string;
  commit: {
    hash: string | null;
    shortHash: string | null;
    branch: string | null;
    subject: string | null;
  };
  workingTree: {
    dirty: boolean | null;
    changedFiles: ChangedFile[];
  };
  generatedAt: string;
};

@Injectable()
export class VersionService {
  getVersion(): VersionInfo {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    ) as { name?: string; version?: string };
    const git = this.readGitState();
    const metadata = this.readBuildMetadata();

    return {
      service: packageJson.name ?? 'reanmate-backend',
      version: packageJson.version ?? 'unknown',
      environment: process.env.NODE_ENV ?? 'development',
      commit: {
        hash: git.hash ?? metadata.hash ?? process.env.GIT_COMMIT ?? null,
        shortHash: git.shortHash ?? metadata.shortHash ?? process.env.GIT_COMMIT_SHORT ?? null,
        branch: git.branch ?? metadata.branch ?? process.env.GIT_BRANCH ?? null,
        subject: git.subject ?? metadata.subject ?? process.env.GIT_COMMIT_SUBJECT ?? null,
      },
      workingTree: {
        dirty: git.dirty ?? metadata.dirty,
        changedFiles: git.dirty === null ? metadata.changedFiles : git.changedFiles,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private readBuildMetadata(): GitMetadata {
    try {
      return JSON.parse(
        readFileSync(join(process.cwd(), 'dist', 'version-metadata.json'), 'utf8'),
      ) as GitMetadata;
    } catch {
      return {
        hash: null,
        shortHash: null,
        branch: null,
        subject: null,
        dirty: null,
        changedFiles: [],
      };
    }
  }

  private readGitState(): {
    hash: string | null;
    shortHash: string | null;
    branch: string | null;
    subject: string | null;
    dirty: boolean | null;
    changedFiles: ChangedFile[];
  } {
    try {
      const runGit = (...args: string[]) =>
        execFileSync('git', args, {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
      const status = runGit('status', '--porcelain=v1');

      return {
        hash: runGit('rev-parse', 'HEAD') || null,
        shortHash: runGit('rev-parse', '--short', 'HEAD') || null,
        branch: runGit('branch', '--show-current') || null,
        subject: runGit('log', '-1', '--pretty=%s') || null,
        dirty: status.length > 0,
        changedFiles: status
          ? status.split('\n').map((line) => ({ status: line.slice(0, 2).trim() || '??', path: line.slice(3) }))
          : [],
      };
    } catch {
      return {
        hash: null,
        shortHash: null,
        branch: null,
        subject: null,
        dirty: null,
        changedFiles: [],
      };
    }
  }
}