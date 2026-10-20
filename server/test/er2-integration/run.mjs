// ER2 integration harness: real MariaDB + Redis, real server build, HTTP checks.
//
//   cd server && yarn build
//   docker compose -f test/er2-integration/docker-compose.yml up -d
//   node test/er2-integration/run.mjs            # spawns the server against a fresh `la_er2` DB
//   node test/er2-integration/run.mjs --no-spawn # use a server that is already running on BASE_URL
//
// No extra dependencies: `mysql` comes from the server's own node_modules, HTTP uses built-in fetch,
// JWTs are signed with node:crypto using the throwaway secret from config/local-test.yml.
import { spawn, spawnSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const mysql = require('mysql');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(HERE, '..', '..');
const PORT = 38111;
const BASE = process.env.BASE_URL || `http://127.0.0.1:${PORT}/api/internal`;
const DB = { host: '127.0.0.1', port: 33306, user: 'root', password: 'er2root', database: process.env.DB_NAME || 'la_er2' };
const REDIS = { host: '127.0.0.1', port: 36379 };
const JWT_SECRET = 'er2-integration-throwaway-secret';
const TZ = 'Europe/Berlin';
const SPAWN = !process.argv.includes('--no-spawn');
const SERVER_ENV = {
  ...process.env,
  NODE_ENV: 'local-test',
  NODE_CONFIG_DIR: [path.join(SERVER_DIR, 'config'), path.join(HERE, 'config')].join(path.delimiter),
  DB_NAME: DB.database,
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const results = [];
let currentSection = '';

function section(name) {
  currentSection = name;
  console.log(`\n## ${name}`);
}

function check(name, ok, detail = '') {
  results.push({ section: currentSection, name, ok: !!ok, detail: ok ? '' : String(detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  -- ${detail}`}`);
  return !!ok;
}

function b64url(value) {
  return Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
}

function jwt(userId) {
  const now = Math.floor(Date.now() / 1000);
  const head = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: userId, iat: now, exp: now + 3600 })}`;
  return `${head}.${createHmac('sha256', JWT_SECRET).update(head).digest('base64url')}`;
}

async function api(method, url, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${url}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
  return { status: res.status, json, text, headers: res.headers };
}

const short = (r) => `HTTP ${r.status} ${r.text.slice(0, 300)}`;

function expectStatus(name, r, status) {
  return check(`${name} -> ${status}`, r.status === status, short(r));
}

let conn;
function sql(query, params = []) {
  return new Promise((resolve, reject) => {
    conn.query(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function redisCommand(...args) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(REDIS, () => {
      socket.write(`*${args.length}\r\n${args.map((a) => `$${Buffer.byteLength(a)}\r\n${a}\r\n`).join('')}`);
    });
    socket.once('data', (data) => { socket.end(); resolve(data.toString()); });
    socket.once('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

async function waitFor(fn, timeoutMs, label) {
  const until = Date.now() + timeoutMs;
  for (;;) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const value = await fn();
      if (value) return value;
    } catch { /* retry */ }
    if (Date.now() > until) throw new Error(`timeout waiting for ${label}`);
    // eslint-disable-next-line no-await-in-loop
    await sleep(250);
  }
}

function berlinDate(offsetDays = 0) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(Date.now() + offsetDays * 86400000));
}

// ─── setup ────────────────────────────────────────────────────────────────────

let serverProc = null;

async function startServer() {
  const admin = mysql.createConnection({ ...DB, database: undefined });
  await new Promise((resolve, reject) => {
    admin.query(`DROP DATABASE IF EXISTS \`${DB.database}\``, (e1) => {
      if (e1) return reject(e1);
      return admin.query(`CREATE DATABASE \`${DB.database}\` CHARACTER SET utf8mb4`, (e2) => (e2 ? reject(e2) : resolve()));
    });
  });
  admin.end();
  await redisCommand('FLUSHALL');

  serverProc = spawn(process.execPath, ['dist/apps/chaosarchives/main.js'], { cwd: SERVER_DIR, env: SERVER_ENV });
  const log = [];
  serverProc.stdout.on('data', (d) => log.push(d.toString()));
  serverProc.stderr.on('data', (d) => log.push(d.toString()));
  serverProc.on('exit', (code) => { if (code) console.error(`server exited with ${code}\n${log.join('').slice(-4000)}`); });
  await waitFor(async () => (await fetch(`${BASE}/servers`)).ok, 90000, 'server start');
  serverProc.logLines = log;
}

async function seed() {
  await sql(`INSERT INTO server (id, name, datacenter) VALUES (1, 'Alpha', 'Light'), (2, 'Phoenix', 'Light')`);
  await sql(`INSERT INTO user (id, email, discordId, role, verifiedAt, termsAcceptedAt) VALUES
    (1, 'aria@example.invalid', '2001', 'trusted', NOW(), NOW()),
    (2, 'bran@example.invalid', '2002', 'user', NOW(), NOW()),
    (3, 'mila@example.invalid', '2003', 'moderator', NOW(), NOW()),
    (4, 'otto@example.invalid', '2004', 'user', NOW(), NOW()),
    (5, 'cyra@example.invalid', '2005', 'user', NOW(), NOW())`);
  const chars = [
    [1, 'Aria Sonnenwind', 1, 1, 1],
    [2, 'Bran Eisenfaust', 1, 2, 1],
    [3, 'Mila Mondlicht', 2, 3, null],
    [4, 'Otto Fremd', 1, 4, null],
    [5, 'Cyra Sternfall', 2, 5, null],
  ];
  for (const [id, name, serverId, userId, fcId] of chars) {
    // eslint-disable-next-line no-await-in-loop
    await sql(`INSERT INTO \`character\` (id, lodestoneId, active, name, race, tribe, avatar, verifiedAt, serverId, userId,
      showAvatar, freeCompanyId, updatedAt) VALUES (?, ?, 1, ?, 'elezen', 'wildwood', ?, NOW(), ?, ?, 1, NULL, NOW() - INTERVAL ? MINUTE)`,
    [id, 950000 + id, name, `https://img.example.invalid/avatar-${id}.png`, serverId, userId, id]);
    if (fcId) {
      // FC rows are inserted below; link afterwards
    }
  }
  // Bran hides his avatar: must not appear in memberAvatars
  await sql('UPDATE `character` SET showAvatar = 0 WHERE id = 2');
  await sql(`INSERT INTO image (id, width, height, size, hash, filename, category, title, format, ownerId) VALUES
    (1, 1600, 400, 1000, 'hash0001', 'banner.png', 'artwork', 'Krug-Banner', 'png', 1),
    (2, 800, 600, 1000, 'hash0002', 'szene.png', 'screenshot', 'Abend am Hafen', 'png', 1),
    (3, 800, 600, 1000, 'hash0003', 'portrait.png', 'artwork', 'Portrait', 'png', 1),
    (4, 800, 600, 1000, 'hash0004', 'cyra.png', 'artwork', 'Cyras Bild', 'png', 5)`);
  await sql(`INSERT INTO venue (id, name, description, location, housingArea, ward, plot, serverId, ownerId, bannerId, adultOnly, purpose)
    VALUES (1, 'Zum Goldenen Krug', '<p>Taverne am Hafen</p>', 'house', 'mist', 5, 12, 1, 1, 1, 0, 'Taverne'),
           (2, 'Stille Ecke', '<p>Leseraum</p>', 'open_world', NULL, NULL, NULL, 2, 3, NULL, 1, 'Bibliothek')`);
  await sql(`INSERT INTO venue_tag (name, venueId) VALUES ('Gemütlich', 1)`);
  await sql(`INSERT INTO free_company (id, lodestoneId, name, tag, foundedAt, claimedAt, serverId, leaderId, description, goal, recruiting)
    VALUES (1, '9000000000000001', 'Lichtbringer', 'LICHT', '2020-01-01', NOW(), 1, 1, '<p>FC</p>', 'Abenteuer', 1),
           (2, '9000000000000002', 'Schattenkreis', 'SCHAT', '2021-01-01', NOW(), 2, 3, '<p>FC2</p>', 'Ruhe', NULL),
           (3, '9000000000000003', 'Ungeclaimt', 'NONE', '2021-01-01', NULL, 2, NULL, '<p>FC3</p>', 'Ruhe', NULL)`);
  await sql("INSERT INTO content_note (name) VALUES ('Gewalt'), ('Tod')");
  await sql('UPDATE `character` SET freeCompanyId = 1 WHERE id IN (1, 2)');
  await sql(`INSERT INTO community (id, name, description, ownerId, goal, recruiting)
    VALUES (1, 'Zirkel der Sterne', '<p>Sternkunde</p>', 1, 'Sterne', 1), (2, 'Leerer Kreis', '<p>leer</p>', 3, 'Nichts', NULL)`);
  await sql(`INSERT INTO community_membership (status, canEdit, canManageMembers, characterId, communityId) VALUES
    ('confirmed', 1, 1, 1, 1), ('confirmed', 0, 0, 2, 1), ('applied', 0, 0, 5, 1)`);
  await sql(`INSERT INTO noticeboard_item (id, title, content, location, type, ownerId, createdAt) VALUES
    (1, 'Alter Aushang', '<p>alt</p>', 'limsa_lominsa', 'aushang', 1, NOW() - INTERVAL 2 DAY),
    (2, 'Neuer Aushang', '<p>neu</p>', 'gridania', 'gesuch', 2, NOW() - INTERVAL 1 DAY)`);
}

