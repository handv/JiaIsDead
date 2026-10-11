const SID_KEY = 'jia-clan-sid';
const LID_KEY = 'jia-clan-lid';
const ALLOWED = new Set([
  'session_start',
  'notes_open',
  'notes_new',
  'excerpt_open',
  'excerpt_add',
  'excerpt_remove',
  'excerpt_clear',
  'excerpt_cite',
  'excerpt_to_archive',
]);

/** @type {string | null} */
let sessionId = null;
/** @type {string | null} */
let localId = null;

function newId(prefix) {
  return crypto.randomUUID?.() ?? `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function ensureSession() {
  if (sessionId) return sessionId;
  try {
    const stored = sessionStorage.getItem(SID_KEY);
    if (stored) {
      sessionId = stored;
      return sessionId;
    }
  } catch {
    /* private mode */
  }
  sessionId = newId('s');
  try {
    sessionStorage.setItem(SID_KEY, sessionId);
  } catch {
    /* ignore */
  }
  return sessionId;
}

function ensureLocalId() {
  if (localId) return localId;
  if (typeof window === 'undefined') return '';
  try {
    const stored = localStorage.getItem(LID_KEY);
    if (stored) {
      localId = stored;
      return localId;
    }
  } catch {
    /* private mode */
  }
  localId = newId('l');
  try {
    localStorage.setItem(LID_KEY, localId);
  } catch {
    /* ignore */
  }
  return localId;
}

function touchFlag() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 0;
  return window.matchMedia('(pointer: coarse)').matches ? 1 : 0;
}

function clip(value, max = 48) {
  return String(value ?? '').slice(0, max);
}

/**
 * Fire-and-forget usage event (same shape as xie-clan → /api/event → Analytics Engine).
 * On GitHub Pages the POST fails silently until the site is served with the Pages Function.
 * @param {string} event
 * @param {{
 *   caseKind?: 'main'|'garden'|'',
 *   screen?: string,
 *   detail?: string,
 *   n?: number,
 *   notesN?: number,
 *   excerptsN?: number,
 * }} [props]
 */
export function track(event, props = {}) {
  if (typeof window === 'undefined' || !ALLOWED.has(event)) return;
  const body = JSON.stringify({
    event,
    sid: ensureSession(),
    lid: ensureLocalId(),
    case_kind: clip(props.caseKind ?? '', 16),
    screen: clip(props.screen ?? '', 48),
    touch: touchFlag(),
    detail: clip(props.detail ?? '', 48),
    n: Number(props.n) || 0,
    notes_n: Number(props.notesN) || 0,
    excerpts_n: Number(props.excerptsN) || 0,
  });
  const url = new URL('api/event', window.location.href).href;
  try {
    const blob = new Blob([body], { type: 'application/json' });
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url, blob)) return;
  } catch {
    /* fall through */
  }
  try {
    fetch(url, {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function trackSessionStart() {
  track('session_start', { detail: touchFlag() ? 'touch' : 'mouse' });
}

export const TELEMETRY_EVENTS = [...ALLOWED];
