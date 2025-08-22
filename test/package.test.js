/**
 * Testing library and framework:
 * - Node.js built-in test runner (node:test) + node:assert/strict
 * Rationale: No existing third-party test framework detected in the repository.
 * Scope: Validate package.json structure and critical values (scripts, deps, metadata).
 * Focus: Current file state with strong checks for happy paths and failure conditions.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function loadPackageJson() {
  const pkgPath = path.resolve(__dirname, '../package.json');
  const raw = fs.readFileSync(pkgPath, 'utf8');
  return JSON.parse(raw);
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function isSemverOrRange(v) {
  return (
    typeof v === 'string' &&
    /^(\^|~)?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z\.-]+)?$/.test(v)
  );
}

function collectErrors(pkg) {
  const errors = [];

  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
    errors.push('package.json must parse to a plain object');
    return errors;
  }

  // Basic metadata
  if (pkg.name !== 'lavamusic') errors.push('name should be "lavamusic"');
  if (typeof pkg.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(pkg.version)) {
    errors.push('version must be a strict semver "x.y.z"');
  } else if (pkg.version !== '4.7.0') {
    errors.push('version should be "4.7.0"');
  }
  if (typeof pkg.description !== 'string' || pkg.description.trim() === '') {
    errors.push('description must be a non-empty string');
  }
  if (pkg.main !== 'dist/index.js') {
    errors.push('main should be "dist/index.js"');
  }
  if (pkg.license !== 'GPL-3.0') {
    errors.push('license should be "GPL-3.0"');
  }
  if (pkg.author !== 'appujet') {
    errors.push('author should be "appujet"');
  }

  // Repository / links
  if (
    !pkg.repository ||
    pkg.repository.type !== 'git' ||
    pkg.repository.url !== 'git+https://github.com/appujet/lavamusic.git'
  ) {
    errors.push('repository metadata should reference the GitHub repo with git+ URL');
  }
  if (!pkg.bugs || pkg.bugs.url !== 'https://github.com/appujet/lavamusic/issues') {
    errors.push('bugs.url should be https://github.com/appujet/lavamusic/issues');
  }
  if (pkg.homepage !== 'https://github.com/appujet/lavamusic#readme') {
    errors.push('homepage should be https://github.com/appujet/lavamusic#readme');
  }

  // Keywords
  const expectedKeywords = [
    'discord',
    'music',
    'bot',
    'lavalink',
    'lavalink-client',
    'lavamusic',
    'typescript',
    'prisma',
  ];
  if (!Array.isArray(pkg.keywords)) {
    errors.push('keywords should be an array');
  } else {
    for (const kw of expectedKeywords) {
      if (!pkg.keywords.includes(kw)) errors.push(`keywords should include "${kw}"`);
    }
  }

  // Scripts
  if (!pkg.scripts || typeof pkg.scripts !== 'object') {
    errors.push('scripts must be present');
  } else {
    const s = pkg.scripts;
    // dev script requirements
    const dev = s.dev;
    if (typeof dev !== 'string') {
      errors.push('scripts.dev must be a string');
    } else {
      if (!dev.includes('tsup')) errors.push('scripts.dev should invoke "tsup"');
      if (!dev.includes('--watch')) errors.push('scripts.dev should include "--watch"');
      if (!dev.includes('dotenvx run -- node dist/index.js')) {
        errors.push('scripts.dev should run "dotenvx run -- node dist/index.js" via --onSuccess');
      }
    }
    if (s.start !== 'dotenvx run -- node dist/index.js') {
      errors.push('scripts.start should be "dotenvx run -- node dist/index.js"');
    }
    if (s.build !== 'tsup') errors.push('scripts.build should be "tsup"');
    if (s.lint !== 'biome check') errors.push('scripts.lint should be "biome check"');
    if (s.format !== 'biome format --write') {
      errors.push('scripts.format should be "biome format --write"');
    }
    if (s['db:push'] !== 'npx prisma db push') {
      errors.push('scripts.db:push should be "npx prisma db push"');
    }
    if (
      typeof s['db:migrate'] !== 'string' ||
      !s['db:migrate'].startsWith('npx prisma migrate dev') ||
      !/\s--name\s+init\b/.test(s['db:migrate'])
    ) {
      errors.push('scripts.db:migrate should be "npx prisma migrate dev --name init"');
    }
    if (s.test !== 'node --test') {
      errors.push('scripts.test should be "node --test"');
    }
  }

  // Dev dependencies
  const requiredDevDeps = [
    '@biomejs/biome',
    '@swc/core',
    '@types/i18n',
    '@types/node',
    '@types/signale',
    'prisma',
    'tsup',
    'typescript',
  ];
  if (!pkg.devDependencies || typeof pkg.devDependencies !== 'object') {
    errors.push('devDependencies should be an object');
  } else {
    for (const d of requiredDevDeps) {
      if (!(d in pkg.devDependencies)) errors.push(`devDependency "${d}" is required`);
    }
    // key versions sanity
    if (
      'typescript' in pkg.devDependencies &&
      !isSemverOrRange(pkg.devDependencies.typescript)
    ) {
      errors.push('devDependency "typescript" version should be a semver or range');
    }
    if (
      '@biomejs/biome' in pkg.devDependencies &&
      !isSemverOrRange(pkg.devDependencies['@biomejs/biome'])
    ) {
      errors.push('devDependency "@biomejs/biome" version should be a semver or range');
    }
  }

  // Dependencies
  const requiredDeps = [
    '@dotenvx/dotenvx',
    '@prisma/client',
    '@top-gg/sdk',
    'discord.js',
    'genius-lyrics-api',
    'i18n',
    'lavalink-client',
    'node-system-stats',
    'signale',
    'topgg-autoposter',
    'tslib',
    'undici',
    'zod',
  ];
  if (!pkg.dependencies || typeof pkg.dependencies !== 'object') {
    errors.push('dependencies should be an object');
  } else {
    for (const d of requiredDeps) {
      if (!(d in pkg.dependencies)) errors.push(`dependency "${d}" is required`);
    }
    // Specific check for lavalink-client PR URL
    if (
      typeof pkg.dependencies['lavalink-client'] !== 'string' ||
      !/^https?:\/\/.*Tomato6966\/lavalink-client@\d+/.test(pkg.dependencies['lavalink-client'])
    ) {
      errors.push('dependency "lavalink-client" should use the pkg.pr.new PR URL');
    }
    for (const [name, ver] of Object.entries(pkg.dependencies)) {
      if (name === 'lavalink-client') continue; // handled specially
      if (typeof ver !== 'string') {
        errors.push(`dependency "${name}" version must be a string`);
      } else if (!isSemverOrRange(ver)) {
        errors.push(`dependency "${name}" should use a semver or range version`);
      }
    }
  }

  // Signale configuration
  const expectedSignaleKeys = [
    'displayScope',
    'displayBadge',
    'displayDate',
    'displayFilename',
    'displayLabel',
    'displayTimestamp',
    'underlineLabel',
  ];
  if (!pkg.signale || typeof pkg.signale !== 'object') {
    errors.push('signale configuration is required');
  } else {
    for (const k of expectedSignaleKeys) {
      if (!(k in pkg.signale)) {
        errors.push(`signale.${k} is missing`);
      } else if (typeof pkg.signale[k] !== 'boolean') {
        errors.push(`signale.${k} must be a boolean`);
      } else if (pkg.signale[k] !== true) {
        errors.push(`signale.${k} should be true`);
      }
    }
  }

  return errors;
}

test('package.json: passes validation (happy path)', () => {
  const pkg = loadPackageJson();
  const errors = collectErrors(pkg);
  assert.deepEqual(errors, []);
});

test('package.json: required top-level keys exist and types are correct', () => {
  const pkg = loadPackageJson();
  // Existence
  for (const key of [
    'name',
    'version',
    'description',
    'main',
    'scripts',
    'repository',
    'keywords',
    'author',
    'license',
    'bugs',
    'homepage',
    'devDependencies',
    'dependencies',
    'signale',
  ]) {
    assert.ok(Object.prototype.hasOwnProperty.call(pkg, key), `missing key: ${key}`);
  }
  // Basic types
  assert.equal(typeof pkg.name, 'string');
  assert.equal(typeof pkg.version, 'string');
  assert.equal(typeof pkg.description, 'string');
  assert.equal(typeof pkg.main, 'string');
  assert.equal(typeof pkg.scripts, 'object');
  assert.equal(typeof pkg.repository, 'object');
  assert.ok(Array.isArray(pkg.keywords));
  assert.equal(typeof pkg.author, 'string');
  assert.equal(typeof pkg.license, 'string');
  assert.equal(typeof pkg.bugs, 'object');
  assert.equal(typeof pkg.homepage, 'string');
  assert.equal(typeof pkg.devDependencies, 'object');
  assert.equal(typeof pkg.dependencies, 'object');
  assert.equal(typeof pkg.signale, 'object');
});

test('scripts: dev uses tsup --watch and runs dotenvx on success', () => {
  const { scripts } = loadPackageJson();
  assert.match(scripts.dev, /tsup/);
  assert.match(scripts.dev, /--watch/);
  assert.match(
    scripts.dev,
    /dotenvx run -- node dist\/index\.js/,
    'dev script should run dotenvx -> node dist/index.js'
  );
});

test('scripts: start/build/lint/format/db:push/db:migrate/test are correctly defined', () => {
  const { scripts } = loadPackageJson();
  assert.equal(scripts.start, 'dotenvx run -- node dist/index.js');
  assert.equal(scripts.build, 'tsup');
  assert.equal(scripts.lint, 'biome check');
  assert.equal(scripts.format, 'biome format --write');
  assert.equal(scripts['db:push'], 'npx prisma db push');
  assert.match(scripts['db:migrate'], /^npx prisma migrate dev\b/);
  assert.match(scripts['db:migrate'], /\s--name\s+init\b/);
  assert.equal(scripts.test, 'node --test');
});

test('dependencies: required deps exist and have valid versions; lavalink-client uses PR URL', () => {
  const { dependencies } = loadPackageJson();
  const required = [
    '@dotenvx/dotenvx',
    '@prisma/client',
    '@top-gg/sdk',
    'discord.js',
    'genius-lyrics-api',
    'i18n',
    'lavalink-client',
    'node-system-stats',
    'signale',
    'topgg-autoposter',
    'tslib',
    'undici',
    'zod',
  ];
  for (const dep of required) {
    assert.ok(dep in dependencies, `missing dependency: ${dep}`);
  }
  // lavalink-client specific
  assert.match(
    String(dependencies['lavalink-client']),
    /https?:\/\/.*Tomato6966\/lavalink-client@\d+/,
    'lavalink-client should point to pkg.pr.new PR URL'
  );
  for (const [name, ver] of Object.entries(dependencies)) {
    if (name === 'lavalink-client') continue;
    assert.ok(
      isSemverOrRange(String(ver)),
      `dependency ${name} should have a semver or range version, got "${ver}"`
    );
  }
});

test('devDependencies: required dev deps exist and versions are valid', () => {
  const { devDependencies } = loadPackageJson();
  const required = [
    '@biomejs/biome',
    '@swc/core',
    '@types/i18n',
    '@types/node',
    '@types/signale',
    'prisma',
    'tsup',
    'typescript',
  ];
  for (const dep of required) {
    assert.ok(dep in devDependencies, `missing devDependency: ${dep}`);
  }
  if ('typescript' in devDependencies) {
    assert.ok(
      isSemverOrRange(devDependencies.typescript),
      `typescript version should be semver/range, got "${devDependencies.typescript}"`
    );
  }
  if ('@biomejs/biome' in devDependencies) {
    assert.ok(
      isSemverOrRange(devDependencies['@biomejs/biome']),
      `@biomejs/biome version should be semver/range, got "${devDependencies['@biomejs/biome']}"`
    );
  }
});

test('signale: all standard flags exist and are true booleans', () => {
  const { signale } = loadPackageJson();
  const keys = [
    'displayScope',
    'displayBadge',
    'displayDate',
    'displayFilename',
    'displayLabel',
    'displayTimestamp',
    'underlineLabel',
  ];
  for (const k of keys) {
    assert.ok(Object.prototype.hasOwnProperty.call(signale, k), `signale.${k} missing`);
    assert.equal(typeof signale[k], 'boolean', `signale.${k} should be boolean`);
    assert.equal(signale[k], true, `signale.${k} should be true`);
  }
});

test('failure cases: validator flags issues for mutated objects', async (t) => {
  await t.test('missing required key', () => {
    const bad = clone(loadPackageJson());
    delete bad.name;
    const errors = collectErrors(bad);
    assert.ok(errors.some(e => /name/.test(e)), 'should flag missing name');
  });

  await t.test('start script missing dotenvx', () => {
    const bad = clone(loadPackageJson());
    bad.scripts.start = 'node dist/index.js';
    const errors = collectErrors(bad);
    assert.ok(errors.some(e => /scripts\.start/.test(e)), 'should flag incorrect start script');
  });

  await t.test('dev script missing --watch or onSuccess', () => {
    const bad = clone(loadPackageJson());
    bad.scripts.dev = 'tsup';
    const errors = collectErrors(bad);
    assert.ok(errors.some(e => /scripts\.dev/.test(e)), 'should flag incomplete dev script');
  });

  await t.test('db:migrate missing --name init', () => {
    const bad = clone(loadPackageJson());
    bad.scripts['db:migrate'] = 'npx prisma migrate dev';
    const errors = collectErrors(bad);
    assert.ok(errors.some(e => /db:migrate/.test(e)), 'should flag missing --name init');
  });

  await t.test('lavalink-client not using PR URL', () => {
    const bad = clone(loadPackageJson());
    bad.dependencies['lavalink-client'] = '^1.0.0';
    const errors = collectErrors(bad);
    assert.ok(errors.some(e => /lavalink-client/.test(e)), 'should flag non-URL lavalink-client');
  });

  await t.test('signale flag not boolean/true', () => {
    const bad = clone(loadPackageJson());
    bad.signale.displayDate = 'true';
    bad.signale.displayLabel = false;
    const errors = collectErrors(bad);
    assert.ok(errors.some(e => /signale\.displayDate/.test(e)));
    assert.ok(errors.some(e => /signale\.displayLabel/.test(e)));
  });
});