/**
 * Cloudflare Pages Function → Analytics Engine.
 * Bind ANALYTICS (dataset jia_clan_events) in the Pages project / wrangler.jsonc.
 *
 * blobs: [event, case_kind, screen, touch, lid, detail]
 * doubles: [n, notes_n, excerpts_n]
 * indexes: [sid]
 */

const EVENTS = new Set([
  'session_start',
  'game_enter',
  'garden_enter',
  'notes_open',
  'notes_new',
  'excerpt_open',
  'excerpt_add',
  'excerpt_remove',
  'excerpt_clear',
  'excerpt_cite',
  'excerpt_to_archive',
]);

const MAX_BODY = 4096;

function json(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
  });
}

function clip(value, max) {
  return typeof value === 'string' && value.length <= max ? value : String(value ?? '').slice(0, max);
}

export async function onRequestPost(context) {
  let raw;
  try {
    raw = await context.request.text();
  } catch {
    return json(400, { ok: false });
  }
  if (!raw || raw.length > MAX_BODY) return json(400, { ok: false });

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return json(400, { ok: false });
  }

  const event = typeof data?.event === 'string' ? data.event : '';
  if (!EVENTS.has(event)) return json(400, { ok: false });

  const sid = typeof data.sid === 'string' && data.sid.length <= 64 ? data.sid : 'anon';
  const lid = typeof data.lid === 'string' && data.lid.length <= 64 ? data.lid : '';
  const caseKind = clip(data.case_kind, 16);
  const screen = clip(data.screen, 48);
  const touch = Number(data.touch) === 1 ? 1 : 0;
  const detail = clip(data.detail, 48);
  const n = Math.max(0, Math.min(999, Number(data.n) || 0));
  const notesN = Math.max(0, Math.min(999, Number(data.notes_n) || 0));
  const excerptsN = Math.max(0, Math.min(999, Number(data.excerpts_n) || 0));

  try {
    context.env.ANALYTICS?.writeDataPoint({
      blobs: [event, caseKind, screen, String(touch), lid, detail],
      doubles: [n, notesN, excerptsN],
      indexes: [sid],
    });
  } catch {
    /* binding missing in local/preview without setup */
  }

  return new Response(null, { status: 204 });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
    },
  });
}
