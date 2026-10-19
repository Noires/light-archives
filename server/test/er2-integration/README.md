# ER2 integration harness

Checks the "Elpis Reborn 2" backend against a real MariaDB 10.11 and Redis 7:

1. **Schema check:** the schema created by the pre-rework commit `8347c89` is migrated by the
   current server (`synchronize: true`), and the change must be purely additive.
2. **Endpoint run:** `run.mjs` starts the built server against a fresh database, seeds data and
   calls the API with JWTs signed by the throwaway secret. It prints PASS/FAIL per check and exits
   non-zero on any failure.

All values in `config/local-test.yml` are throwaway local values. S3 and Discord point at dummy
endpoints; nothing in the run uploads files or talks to Discord (image rows are seeded in SQL,
Steward webhook calls fail and are logged).

## Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | MariaDB 10.11 on port 33306, Redis 7 on 36379 (containers `er2test-*`, DB on tmpfs) |
| `config/local-test.yml` | Server config, selected with `NODE_ENV=local-test` |
| `run.mjs` | Endpoint run (no extra dependencies: `mysql` from the server's node_modules, built-in fetch) |
| `reminder-run.ts` | One pass of `EventReminderScheduler.run()` against the DB (run.mjs calls it; the cron only runs every 5 min) |
| `schema-check/old-seed.sql` | Rows seeded into the pre-rework schema |
| `schema-check/diff-schema.mjs` | Structured diff of two `mariadb-dump --no-data` files; exits 1 on any drop or change |
| `RESULTS.md` | Last run |

## Endpoint run

```bash
cd server
yarn build
docker compose -f test/er2-integration/docker-compose.yml up -d
node test/er2-integration/run.mjs
docker compose -f test/er2-integration/docker-compose.yml down -v
```

`run.mjs` drops and recreates the `la_er2` database, flushes Redis, spawns
`dist/apps/chaosarchives/main.js` on port 38111 and stops it at the end. With `--no-spawn` it
truncates all tables of an already running server's database instead (`BASE_URL`, `DB_NAME`
override the defaults). `RESULTS_JSON=out.json` writes the results as JSON.

To start the server by hand with the same config (bash):

```bash
NODE_ENV=local-test \
NODE_CONFIG_DIR="$PWD/config;$PWD/test/er2-integration/config" \
node dist/apps/chaosarchives/main.js
```

`NODE_CONFIG_DIR` takes several directories separated by `;` on Windows and `:` elsewhere.

## Schema check

```bash
# 1. old schema: check out the pre-rework commit OUTSIDE the repo and share node_modules
git worktree add --detach <tmp>/la-old 8347c89
cmd /c mklink /J <tmp>\la-old\server\node_modules <repo>\server\node_modules   # Windows junction
cd <tmp>/la-old/server && npx nest build chaosarchives
docker exec er2test-mariadb mariadb -uroot -per2root -e "CREATE DATABASE la_old"
NODE_ENV=local-test NODE_CONFIG_DIR="<tmp>/la-old/server/config;<repo>/server/test/er2-integration/config" \
  DB_NAME=la_old node dist/apps/chaosarchives/main.js       # stop it once "successfully started"

# 2. seed and dump
docker exec -i er2test-mariadb mariadb -uroot -per2root la_old < schema-check/old-seed.sql
docker exec er2test-mariadb mariadb-dump -uroot -per2root --no-data --skip-dump-date la_old \
  | sed 's/ AUTO_INCREMENT=[0-9]*//' > before.sql

# 3. current server against the same DB (from <repo>/server, after yarn build), then dump again
DB_NAME=la_old DB_LOGGING='["error","warn","schema"]' NODE_ENV=local-test NODE_CONFIG_DIR=... \
  node dist/apps/chaosarchives/main.js
docker exec er2test-mariadb mariadb-dump ... la_old | sed ... > after.sql
node test/er2-integration/schema-check/diff-schema.mjs before.sql after.sql

# 4. compare the old columns' data (SELECT <old columns> FROM each table, before vs after)

# 5. clean up: remove the junction FIRST so the shared node_modules survive
cmd /c rmdir <tmp>\la-old\server\node_modules
git worktree remove --force <tmp>/la-old
```

`DB_LOGGING='["query"]'` shows the exact `ALTER TABLE` statements TypeORM runs.