function eventBody(characterId, title, startMs, extra = {}) {
  return {
    characterId,
    title,
    details: `<p>${title} – Details</p>`,
    oocDetails: '',
    startDateTime: startMs,
    endDateTime: startMs + 3 * 3600000,
    contact: 'Aria',
    eventType: 'TAVERN',
    contentNotes: [],
    announcements: [],
    locations: [{ name: 'Zum Goldenen Krug', address: 'Mist W5 P12', server: 'Alpha', link: '', venueId: 1 }],
    ...extra,
  };
}

// ─── checks ───────────────────────────────────────────────────────────────────

async function main() {
  if (SPAWN) await startServer();
  conn = mysql.createConnection(DB);
  if (!SPAWN) {
    const tables = (await sql('SHOW TABLES')).map((r) => Object.values(r)[0]);
    await sql('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of tables) await sql(`TRUNCATE TABLE \`${t}\``); // eslint-disable-line no-await-in-loop
    await sql('SET FOREIGN_KEY_CHECKS = 1');
    await redisCommand('FLUSHALL');
  }
  await seed();

  const T = { aria: jwt(1), bran: jwt(2), mila: jwt(3), otto: jwt(4), cyra: jwt(5) };
  const HOUR = 3600000;
  const DAY = 24 * HOUR;
  const now = Date.now();
  let r;

  // ── events ──
  section('Events');
  r = await api('POST', '/events', { token: T.aria, body: eventBody(1, 'Hafenfest', now + DAY, { programme: [{ time: '20:00', title: 'Begrüßung' }] }) });
  expectStatus('create open event', r, 201);
  const openEventId = r.json?.id;
  r = await api('POST', '/events', { token: T.aria, body: eventBody(1, 'Geschlossene Gesellschaft', now + 3 * DAY, { closedEvent: true, registrationDeadlineDays: 1, registrationDeadlineTime: '18:00' }) });
  expectStatus('create closed event', r, 201);
  const closedEventId = r.json?.id;
  r = await api('POST', '/events', { token: T.bran, body: eventBody(2, 'Gleich gehts los', now + 20 * 60000) });
  expectStatus('create event starting in 20 min (reminder)', r, 201);
  const soonEventId = r.json?.id;
  r = await api('POST', '/events', { token: T.aria, body: eventBody(1, 'Vergangenes Fest', now - 2 * DAY) });
  expectStatus('create past event', r, 201);
  const pastEventId = r.json?.id;

  r = await api('POST', `/events/${openEventId}/registrations`, { token: T.bran, body: { characterId: 2, kind: 'going' } });
  check('register going -> 2xx', r.status === 201 || r.status === 200, short(r));
  r = await api('POST', `/events/${openEventId}/registrations`, { token: T.otto, body: { characterId: 4, kind: 'interested' } });
  check('register interested -> 2xx', r.status === 201 || r.status === 200, short(r));
  r = await api('POST', `/events/${openEventId}/registrations`, { token: T.cyra, body: { characterId: 5 } });
  check('register without kind (legacy body) -> 2xx', r.status === 201 || r.status === 200, short(r));
  r = await api('GET', `/events/${openEventId}`, { token: T.otto });
  expectStatus('event detail', r, 200);
  check('detail goingCount=2 interestedCount=1', r.json?.goingCount === 2 && r.json?.interestedCount === 1, JSON.stringify({ g: r.json?.goingCount, i: r.json?.interestedCount }));
  check('detail myRegistrationKinds for Otto = interested', r.json?.myRegistrationKinds?.[4] === 'interested', JSON.stringify(r.json?.myRegistrationKinds));
  check('detail programme stored', r.json?.programme?.[0]?.title === 'Begrüßung', JSON.stringify(r.json?.programme));

  r = await api('POST', `/events/${openEventId}/registrations`, { token: T.otto, body: { characterId: 4, kind: 'going' } });
  check('switch interested -> going -> 2xx', r.status === 201 || r.status === 200, short(r));
  const regRows = await sql('SELECT COUNT(*) AS n, MIN(kind) AS kind FROM event_registration WHERE eventId = ? AND characterId = 4', [openEventId]);
  check('switch keeps a single registration row', regRows[0].n === 1 && regRows[0].kind === 'going', JSON.stringify(regRows[0]));
  r = await api('POST', `/events/${openEventId}/registrations`, { token: T.otto, body: { characterId: 2, kind: 'going' } });
  check('register foreign character -> 4xx', r.status >= 400 && r.status < 500, short(r));
  r = await api('POST', `/events/${pastEventId}/registrations`, { token: T.otto, body: { characterId: 4, kind: 'going' } });
  expectStatus('register for past event', r, 400);
  r = await api('POST', `/events/${closedEventId}/registrations`, { token: T.otto, body: { characterId: 4, kind: 'going' } });
  check('register for closed event before deadline -> 2xx', r.status === 201 || r.status === 200, short(r));

  r = await api('GET', '/events');
  expectStatus('events list without ?refresh', r, 200);
  r = await api('GET', '/events?refresh=false');
  expectStatus('events list', r, 200);
  const listed = (r.json?.events || []).find((e) => e.id === openEventId);
  check('list goingCount=3 interestedCount=0 after switch', listed?.goingCount === 3 && listed?.interestedCount === 0, JSON.stringify(listed && { g: listed.goingCount, i: listed.interestedCount }));
  const listedClosed = (r.json?.events || []).find((e) => e.id === closedEventId);
  check('list contains closed event with closedEvent=true', listedClosed?.closedEvent === true, JSON.stringify(listedClosed));
  check('list hides past event', !(r.json?.events || []).some((e) => e.id === pastEventId), 'past event listed');

  r = await api('DELETE', `/events/${openEventId}/registrations/5`, { token: T.cyra });
  check('withdraw RSVP -> 2xx', r.status === 200 || r.status === 204, short(r));

  r = await api('GET', `/events/${openEventId}/ics`);
  expectStatus('event ics', r, 200);
  check('event ics is a VCALENDAR with the event', r.headers.get('content-type')?.startsWith('text/calendar') && r.text.includes('BEGIN:VEVENT') && r.text.includes('SUMMARY:Hafenfest'), r.text.slice(0, 200));
  r = await api('GET', '/events/my.ics', { token: T.otto });
  expectStatus('my.ics', r, 200);
  check('my.ics has both registered events', r.text.includes('Hafenfest') && r.text.includes('Geschlossene Gesellschaft'), r.text.slice(0, 400));
  r = await api('GET', '/events/my.ics');
  expectStatus('my.ics anonymous', r, 401);

  // ── event series ──
  section('Event series');
  r = await api('POST', '/event-series', { token: T.aria, body: { characterId: 1, title: 'Krug-Abend', rule: 'weekly', weekday: 5, startTime: '20:00', endTime: '23:00', venueId: 1 } });
  check('create series -> 201', r.status === 201, short(r));
  const seriesId = r.json?.id;
  check('series has label and nextOccurrences', !!r.json?.label && Array.isArray(r.json?.nextOccurrences), short(r));
  r = await api('GET', `/event-series/${seriesId}/next?count=4`);
  expectStatus('series next', r, 200);
  const occ = Array.isArray(r.json) ? r.json : [];
  check('series next: weekly Fridays 20:00 Berlin, ascending, in future', occ.length >= 3 && occ.every((o, i) => o.startDateTime > Date.now()
    && new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(o.startDateTime) === 'Fri 20:00'
    && (i === 0 || o.startDateTime - occ[i - 1].startDateTime >= 6 * DAY)), JSON.stringify(occ));
  r = await api('GET', '/event-series/mine', { token: T.aria });
  check('series mine contains it', r.status === 200 && r.json?.some((s) => s.id === seriesId), short(r));
  r = await api('PUT', `/events/${openEventId}`, { token: T.aria, body: eventBody(1, 'Hafenfest', now + DAY, { seriesId }) });
  check('attach event to series -> 200', r.status === 200, short(r));
  r = await api('GET', `/events/${openEventId}`);
  check('event detail shows seriesId + nextOccurrences', r.json?.seriesId === seriesId && Array.isArray(r.json?.nextOccurrences), JSON.stringify({ s: r.json?.seriesId, n: r.json?.nextOccurrences }));
  r = await api('PUT', `/event-series/${seriesId}`, { token: T.otto, body: { title: 'Gekapert', rule: 'weekly', weekday: 1, startTime: '20:00' } });
  check('foreign user edits series -> 403/404', r.status === 403 || r.status === 404, short(r));

  // ── venues ──
  section('Venues');
  r = await api('PUT', '/venues/1/opening-hours', { token: T.aria, body: { hours: [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, openTime: '00:00', closeTime: '23:59' })), exceptions: [{ date: berlinDate(10), closed: true, note: 'Betriebsferien' }] } });
  expectStatus('PUT opening hours (owner)', r, 200);
  r = await api('PUT', '/venues/2/opening-hours', { token: T.mila, body: { hours: [{ weekday: 1, openTime: '20:00', closeTime: '02:00' }, ...[1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, openTime: '00:00', closeTime: '23:59' }))], exceptions: [{ date: berlinDate(0), closed: true }] } });
  expectStatus('PUT opening hours (venue 2, closed today)', r, 200);
  r = await api('PUT', '/venues/1/opening-hours', { token: T.otto, body: { hours: [], exceptions: [] } });
  expectStatus('PUT opening hours by stranger', r, 403);
  r = await api('PUT', '/venues/1/opening-hours', { token: T.aria, body: { hours: [{ weekday: 9, openTime: '25:00', closeTime: '1' }], exceptions: [] } });
  expectStatus('PUT invalid opening hours', r, 400);
  r = await api('GET', '/venues/1/opening-hours');
  expectStatus('GET opening hours', r, 200);
  check('GET opening hours roundtrip (7 slots, HH:mm, exception date string)', r.json?.hours?.length === 7 && r.json.hours[0].openTime === '00:00'
    && r.json.exceptions?.[0]?.date === berlinDate(10) && r.json.exceptions[0].note === 'Betriebsferien', JSON.stringify(r.json));
  r = await api('GET', '/venues/2/opening-hours');
  check('overnight flag derived for 20:00-02:00', r.json?.hours?.some((h) => h.openTime === '20:00' && h.overnight === true), JSON.stringify(r.json?.hours));

  r = await api('GET', '/venues');
  expectStatus('GET /venues', r, 200);
  const v1 = r.json?.find((v) => v.id === 1);
  const v2 = r.json?.find((v) => v.id === 2);
  check('venue 1 openNow=true + closesAt', v1?.openNow === true && !!v1?.closesAt, JSON.stringify(v1 && { o: v1.openNow, c: v1.closesAt, a: v1.opensAt }));
  check('venue 2 closed today by exception -> openNow=false + opensAt tomorrow', v2?.openNow === false && !!v2?.opensAt
    && new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(v2.opensAt)) === berlinDate(1), JSON.stringify(v2 && { o: v2.openNow, a: v2.opensAt }));
  check('venue 1 bannerUrl', typeof v1?.bannerUrl === 'string' && v1.bannerUrl.includes('hash0001'), String(v1?.bannerUrl));
  check('venue 2 bannerUrl null', v2?.bannerUrl === null || v2?.bannerUrl === undefined, String(v2?.bannerUrl));
  check('venue 1 tags include own tag + housing labels', Array.isArray(v1?.tags) && v1.tags.includes('Gemütlich') && v1.tags.length >= 2, JSON.stringify(v1?.tags));
  check('venue adultOnly flags', v1?.adultOnly === false && v2?.adultOnly === true, JSON.stringify([v1?.adultOnly, v2?.adultOnly]));
  check('venue 1 nextEvent = Hafenfest', v1?.nextEvent?.id === soonEventId || v1?.nextEvent?.id === openEventId, JSON.stringify(v1?.nextEvent));
  check('venue 1 nextEvent is the earliest upcoming (20-min event)', v1?.nextEvent?.id === soonEventId, JSON.stringify(v1?.nextEvent));
  check('venue 2 nextEvent null', !v2?.nextEvent, JSON.stringify(v2?.nextEvent));

  // ── RP status ──
  section('RP status');
  r = await api('PUT', '/characters/1/rp-status', { token: T.aria, body: { rpStatus: 'lfrp', rpLocation: 'Limsa, Aftcastle', durationMinutes: 60 } });
  expectStatus('set rp status', r, 200);
  check('rp status response', r.json?.rpStatus === 'lfrp' && r.json?.rpLocation === 'Limsa, Aftcastle' && r.json?.rpStatusExpiresAt > Date.now() + 50 * 60000, short(r));
  r = await api('PUT', '/characters/1/rp-status', { token: T.otto, body: { rpStatus: 'ic' } });
  check('set rp status of foreign character -> 403/404', r.status === 403 || r.status === 404, short(r));
  r = await api('PUT', '/characters/2/rp-status', { token: T.bran, body: { rpStatus: 'ic', durationMinutes: 999 } });
  expectStatus('rp status duration > max', r, 400);
  await sql("UPDATE `character` SET rpStatus = 'ic', rpStatusExpiresAt = NOW() - INTERVAL 1 MINUTE WHERE id = 3");
  r = await api('GET', '/characters/rp-active');
  expectStatus('rp-active', r, 200);
  check('rp-active lists Aria, not expired Mila', r.json?.some((p) => p.characterId === 1 && p.rpStatus === 'lfrp') && !r.json?.some((p) => p.characterId === 3), JSON.stringify(r.json));
  r = await api('DELETE', '/characters/1/rp-status', { token: T.aria });
  check('clear rp status', r.status === 200 && r.json?.rpStatus === null, short(r));
  r = await api('GET', '/characters/rp-active');
  check('rp-active empty after clear', Array.isArray(r.json) && !r.json.some((p) => p.characterId === 1), JSON.stringify(r.json));

  // ── follows (before stories so notifications fire) ──
  section('Follows');
  r = await api('PUT', '/follows', { token: T.otto, body: { targetType: 'story-series', targetKey: '1:Gibt es nicht' } });
  expectStatus('follow unknown series', r, 404);
  r = await api('PUT', '/follows', { token: T.cyra, body: { targetType: 'author', targetKey: '1' } });
  check('follow author', r.status === 200 && r.json?.following === true, short(r));
  r = await api('PUT', '/follows', { token: T.cyra, body: { targetType: 'venue', targetKey: '1' } });
  check('follow venue', r.status === 200, short(r));

  // ── stories ──
  section('Stories');
  const longText = `<p>${'Wort '.repeat(250)}</p><p>Er sprach vom [[Hafen von Limsa]].</p>`;
  const storyBody = (title, extra = {}) => ({ characterId: 1, title, content: longText, type: 'book', tags: ['Abenteuer'], contentNotes: ['Gewalt'], ...extra });
  r = await api('POST', '/stories', { token: T.aria, body: storyBody('Sturm, Teil 1', { seriesTitle: 'Die Sturmchroniken', seriesIndex: 1 }) });
  expectStatus('create story part 1', r, 201);
  const s1 = r.json?.id;
  r = await api('PUT', '/follows', { token: T.otto, body: { targetType: 'story-series', targetKey: '1:Die Sturmchroniken' } });
  check('follow series', r.status === 200 && r.json?.following === true, short(r));
  r = await api('PUT', '/follows', { token: T.otto, body: { targetType: 'story-series', targetKey: '1:Die Sturmchroniken' } });
  check('follow twice is idempotent', r.status === 200 && r.json?.followerCount === 1, short(r));
  r = await api('GET', '/follows/status?targetType=story-series&targetKey=1%3ADie%20Sturmchroniken', { token: T.otto });
  check('follow status', r.status === 200 && r.json?.following === true, short(r));
  r = await api('GET', '/follows', { token: T.otto });
  check('my follows', r.status === 200 && r.json?.length === 1, short(r));
  r = await api('POST', '/stories', { token: T.aria, body: storyBody('Sturm, Teil 2', { seriesTitle: 'Die Sturmchroniken', seriesIndex: 2 }) });
  expectStatus('create story part 2', r, 201);
  const s2 = r.json?.id;
  r = await api('POST', '/stories', { token: T.aria, body: storyBody('Sturm, Teil 3 (Entwurf)', { seriesTitle: 'Die Sturmchroniken', seriesIndex: 3, published: false }) });
  expectStatus('create draft part 3', r, 201);
  const s3 = r.json?.id;
  r = await api('POST', '/stories', { token: T.aria, body: storyBody('Geheimakte Sturm', { published: false }) });
  expectStatus('create standalone draft', r, 201);
  const s4 = r.json?.id;
  r = await api('GET', '/stories?limit=50');
  expectStatus('story list anonymous', r, 200);
  const anonList = r.json?.data || [];
  const sum1 = anonList.find((s) => s.id === s1);
  check('anonymous list hides draft', !anonList.some((s) => s.id === s3 || s.id === s4) && anonList.length === 2, JSON.stringify(anonList.map((s) => s.id)));
  check('summary contentNotes/wordCount/series', sum1?.contentNotes?.includes('Gewalt') && sum1?.wordCount >= 250 && sum1?.seriesTitle === 'Die Sturmchroniken' && sum1?.seriesIndex === 1, JSON.stringify(sum1 && { c: sum1.contentNotes, w: sum1.wordCount, t: sum1.seriesTitle, i: sum1.seriesIndex }));
  r = await api('GET', '/stories?limit=50', { token: T.aria });
  check('owner list includes own draft', r.json?.data?.some((s) => s.id === s3 && s.published === false), JSON.stringify(r.json?.data?.map((s) => [s.id, s.published])));
  r = await api('GET', '/stories?limit=50', { token: T.otto });
  check('other user list hides draft', !r.json?.data?.some((s) => s.id === s3), JSON.stringify(r.json?.data?.map((s) => s.id)));
  r = await api('GET', `/stories/${s3}`, { token: T.otto });
  expectStatus('draft detail for other user', r, 404);
  r = await api('GET', `/stories/${s3}`, { token: T.aria });
  expectStatus('draft detail for owner', r, 200);
  r = await api('GET', `/stories/${s2}/series`);
  check('series parts (anonymous) = 1,2 ordered', r.status === 200 && JSON.stringify(r.json?.parts?.map((p) => p.id)) === JSON.stringify([s1, s2]), short(r));
  r = await api('GET', `/stories/${s2}/series`, { token: T.aria });
  check('series parts (owner) include draft', JSON.stringify(r.json?.parts?.map((p) => p.id)) === JSON.stringify([s1, s2, s3]), short(r));
  r = await api('GET', `/stories/${s1}`);
  check('story detail seriesCount/contentNotes', r.status === 200 && r.json?.contentNotes?.includes('Gewalt') && r.json?.seriesTitle === 'Die Sturmchroniken', short(r));

  // ── notifications (story in followed series) ──
  section('Notifications');
  const notif = await waitFor(async () => {
    const n = await api('GET', '/notifications', { token: T.otto });
    return n.json?.length >= 1 ? n : null;
  }, 5000, 'series notifications').catch(() => null);
  r = notif || await api('GET', '/notifications', { token: T.otto });
  check('series follower got series-part notification for part 2 only (followed after part 1)', r.json?.filter((n) => n.type === 'series-part').length === 1, short(r));
  r = await api('GET', '/notifications', { token: T.cyra });
  check('author follower got author-story notifications', r.json?.filter((n) => n.type === 'author-story').length === 2, short(r));
  r = await api('GET', '/notifications', { token: T.aria });
  check('author did not notify herself', !r.json?.some((n) => n.type === 'series-part' || n.type === 'author-story'), short(r));
  check('event owner got event-registration notifications', r.json?.some((n) => n.type === 'event-registration'), short(r));
  r = await api('PUT', `/stories/${s3}`, { token: T.aria, body: storyBody('Sturm, Teil 3', { seriesTitle: 'Die Sturmchroniken', seriesIndex: 3, published: true }) });
  expectStatus('publish draft', r, 200);
  r = await waitFor(async () => {
    const n = await api('GET', '/notifications', { token: T.otto });
    return n.json?.filter((x) => x.type === 'series-part').length >= 2 ? n : null;
  }, 5000, 'publish notification').catch(() => api('GET', '/notifications', { token: T.otto }));
  check('publishing a draft notifies series followers', r.json?.filter((n) => n.type === 'series-part').length === 2, short(r));
  r = await api('GET', '/notifications/unread-count', { token: T.otto });
  check('unread count = 2', r.json?.count === 2, short(r));
  const ottoNotifs = (await api('GET', '/notifications', { token: T.otto })).json || [];
  r = await api('PUT', `/notifications/${ottoNotifs[0]?.id}/read`, { token: T.otto });
  check('mark read', r.status === 200, short(r));
  r = await api('PUT', `/notifications/${ottoNotifs[1]?.id}/read`, { token: T.cyra });
  const foreignRead = await sql('SELECT readAt FROM notification WHERE id = ?', [ottoNotifs[1]?.id]);
  check('marking a foreign notification read has no effect', foreignRead[0]?.readAt === null && r.status < 500, `${short(r)} readAt=${foreignRead[0]?.readAt}`);
  r = await api('PUT', '/notifications/read-all', { token: T.otto });
  r = await api('GET', '/notifications/unread-count', { token: T.otto });
  check('read-all -> 0 unread', r.json?.count === 0, short(r));
  r = await api('PUT', '/notifications/preferences', { token: T.otto, body: { reminderMinutes: 60 } });
  check('update preferences', r.status === 200 && r.json?.reminderMinutes === 60, short(r));

  // ── reminder scheduler ──
  section('Reminder scheduler');
  r = await api('POST', `/events/${soonEventId}/registrations`, { token: T.otto, body: { characterId: 4, kind: 'going' } });
  check('register for event starting in 20 min', r.status === 201 || r.status === 200, short(r));
  r = await api('POST', `/events/${soonEventId}/registrations`, { token: T.cyra, body: { characterId: 5, kind: 'interested' } });
  const reminderRun = () => spawnSync(process.execPath, ['-r', 'ts-node/register/transpile-only', '-r', 'tsconfig-paths/register', path.join(HERE, 'reminder-run.ts')], { cwd: SERVER_DIR, env: SERVER_ENV, encoding: 'utf8' });
  let rr = reminderRun();
  check('reminder pass runs', rr.status === 0, `${rr.stdout}${rr.stderr}`.slice(-800));
  r = await api('GET', '/notifications', { token: T.otto });
  check('going user got event-reminder', r.json?.filter((n) => n.type === 'event-reminder' && n.link === `/event/${soonEventId}`).length === 1, short(r));
  r = await api('GET', '/notifications', { token: T.cyra });
  check('interested user got no reminder', !r.json?.some((n) => n.type === 'event-reminder'), short(r));
  const reminded = await sql('SELECT remindedAt FROM event_registration WHERE eventId = ? AND characterId = 4', [soonEventId]);
  check('registration marked remindedAt', reminded[0]?.remindedAt !== null, JSON.stringify(reminded));
  rr = reminderRun();
  r = await api('GET', '/notifications', { token: T.otto });
  check('second pass does not remind twice', rr.status === 0 && r.json?.filter((n) => n.type === 'event-reminder').length === 1, short(r));

  // ── reactions ──
  section('Reactions');
  r = await api('POST', '/reactions/toggle', { token: T.otto, body: { targetType: 'story', targetId: s1, kind: 'gaensehaut', characterId: 4 } });
  check('toggle on', r.status === 201 && r.json?.reactionCounts?.gaensehaut === 1 && r.json?.myReactions?.includes('gaensehaut'), short(r));
  const parallel = await Promise.all([1, 2, 3].map(() => api('POST', '/reactions/toggle', { token: T.bran, body: { targetType: 'story', targetId: s1, kind: 'spannend', characterId: 2 } })));
  const spannendRows = await sql("SELECT COUNT(*) AS n FROM reaction WHERE targetId = ? AND kind = 'spannend' AND characterId = 2", [s1]);
  check('parallel toggles never create duplicates', spannendRows[0].n <= 1 && parallel.every((p) => p.status < 500), `${spannendRows[0].n} rows; ${parallel.map((p) => p.status)}`);
  r = await api('POST', '/reactions/toggle', { token: T.otto, body: { targetType: 'story', targetId: s1, kind: 'gaensehaut', characterId: 4 } });
  check('toggle off', r.status === 201 && !r.json?.reactionCounts?.gaensehaut && !r.json?.myReactions?.includes('gaensehaut'), short(r));
  r = await api('POST', '/reactions/toggle', { token: T.otto, body: { targetType: 'story', targetId: s1, kind: 'wunderschoen', characterId: 4 } });
  expectStatus('image-only kind on story', r, 400);
  r = await api('POST', '/reactions/toggle', { token: T.otto, body: { targetType: 'story', targetId: s1, kind: 'gaensehaut', characterId: 1 } });
  check('react as foreign character -> 4xx', r.status >= 400 && r.status < 500, short(r));
  r = await api('POST', '/reactions/toggle', { token: T.otto, body: { targetType: 'story', targetId: s1, kind: 'gaensehaut', characterId: 4 } });
  r = await api('GET', `/reactions/story/${s1}`);
  check('summary counts', r.status === 200 && r.json?.reactionCounts?.gaensehaut === 1, short(r));
  const uniq = await sql("SHOW INDEX FROM reaction WHERE Non_unique = 0 AND Key_name <> 'PRIMARY'");
  check('reaction table has a unique index', uniq.length > 0, 'no unique index');

  // ── search ──
  section('Search');
  r = await api('GET', `/search?q=${encodeURIComponent('Sonnenwind')}`);
  check('search finds character', r.status === 200 && r.json?.find((g) => g.type === 'profile')?.results?.length >= 1, short(r));
  r = await api('GET', `/search?q=${encodeURIComponent('Sturm')}`);
  const storyHits = r.json?.find((g) => g.type === 'story')?.results || [];
  check('search finds published stories, not drafts', r.status === 200 && storyHits.length >= 1 && !JSON.stringify(storyHits).includes('Geheimakte'), short(r));
  r = await api('GET', `/search/suggest?q=${encodeURIComponent('Geheim')}`);
  check('suggest hides draft story and unpublished wiki page', r.status === 200 && !JSON.stringify(r.json).includes('Geheim'), short(r));
  r = await api('GET', `/search/suggest?q=${encodeURIComponent('Zu')}`);
  check('suggest returns venue prefix match', r.status === 200 && JSON.stringify(r.json).includes('Zum Goldenen Krug'), short(r));
  r = await api('GET', `/search/suggest?q=${encodeURIComponent('Stu')}`);
  check('suggest returns story', r.status === 200 && JSON.stringify(r.json).includes('Sturm, Teil 1'), short(r));
  r = await api('GET', '/search/suggest?q=Z');
  check('suggest with 1 char -> empty', r.status === 200 && (r.json || []).every((g) => !g.results?.length), short(r));
  r = await api('GET', `/search/suggest?q=${encodeURIComponent("%' OR 1=1 -- ")}`);
  check('suggest handles SQL wildcards', r.status === 200, short(r));

  // ── wiki ──
  section('Wiki');
  r = await api('POST', '/wiki', { token: T.aria, body: { characterId: 1, title: 'Hafen von Limsa', content: '<p>Version 1</p>', editPermission: 'everyone' } });
  expectStatus('create wiki page', r, 201);
  const wikiId = r.json?.id;
  r = await api('PUT', `/wiki/${wikiId}`, { token: T.aria, body: { characterId: 1, title: 'Hafen von Limsa', content: '<p>Version 2</p>', editPermission: 'everyone', changeNote: 'Zweite Fassung' } });
  expectStatus('edit wiki page', r, 200);
  r = await api('POST', '/wiki', { token: T.aria, body: { characterId: 1, title: 'Geheimer Entwurf', content: '<p>x</p>', editPermission: 'me', published: false } });
  expectStatus('create unpublished wiki page', r, 201);
  r = await api('POST', '/wiki', { token: T.otto, body: { characterId: 4, title: 'Nicht erlaubt', content: '<p>x</p>', editPermission: 'me' } });
  expectStatus('wiki create by non-trusted', r, 403);
  r = await api('GET', '/wiki');
  check('wiki list has published page only', r.status === 200 && r.json?.some((p) => p.title === 'Hafen von Limsa') && !r.json?.some((p) => p.title === 'Geheimer Entwurf'), short(r));
  r = await api('GET', `/wiki/${encodeURIComponent('Hafen von Limsa')}/mentions`);
  const mentionText = JSON.stringify(r.json);
  check('wiki mentions list the published stories, not drafts', r.status === 200 && mentionText.includes('Sturm, Teil 1') && !mentionText.includes('Geheimakte'), short(r));
  r = await api('GET', `/wiki/${encodeURIComponent('Hafen von Limsa')}/revisions`);
  check('two revisions, newest first', r.status === 200 && r.json?.length === 2 && r.json[0].id > r.json[1].id, short(r));
  const firstRev = r.json?.[1]?.id;
  r = await api('GET', `/wiki/${encodeURIComponent('Hafen von Limsa')}/revisions/${firstRev}`);
  check('revision detail content', r.status === 200 && r.json?.content?.includes('Version 1'), short(r));
  r = await api('POST', `/wiki/${encodeURIComponent('Hafen von Limsa')}/revisions/${firstRev}/restore`, { token: T.aria, body: { changeNote: 'zurück' } });
  check('restore -> 201 with new revision id', r.status === 201 && r.json?.id > firstRev, short(r));
  r = await api('GET', `/wiki/by-title/${encodeURIComponent('Hafen von Limsa')}`);
  check('page content restored', r.json?.content?.includes('Version 1'), short(r));
  r = await api('GET', `/wiki/${encodeURIComponent('Hafen von Limsa')}/revisions`);
  check('three revisions after restore', r.json?.length === 3, short(r));
  r = await api('GET', `/wiki/${encodeURIComponent('Geheimer Entwurf')}/revisions`);
  expectStatus('revisions of unpublished page anonymous', r, 404);

  // ── albums ──
  section('Albums');
  r = await api('POST', '/albums', { token: T.aria, body: { characterId: 1, title: 'Hafenbilder', description: 'Abende', coverImageId: 2, imageIds: [2, 3] } });
  expectStatus('create album', r, 201);
  const albumId = r.json?.id;
  r = await api('POST', '/albums', { token: T.aria, body: { characterId: 1, title: 'Fremd', imageIds: [4] } });
  check('album with foreign image -> 4xx', r.status >= 400 && r.status < 500, short(r));
  r = await api('GET', `/albums/${albumId}`);
  check('album detail', r.status === 200 && r.json?.title === 'Hafenbilder' && (r.json?.images?.length ?? r.json?.imageCount) >= 2, short(r));
  r = await api('PUT', `/albums/${albumId}/images`, { token: T.aria, body: { imageIds: [3] } });
  expectStatus('set album images', r, 200);
  r = await api('PUT', `/albums/${albumId}`, { token: T.aria, body: { title: 'Hafenbilder 2', coverImageId: null } });
  expectStatus('edit album', r, 200);
  r = await api('GET', '/albums?characterId=1');
  const alb = r.json?.find((a) => a.id === albumId);
  check('album list summary', r.status === 200 && alb?.title === 'Hafenbilder 2' && (alb?.imageCount === undefined || alb.imageCount === 1), JSON.stringify(alb));
  r = await api('PUT', `/albums/${albumId}`, { token: T.otto, body: { title: 'Gekapert' } });
  check('edit foreign album -> 403/404', r.status === 403 || r.status === 404, short(r));
  r = await api('DELETE', `/albums/${albumId}`, { token: T.aria });
  expectStatus('delete album', r, 200);
  const imgLeft = await sql('SELECT COUNT(*) AS n FROM image WHERE id IN (2, 3)');
  check('deleting album keeps images', imgLeft[0].n === 2, JSON.stringify(imgLeft));

  // ── image tags ──
  section('Image tags');
  r = await api('POST', '/images/2/tags', { token: T.aria, body: { characterId: 5 } });
  check('tag Cyra on Aria image -> pending', r.status === 201 && r.json?.status === 'pending', short(r));
  const tagId = r.json?.id;
  r = await api('POST', '/images/2/tags', { token: T.otto, body: { characterId: 4 } });
  expectStatus('tag on foreign image', r, 403);
  r = await api('POST', '/images/2/tags', { token: T.aria, body: { characterId: 2 } });
  const tagBranId = r.json?.id;
  check('tag Bran -> pending', r.status === 201, short(r));
  r = await api('POST', '/images/2/tags', { token: T.aria, body: { characterId: 1 } });
  check('self tag auto-approved', r.status === 201 && r.json?.status === 'approved', short(r));
  r = await api('GET', '/images/2');
  check('public image shows only approved tags', r.status === 200 && JSON.stringify(r.json?.taggedCharacters?.map((c) => c.id)) === '[1]', JSON.stringify(r.json?.taggedCharacters));
  r = await api('GET', '/images/tags/pending', { token: T.cyra });
  check('Cyra sees pending tag', r.status === 200 && r.json?.some((t) => t.id === tagId), short(r));
  r = await api('PUT', `/images/tags/${tagId}`, { token: T.otto, body: { status: 'approved' } });
  check('stranger cannot decide -> 403/404', r.status === 403 || r.status === 404, short(r));
  r = await api('PUT', `/images/tags/${tagId}`, { token: T.cyra, body: { status: 'approved' } });
  check('Cyra approves', r.status === 200 && r.json?.status === 'approved', short(r));
  r = await api('PUT', `/images/tags/${tagBranId}`, { token: T.bran, body: { status: 'declined' } });
  check('Bran declines', r.status === 200 && r.json?.status === 'declined', short(r));
  r = await api('GET', '/images/2');
  check('public tags = Aria + Cyra', JSON.stringify((r.json?.taggedCharacters || []).map((c) => c.id).sort()) === '[1,5]', JSON.stringify(r.json?.taggedCharacters));
  r = await api('POST', '/images/2/tags', { token: T.aria, body: { characterId: 2 } });
  check('re-tagging after decline -> 409', r.status === 409, short(r));
  r = await api('GET', '/notifications', { token: T.cyra });
  check('tag request notified Cyra', r.json?.some((n) => n.type === 'image-tag'), short(r));
  r = await api('DELETE', '/images/2/tags/5', { token: T.cyra });
  check('tagged owner removes tag', r.status === 200, short(r));

  // ── FC ──
  section('Free companies');
  r = await api('POST', '/free-companies/1/applications', { token: T.otto, body: { characterId: 4, message: 'Hallo!' } });
  expectStatus('apply to FC', r, 201);
  r = await api('POST', '/free-companies/1/applications', { token: T.otto, body: { characterId: 4 } });
  expectStatus('apply twice (idempotent)', r, 201);
  r = await api('POST', '/free-companies/3/applications', { token: T.otto, body: { characterId: 4 } });
  expectStatus('apply to unclaimed FC', r, 409);
  r = await api('POST', '/free-companies/1/applications', { token: T.bran, body: { characterId: 2 } });
  expectStatus('member applies to own FC', r, 409);
  r = await api('GET', '/free-companies/1/applications', { token: T.otto });
  expectStatus('non-manager lists applications', r, 403);
  r = await api('GET', '/free-companies/1/applications', { token: T.aria });
  check('leader lists applications', r.status === 200 && r.json?.length === 1 && r.json[0].message === 'Hallo!', short(r));
  const appId = r.json?.[0]?.id;
  r = await api('GET', '/free-companies/1?characterId=4', { token: T.otto });
  check('FC detail shows my application', r.status === 200 && r.json?.myApplicationStatus === 'pending' && r.json?.canApply === false, short(r));
  r = await api('POST', `/free-companies/1/applications/${appId}/accept`, { token: T.aria });
  expectStatus('accept application', r, 201);
  r = await api('POST', `/free-companies/1/applications/${appId}/reject`, { token: T.aria });
  expectStatus('decide twice', r, 409);
  r = await api('GET', '/free-companies/1/applications', { token: T.aria });
  check('application accepted with decider', r.json?.[0]?.status === 'accepted' && r.json[0].decidedBy === 'Aria Sonnenwind', short(r));
  r = await api('POST', '/free-companies/1/applications/withdraw', { token: T.otto, body: { characterId: 4 } });
  expectStatus('withdraw accepted application', r, 201);

  // ── group summaries (window functions) ──
  section('Group summaries');
  r = await api('POST', '/events', { token: T.bran, body: eventBody(2, 'FC-Abend', now + 2 * DAY) });
  const fcEventId = r.json?.id;
  r = await api('GET', '/free-companies');
  expectStatus('FC list', r, 200);
  const fc1 = r.json?.find((f) => f.id === 1);
  const fc2 = r.json?.find((f) => f.id === 2);
  check('FC memberCount=2', fc1?.memberCount === 2, JSON.stringify(fc1));
  check('FC memberAvatars skip hidden avatar', JSON.stringify(fc1?.memberAvatars) === JSON.stringify(['https://img.example.invalid/avatar-1.png']), JSON.stringify(fc1?.memberAvatars));
  check('FC nextEvent = earliest member event (20-min event by Bran)', fc1?.nextEvent?.id === soonEventId, JSON.stringify(fc1?.nextEvent));
  check('FC tag + recruiting', fc1?.tag === 'LICHT' && fc1?.recruiting === true, JSON.stringify(fc1));
  check('unclaimed FC not listed', !r.json?.some((f) => f.id === 3), 'FC 3 listed');
  check('empty FC: 0 members, no event', fc2?.memberCount === 0 && fc2?.memberAvatars?.length === 0 && fc2?.nextEvent === null, JSON.stringify(fc2));
  r = await api('GET', '/communities');
  expectStatus('community list', r, 200);
  const c1 = r.json?.find((c) => c.id === 1);
  const c2 = r.json?.find((c) => c.id === 2);
  check('community memberCount=2 (applied not counted)', c1?.memberCount === 2, JSON.stringify(c1));
  check('community memberAvatars', JSON.stringify(c1?.memberAvatars) === JSON.stringify(['https://img.example.invalid/avatar-1.png']), JSON.stringify(c1?.memberAvatars));
  check('community nextEvent', c1?.nextEvent?.id === soonEventId, JSON.stringify(c1?.nextEvent));
  check('empty community', c2?.memberCount === 0 && c2?.nextEvent === null, JSON.stringify(c2));
  // more than 3 members: avatars capped at 3, ordered most recently active first
  await sql(`INSERT INTO community_membership (status, canEdit, canManageMembers, characterId, communityId) VALUES
    ('confirmed', 0, 0, 3, 1), ('confirmed', 0, 0, 4, 1)`);
  await sql("UPDATE community_membership SET status = 'confirmed' WHERE characterId = 5 AND communityId = 1");
  // deterministic activity order: 4 newest, then 5, 3, 1; Bran (2) hides his avatar
  await sql(`UPDATE \`character\` SET updatedAt = CASE id WHEN 4 THEN '2026-01-05' WHEN 5 THEN '2026-01-04'
    WHEN 3 THEN '2026-01-03' WHEN 1 THEN '2026-01-02' ELSE '2026-01-06' END WHERE id IN (1, 2, 3, 4, 5)`);
  r = await api('GET', '/communities');
  const c1b = r.json?.find((c) => c.id === 1);
  check('community 5 members, 3 avatars, most recently active first', c1b?.memberCount === 5
    && JSON.stringify(c1b?.memberAvatars) === JSON.stringify([4, 5, 3].map((i) => `https://img.example.invalid/avatar-${i}.png`)), JSON.stringify(c1b));
  void fcEventId;

  // ── community permissions ──
  section('Community permissions');
  r = await api('GET', '/communities/1');
  const communityDto = r.json;
  check('community detail', r.status === 200 && communityDto?.name === 'Zirkel der Sterne', short(r));
  const editBody = { ...communityDto, goal: 'Gekapert', characterId: 4 };
  r = await api('PUT', '/communities/1', { token: T.otto, body: editBody });
  expectStatus('non-member edits community', r, 403);
  r = await api('PUT', '/communities/1', { token: T.bran, body: { ...communityDto, goal: 'Gekapert', characterId: 2 } });
  expectStatus('member without canEdit edits community', r, 403);
  r = await api('POST', '/communities/1/members/approve', { token: T.otto, body: { characterId: 5 } });
  expectStatus('non-member manages members', r, 403);
  r = await api('PUT', '/communities/1', { token: T.aria, body: { ...communityDto, goal: 'Sternkunde', characterId: 1 } });
  expectStatus('owner edits community', r, 200);
  const goal = await sql('SELECT goal FROM community WHERE id = 1');
  check('community goal changed by owner only', goal[0].goal === 'Sternkunde', JSON.stringify(goal));

  // ── characters lookup ──
  section('Characters lookup');
  r = await api('POST', '/characters/lookup', { body: { names: [{ name: 'aria sonnenwind' }, { name: 'Mila Mondlicht', server: 'Phoenix' }, { name: 'Niemand Hier' }, { name: 'Bran Eisenfaust', server: 'Phoenix' }] } });
  check('lookup finds case-insensitive + server-qualified, skips unknown', r.status === 201 && r.json?.length === 2
    && r.json.some((c) => c.query === 'aria sonnenwind' && c.name === 'Aria Sonnenwind' && c.link)
    && r.json.some((c) => c.name === 'Mila Mondlicht'), short(r));
  r = await api('POST', '/characters/lookup', { body: { names: Array.from({ length: 51 }, (_, i) => ({ name: `N${i}` })) } });
  expectStatus('lookup > 50 names', r, 400);

  // ── bookmarks + calendar token ──
  section('Bookmarks + calendar');
  r = await api('PUT', '/bookmarks', { token: T.mila, body: { targetType: 'event', targetId: openEventId } });
  check('bookmark event', r.status === 200 && r.json?.bookmarked === true, short(r));
  r = await api('PUT', '/bookmarks', { token: T.mila, body: { targetType: 'story', targetId: s3 } });
  check('bookmark story', r.status === 200, short(r));
  r = await api('PUT', '/bookmarks', { token: T.mila, body: { targetType: 'venue', targetId: 1 } });
  r = await api('PUT', '/bookmarks', { token: T.mila, body: { targetType: 'story', targetId: s4 } });
  check('bookmark a foreign draft -> 404', r.status === 404, short(r));
  r = await api('PUT', '/bookmarks', { token: T.mila, body: { targetType: 'event', targetId: 99999 } });
  check('bookmark missing target -> 404', r.status === 404, short(r));
  r = await api('GET', '/bookmarks', { token: T.mila });
  check('bookmark list resolves titles', r.status === 200 && r.json?.length === 3 && r.json.every((b) => b.available && b.title), short(r));
  r = await api('GET', `/bookmarks/status?targetType=event&targetId=${openEventId}`, { token: T.mila });
  check('bookmark status', r.json?.bookmarked === true, short(r));
  r = await api('POST', `/events/${closedEventId}/registrations`, { token: T.mila, body: { characterId: 3, kind: 'going' } });
  r = await api('POST', '/calendar-token', { token: T.mila });
  check('create calendar token', r.status === 201 && /\/calendar\/[^/]+\.ics$/.test(r.json?.url || ''), short(r));
  const feedPath = (r.json?.url || '').replace(/^.*\/api\/internal/, '');
  r = await api('GET', feedPath);
  check('public feed has bookmarked + registered events', r.status === 200 && r.text.includes('Hafenfest') && r.text.includes('Geschlossene Gesellschaft'), short(r));
  r = await api('GET', '/calendar/notavalidtoken.ics');
  expectStatus('feed with bad token', r, 404);
  r = await api('POST', '/calendar-token', { token: T.mila });
  const rotated = (r.json?.url || '').replace(/^.*\/api\/internal/, '');
  r = await api('GET', feedPath);
  check('rotation invalidates old token', r.status === 404 && rotated !== feedPath, short(r));
  r = await api('DELETE', '/calendar-token', { token: T.mila });
  check('revoke token', r.status === 200, short(r));
  r = await api('GET', rotated);
  expectStatus('feed after revoke', r, 404);
  r = await api('DELETE', `/bookmarks/event/${openEventId}`, { token: T.mila });
  check('remove bookmark', r.status === 200, short(r));

  // ── noticeboard ──
  section('Noticeboard');
  r = await api('PUT', '/noticeboard/1/pinned', { token: T.aria, body: { pinned: true } });
  expectStatus('pin as non-moderator', r, 403);
  r = await api('PUT', '/noticeboard/1/pinned', { token: T.mila, body: { pinned: true } });
  expectStatus('pin as moderator', r, 200);
  r = await api('GET', '/noticeboard');
  check('pinned old item first, then newest', r.status === 200 && JSON.stringify(r.json?.slice(0, 2).map((n) => n.id)) === '[1,2]' && r.json[0].pinned === true, JSON.stringify(r.json?.map((n) => [n.id, n.pinned])));
  r = await api('PUT', '/noticeboard/1/pinned', { token: T.mila, body: { pinned: false } });
  r = await api('GET', '/noticeboard');
  check('unpinned -> newest first', JSON.stringify(r.json?.slice(0, 2).map((n) => n.id)) === '[2,1]', JSON.stringify(r.json?.map((n) => n.id)));

  // ── changes feed ──
  section('Changes feed');
  r = await api('GET', '/changes?limit=50');
  expectStatus('changes', r, 200);
  const items = r.json?.data || [];
  check('changes contain items', items.length > 0, short(r));
  const withAuthor = items.filter((i) => i.author === 'Aria Sonnenwind');
  check('changes items by Aria carry authorAvatar', withAuthor.length > 0 && withAuthor.every((i) => i.authorAvatar === 'https://img.example.invalid/avatar-1.png'), JSON.stringify(withAuthor.slice(0, 3)));
  check('changes hide drafts', !items.some((i) => i.title === 'Geheimer Entwurf' || i.title === 'Geheimakte Sturm'), 'draft listed');

  // ── misc ──
  section('Misc');
  r = await api('GET', '/characters?limit=10');
  check('character list', r.status === 200, short(r));
  r = await api('GET', '/main-page');
  check('main page', r.status === 200, short(r));
  r = await api('GET', '/venues/1', { token: T.aria });
  check('venue detail', r.status === 200 && r.json?.name === 'Zum Goldenen Krug', short(r));
  r = await api('GET', '/statistics');
  check('statistics', r.status === 200, short(r));
}

async function finish(code) {
  const failed = results.filter((x) => !x.ok);
  console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
  if (failed.length) {
    console.log('\nFailures:');
    failed.forEach((f) => console.log(`  [${f.section}] ${f.name}: ${f.detail}`));
  }
  if (process.env.RESULTS_JSON) {
    (await import('node:fs')).writeFileSync(process.env.RESULTS_JSON, JSON.stringify(results, null, 2));
  }
  if (conn) conn.end();
  if (serverProc) {
    const errors = serverProc.logLines.join('').split('\n').filter((l) => /ERROR/.test(l) && !/Steward|38112|ECONNREFUSED/.test(l));
    if (errors.length) console.log(`\nServer ERROR lines (${errors.length}):\n${errors.slice(0, 30).join('\n')}`);
    serverProc.kill();
  }
  process.exit(code || (failed.length ? 1 : 0));
}

main().then(() => finish(0)).catch((e) => {
  console.error(e);
  finish(2);
});
