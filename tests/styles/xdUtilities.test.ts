// The `xd-*` classes are a hand-written list, not a generated one.
//
// `public/styles/xd-utilities.css` spells out every class by hand — `.w-xd-390`,
// `.h-xd-60`, and so on. Nothing generates them from the numbers a component
// asks for. So writing `h-xd-138` in a component is not an error anywhere: the
// class simply does not exist, the browser ignores it, and the element keeps
// whatever height it had. The design is wrong on screen and no tool says a word.
//
// This test closes that hole for the auth flow. It reads every `xd-*` class the
// login screens use, reads every class the stylesheet defines, and fails naming
// the ones that are used but never defined.
import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/** Folders whose `xd-*` classes must all exist. */
const SOURCE_DIRS = ['NewLoginDesign', 'components/Login/Enhanced'];

const STYLESHEET = 'public/styles/xd-utilities.css';

/**
 * A class name that ends in `-xd-<number>`, with an optional leading minus for
 * the negative variants. `--xd-unit` and `xd-dashed-border` do not match,
 * because both lack the trailing number.
 */
const XD_CLASS = /(?<![\w-])(-?[a-z]+(?:-[a-z]+)*-xd-\d+(?:\.\d+)?)/g;

/** Every selector the stylesheet defines, with CSS escapes (`\.`) removed. */
const CSS_SELECTOR = /\.([-a-zA-Z0-9_\\.]+)\s*(?=[,{])/g;

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...sourceFiles(full));
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) found.push(full);
  }
  return found;
}

describe('every xd-* class the auth screens use is defined', () => {
  it('the stylesheet defines every xd-* class NewLoginDesign and Login/Enhanced ask for', () => {
    const usedBy = new Map<string, Set<string>>();
    for (const dir of SOURCE_DIRS) {
      for (const file of sourceFiles(dir)) {
        const source = fs.readFileSync(file, 'utf8');
        for (const match of source.matchAll(XD_CLASS)) {
          const name = match[1];
          if (!usedBy.has(name)) usedBy.set(name, new Set());
          usedBy.get(name)!.add(file.split(path.sep).join('/'));
        }
      }
    }

    const css = fs.readFileSync(STYLESHEET, 'utf8');
    const defined = new Set(
      [...css.matchAll(CSS_SELECTOR)].map((m) => m[1].replace(/\\/g, '')),
    );

    expect(
      usedBy.size,
      `no xd-* class was found in ${SOURCE_DIRS.join(' or ')} — the scan is looking in the wrong place`,
    ).toBeGreaterThan(0);
    expect(
      defined.size,
      `${STYLESHEET} defines no classes — the stylesheet scan is looking in the wrong place`,
    ).toBeGreaterThan(0);

    const missing = [...usedBy.keys()].filter((name) => !defined.has(name)).sort();
    const report = missing
      .map((name) => `${name} (used in ${[...usedBy.get(name)!].join(', ')})`)
      .join('; ');

    expect(
      missing,
      `${missing.length} xd-* class(es) are used but not defined in ${STYLESHEET}, so they do nothing at all: ${report}`,
    ).toEqual([]);
  });
});
