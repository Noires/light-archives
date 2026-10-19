// Structured diff of two `mariadb-dump --no-data` files.
// Usage: node diff-schema.mjs before.sql after.sql
// Prints added/removed tables, columns, keys and constraints, and every changed column definition.
// Exits 1 if anything was removed or changed (i.e. the migration was not purely additive).
import { readFileSync } from 'node:fs';

function parse(file) {
  const tables = {};
  const re = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\n\) ENGINE[^;]*;/g;
  let m;
  while ((m = re.exec(readFileSync(file, 'utf8')))) {
    const t = { columns: {}, keys: {}, constraints: {} };
    for (const raw of m[2].split('\n')) {
      const line = raw.trim().replace(/,$/, '');
      if (!line) continue;
      let k;
      if ((k = /^`([^`]+)` (.*)$/.exec(line))) t.columns[k[1]] = k[2];
      else if ((k = /^CONSTRAINT `([^`]+)` (.*)$/.exec(line))) t.constraints[k[1]] = k[2];
      else if ((k = /^(PRIMARY KEY|(?:UNIQUE |FULLTEXT )?KEY `[^`]+`) (.*)$/.exec(line))) t.keys[k[1]] = k[2];
    }
    tables[m[1]] = t;
  }
  return tables;
}

const [before, after] = process.argv.slice(2).map(parse);
const added = [];
const destructive = [];
for (const name of Object.keys(after)) {
  if (!before[name]) { added.push(`CREATE TABLE ${name}`); continue; }
  for (const kind of ['columns', 'keys', 'constraints']) {
    const b = before[name][kind];
    const a = after[name][kind];
    for (const k of Object.keys(a)) {
      if (!(k in b)) added.push(`ADD ${kind.slice(0, -1).toUpperCase()} ${name}.${k} ${a[k]}`);
      else if (a[k] !== b[k]) destructive.push(`CHANGED ${kind.slice(0, -1)} ${name}.${k}\n    before: ${b[k]}\n    after:  ${a[k]}`);
    }
    for (const k of Object.keys(b)) if (!(k in a)) destructive.push(`DROP ${kind.slice(0, -1).toUpperCase()} ${name}.${k} ${b[k]}`);
  }
}
for (const name of Object.keys(before)) if (!after[name]) destructive.push(`DROP TABLE ${name}`);

console.log(`# Additive changes (${added.length})`);
added.forEach((l) => console.log(`  ${l}`));
console.log(`\n# Removed or changed (${destructive.length})`);
destructive.forEach((l) => console.log(`  ${l}`));
process.exit(destructive.length ? 1 : 0);
