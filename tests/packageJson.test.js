/**
 * Test suite: package.json integrity checks
 * Framework: Node's built-in test runner (node:test) with node:assert
 * Rationale: No Jest/Vitest found in devDependencies; conform to zero-dep testing using Node >=18.
 *
 * Scope: Focus on fields touched/visible in the PR diff:
 *   - name, version, description, main
 *   - scripts (dev, start, db:push, db:migrate, build, lint, format)
 *   - repository, keywords, author, license, bugs, homepage
 *   - devDependencies and dependencies keys and some critical versions/values
 *   - signale configuration block integrity
 *
 * Behavior: Validate presence, types, and selected exact values; allow semver ranges where applicable.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

let pkg;
let pkgPath;

beforeEach(() => {
  pkgPath = path.join(process.cwd(), 'package.json');
  const raw = fs.readFileSync(pkgPath, 'utf8');
  pkg = JSON.parse(raw);
});

describe('package.json: top-level metadata', () => {
  test('has required string fields with expected values', () => {
    assert.equal(pkg.name, 'lavamusic');
    assert.equal(pkg.version, '4.7.0');
    assert.equal(
      pkg.description,
      'LavaMusic is a music bot for Discord, written in JavaScript using the Discord.js, Typescript, lavalink-client (Lavalink) library.'
    );
    assert.equal(pkg.main, 'dist/index.js');
  });

  test('has repository object with correct type and URL', () => {
    assert.ok(pkg.repository && typeof pkg.repository === 'object');
    assert.equal(pkg.repository.type, 'git');
    assert.equal(pkg.repository.url, 'git+https://github.com/appujet/lavamusic.git');
  });

  test('has correct author, license, bugs, and homepage', () => {
    assert.equal(pkg.author, 'appujet');
    assert.equal(pkg.license, 'GPL-3.0');
    assert.ok(pkg.bugs && typeof pkg.bugs === 'object');
    assert.equal(pkg.bugs.url, 'https://github.com/appujet/lavamusic/issues');
    assert.equal(pkg.homepage, 'https://github.com/appujet/lavamusic#readme');
  });

  test('keywords is a non-empty array containing expected entries', () => {
    assert.ok(Array.isArray(pkg.keywords));
    const expected = [
      'discord',
      'music',
      'bot',
      'lavalink',
      'lavalink-client',
      'lavamusic',
      'typescript',
      'prisma',
    ];
    expected.forEach((kw) => assert.ok(pkg.keywords.includes(kw), `Missing keyword: ${kw}`));
  });
});

describe('package.json: scripts', () => {
  test('contains expected scripts and command shapes', () => {
    assert.ok(pkg.scripts && typeof pkg.scripts === 'object');

    // exact matches where string stability matters
    assert.equal(pkg.scripts.dev, 'tsup --watch --onSuccess="dotenvx run -- node dist/index.js"');
    assert.equal(pkg.scripts.start, 'dotenvx run -- node dist/index.js');

    // presence checks for other scripts
    ['db:push', 'db:migrate', 'build', 'lint', 'format'].forEach((s) =>
      assert.ok(pkg.scripts[s], `Missing script: ${s}`)
    );

    // spot-check important substrings
    assert.match(pkg.scripts['db:push'], /^npx prisma db push$/);
    assert.match(pkg.scripts['db:migrate'], /^npx prisma migrate dev --name init$/);
    assert.equal(pkg.scripts.build, 'tsup');
    assert.equal(pkg.scripts.lint, 'biome check');
    assert.equal(pkg.scripts.format, 'biome format --write');
  });
});

describe('package.json: devDependencies', () => {
  test('has required devDependencies with expected versions', () => {
    assert.ok(pkg.devDependencies && typeof pkg.devDependencies === 'object');

    const exacts = {
      '@biomejs/biome': '2.2.0',
      typescript: '^5.9.2',
      tsup: '^8.5.0',
      prisma: '^6.14.0',
      '@swc/core': '^1.13.4',
      '@types/i18n': '^0.13.12',
      '@types/node': '^24.3.0',
      '@types/signale': '^1.4.7',
    };

    for (const [dep, expected] of Object.entries(exacts)) {
      assert.ok(dep in pkg.devDependencies, `Missing devDependency: ${dep}`);
      assert.equal(
        pkg.devDependencies[dep],
        expected,
        `Unexpected version for ${dep}: ${pkg.devDependencies[dep]}`
      );
    }
  });
});

describe('package.json: dependencies', () => {
  test('has required dependencies with expected versions/URLs', () => {
    assert.ok(pkg.dependencies && typeof pkg.dependencies === 'object');

    const required = {
      '@dotenvx/dotenvx': '^1.49.0',
      '@prisma/client': '^6.14.0',
      '@top-gg/sdk': '^3.1.6',
      'discord.js': '^14.22.1',
      'genius-lyrics-api': '^3.2.1',
      i18n: '^0.15.1',
      'lavalink-client': 'https://pkg.pr.new/Tomato6966/lavalink-client@136',
      'node-system-stats': '^2.0.5',
      signale: '^1.4.0',
      'topgg-autoposter': '^2.0.2',
      tslib: '^2.8.1',
      undici: '^7.14.0',
      zod: '^4.0.17',
    };

    for (const [dep, expected] of Object.entries(required)) {
      assert.ok(dep in pkg.dependencies, `Missing dependency: ${dep}`);
      assert.equal(
        pkg.dependencies[dep],
        expected,
        `Unexpected version for ${dep}: ${pkg.dependencies[dep]}`
      );
    }

    // Special check: lavalink-client must be an HTTP URL pin, not a semver range
    assert.match(
      pkg.dependencies['lavalink-client'],
      /^https?:\/\//,
      'lavalink-client should be installed from a URL'
    );
  });
});

describe('package.json: signale configuration', () => {
  test('has signale configuration with expected boolean flags', () => {
    assert.ok(pkg.signale && typeof pkg.signale === 'object');
    const expectedBooleans = [
      'displayScope',
      'displayBadge',
      'displayDate',
      'displayFilename',
      'displayLabel',
      'displayTimestamp',
      'underlineLabel',
    ];
    expectedBooleans.forEach((key) => {
      assert.ok(key in pkg.signale, `Missing signale key: ${key}`);
      assert.equal(typeof pkg.signale[key], 'boolean', `signale.${key} must be boolean`);
    });
  });
});

describe('package.json: negative and edge validations', () => {
  test('fields have correct types', () => {
    // type checks to catch accidental structural regressions
    assert.equal(typeof pkg.name, 'string');
    assert.equal(typeof pkg.version, 'string');
    assert.equal(typeof pkg.description, 'string');
    assert.equal(typeof pkg.main, 'string');
    assert.equal(typeof pkg.repository, 'object');
    assert.equal(typeof pkg.scripts, 'object');
    assert.equal(typeof pkg.dependencies, 'object');
    assert.equal(typeof pkg.devDependencies, 'object');
  });

  test('no deprecated test frameworks inferred from package.json', () => {
    // Guard against accidental reintroduction of heavy test deps
    const forbidden = ['jest', 'vitest', 'mocha', 'ava', 'tap', 'uvu', 'zora'];
    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
      ...(pkg.optionalDependencies || {}),
      ...(pkg.peerDependencies || {}),
    };
    forbidden.forEach((name) => {
      assert.ok(!(name in allDeps), `Unexpected testing dependency present: ${name}`);
    });
  });
});

// Additional coverage appended by CI agent to validate script command semantics and URL pins
import { test as _test, describe as _describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

_describe('package.json: script semantics and safety checks (appended)', () => {
  _test('dev script uses tsup --watch with dotenvx wrapper', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dev = pkg?.scripts?.dev ?? '';
    assert.match(dev, /^tsup --watch /, 'dev script should start tsup in watch mode');
    assert.match(
      dev,
      /onSuccess="dotenvx run -- node dist\/index\.js"/,
      'dev script should use dotenvx to run built index'
    );
  });

  _test('start script delegates to dotenvx running dist build', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    assert.equal(pkg.scripts.start, 'dotenvx run -- node dist/index.js');
  });

  _test('prisma scripts exist and have expected base commands', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    assert.match(pkg.scripts['db:push'], /^npx prisma db push$/);
    assert.match(pkg.scripts['db:migrate'], /^npx prisma migrate dev --name init$/);
  });

  _test('URL-pinned dependency integrity', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const val = pkg.dependencies['lavalink-client'];
    assert.ok(val && typeof val === 'string');
    assert.ok(
      /^https:\/\/pkg\.pr\.new\/Tomato6966\/lavalink-client@/.test(val),
      'lavalink-client must remain pinned to the PR URL source'
    );
  });

  _test('no duplicate keys across dependency sections', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
    const seen = new Map();
    for (const sec of sections) {
      const obj = pkg[sec] || {};
      for (const [k] of Object.entries(obj)) {
        if (!seen.has(k)) seen.set(k, sec);
        else {
          assert.fail(`Dependency "${k}" appears in both ${seen.get(k)} and ${sec}`);
        }
      }
    }
  });
});