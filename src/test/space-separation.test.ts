import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(ROOT, dir))) {
    const full = join(ROOT, dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(relative(ROOT, full)));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(relative(ROOT, full).split(sep).join('/'));
  }
  return out;
}

function importersOf(space: string): string[] {
  return sourceFiles('src')
    .filter(file => readFileSync(join(ROOT, file), 'utf8').includes(`@/${space}/`))
    .sort();
}

describe('video and live spaces stay separated', () => {
  it('keeps the video space free of live code', () => {
    expect(importersOf('lives').filter(f => f.startsWith('src/videos/'))).toEqual([]);
  });

  it('keeps the live space free of video code', () => {
    expect(importersOf('videos').filter(f => f.startsWith('src/lives/'))).toEqual([]);
  });

  it('keeps the shared base free of both spaces', () => {
    expect(importersOf('videos').filter(f => f.startsWith('src/shared/'))).toEqual([]);
    expect(importersOf('lives').filter(f => f.startsWith('src/shared/'))).toEqual([]);
  });

  it('lets only the live pages reach the live space', () => {
    const users = importersOf('lives').filter(f => !f.startsWith('src/test/') && !f.startsWith('src/lives/'));
    expect(users).toEqual(['src/routes/live.$id.tsx', 'src/routes/lives.tsx']);
  });
});
