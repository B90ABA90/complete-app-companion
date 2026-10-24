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

describe('lives space removed', () => {
  it('no source file imports the removed live space', () => {
    expect(importersOf('lives')).toEqual([]);
  });

  it('keeps the shared base free of video code', () => {
    expect(importersOf('videos').filter(f => f.startsWith('src/shared/'))).toEqual([]);
  });
});
