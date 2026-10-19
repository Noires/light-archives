// Minimal Chrome DevTools Protocol driver for headless Edge/Chrome.
// No dependencies: Node 22+ built-in fetch and WebSocket.
// Used by a11y-audit.mjs and interactions.mjs in this folder.
import { spawn, execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const DEFAULT_BROWSER = process.env.E2E_BROWSER
  || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
export const DEFAULT_BASE = process.env.E2E_BASE || 'http://localhost:8095';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Parses `--key value` and `--flag` arguments. */
export function parseArgs(argv = process.argv.slice(2)) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      continue;
    }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[arg.slice(2)] = true;
    } else {
      out[arg.slice(2)] = next;
      i++;
    }
  }
  return out;
}

/**
 * Starts a headless browser and connects to its first page target.
 * Returns helpers bound to that page.
 */
export async function launch({ browser = DEFAULT_BROWSER, width = 1440, height = 1000 } = {}) {
  const port = 9400 + Math.floor(Math.random() * 500);
  const profile = join(tmpdir(), `e2e-profile-${port}-${Date.now()}`);
  const proc = spawn(browser, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    'about:blank',
  ], { stdio: 'ignore' });

  let closed = false;
  const kill = () => {
    if (closed) {
      return;
    }
    closed = true;
    try {
      execSync(`taskkill /PID ${proc.pid} /T /F`, { stdio: 'ignore' });
    } catch {
      try {
        proc.kill('SIGKILL');
      } catch {
        // already gone
      }
    }
    try {
      if (existsSync(profile)) {
        rmSync(profile, { recursive: true, force: true });
      }
    } catch {
      // profile still locked; harmless temp folder
    }
  };
  process.on('exit', kill);
  process.on('SIGINT', () => {
    kill();
    process.exit(130);
  });

  let wsUrl = null;
  for (let i = 0; i < 80 && !wsUrl; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      wsUrl = targets.find((t) => t.type === 'page')?.webSocketDebuggerUrl || null;
    } catch {
      // not up yet
    }
    if (!wsUrl) {
      await sleep(250);
    }
  }
  if (!wsUrl) {
    kill();
    throw new Error('DevTools endpoint not reachable');
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let seq = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method && listeners.has(msg.method)) {
      for (const fn of listeners.get(msg.method)) {
        fn(msg.params);
      }
    }
  });

  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

  const on = (method, fn) => {
    if (!listeners.has(method)) {
      listeners.set(method, new Set());
    }
    listeners.get(method).add(fn);
    return () => listeners.get(method).delete(fn);
  };

  /** Evaluates an expression in the page and returns its JSON value. Throws on page exceptions. */
  const evaluate = async (expression, { timeout = 60000 } = {}) => {
    const res = await Promise.race([
      send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }),
      sleep(timeout).then(() => ({ error: { message: `evaluate timeout after ${timeout} ms` } })),
    ]);
    if (res.error) {
      throw new Error(res.error.message);
    }
    if (res.result?.exceptionDetails) {
      const d = res.result.exceptionDetails;
      throw new Error(d.exception?.description || d.text || 'page exception');
    }
    return res.result?.result?.value;
  };

  const setViewport = async (w, h = 1000) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: 1,
      mobile: w < 600,
    });
  };

  /** Resolves when the page has rendered and stopped showing loaders (or the timeout hits). */
  const settle = async ({ min = 1500, max = 12000 } = {}) => {
    const start = Date.now();
    await sleep(min);
    let stable = 0;
    let lastLen = -1;
    while (Date.now() - start < max) {
      let state;
      try {
        state = await evaluate(`(() => ({
          ready: document.readyState,
          loading: !!document.querySelector('.q-loading, .q-inner-loading, .q-skeleton, .q-linear-progress--indeterminate'),
          len: document.body ? document.body.innerHTML.length : 0,
        }))()`, { timeout: 5000 });
      } catch {
        state = { ready: 'loading', loading: true, len: -1 };
      }
      if (state.ready === 'complete' && !state.loading && state.len === lastLen) {
        stable++;
        if (stable >= 2) {
          return true;
        }
      } else {
        stable = 0;
      }
      lastLen = state.len;
      await sleep(400);
    }
    return false;
  };

  const navigate = async (url, opts) => {
    await send('Page.navigate', { url });
    return settle(opts);
  };

  // ---- input -------------------------------------------------------------

  const KEYS = {
    Tab: { code: 'Tab', keyCode: 9 },
    Enter: { code: 'Enter', keyCode: 13, text: '\r' },
    Escape: { code: 'Escape', keyCode: 27 },
    ArrowDown: { code: 'ArrowDown', keyCode: 40 },
    ArrowUp: { code: 'ArrowUp', keyCode: 38 },
    ArrowLeft: { code: 'ArrowLeft', keyCode: 37 },
    ArrowRight: { code: 'ArrowRight', keyCode: 39 },
    Home: { code: 'Home', keyCode: 36 },
    End: { code: 'End', keyCode: 35 },
    ' ': { code: 'Space', keyCode: 32, text: ' ' },
    Shift: { code: 'ShiftLeft', keyCode: 16 },
  };
  const MODIFIERS = { alt: 1, ctrl: 2, meta: 4, shift: 8 };

  /** Presses one key. `key` is a DOM key name or a single character; modifiers e.g. ['ctrl']. */
  const press = async (key, modifiers = []) => {
    const mask = modifiers.reduce((m, k) => m | (MODIFIERS[k] || 0), 0);
    let def = KEYS[key];
    if (!def && key.length === 1) {
      const upper = key.toUpperCase();
      def = { code: /[a-z]/i.test(key) ? `Key${upper}` : '', keyCode: upper.charCodeAt(0), text: key };
    }
    const base = {
      key,
      code: def.code,
      windowsVirtualKeyCode: def.keyCode,
      nativeVirtualKeyCode: def.keyCode,
      modifiers: mask,
    };
    const withText = def.text && !(mask & (MODIFIERS.ctrl | MODIFIERS.meta | MODIFIERS.alt));
    await send('Input.dispatchKeyEvent', { ...base, type: withText ? 'keyDown' : 'rawKeyDown', text: withText ? def.text : undefined });
    await send('Input.dispatchKeyEvent', { ...base, type: 'keyUp' });
  };

  const type = async (text) => {
    for (const ch of text) {
      await press(ch);
      await sleep(20);
    }
  };

  const click = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  };

  /** Scrolls the first match into view and clicks its centre. Returns false if not found. */
  const clickSelector = async (selector) => {
    const rect = await evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    if (!rect) {
      return false;
    }
    await sleep(150);
    await click(rect.x, rect.y);
    return true;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await setViewport(width, height);

  return {
    send,
    on,
    evaluate,
    setViewport,
    settle,
    navigate,
    press,
    type,
    click,
    clickSelector,
    close() {
      try {
        ws.close();
      } catch {
        // ignore
      }
      kill();
    },
    pid: proc.pid,
  };
}

/** Declines the telemetry consent dialog if it is shown. */
export async function dismissConsent(page) {
  return page.evaluate(`(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /^\\s*ablehnen\\s*$/i.test(b.textContent));
    if (btn) { btn.click(); return true; }
    return false;
  })()`);
}

/** Stores the theme mode the app reads on boot (Quasar LocalStorage format). Takes effect on next load. */
export async function storeTheme(page, theme) {
  return page.evaluate(`localStorage.setItem('themeMode', '__q_strn|${theme}'); true`);
}

/** Loads the base URL once, declines consent and stores the theme. */
export async function prepare(page, base, theme) {
  await page.navigate(`${base}/`, { min: 2500, max: 20000 });
  await dismissConsent(page);
  await storeTheme(page, theme);
}
