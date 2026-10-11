import { afterEach, describe, expect, it, vi } from 'vitest';
import { TELEMETRY_EVENTS, track } from './telemetry.js';

function memoryStore() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe('telemetry', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('exports the notes/excerpt event set', () => {
    expect(TELEMETRY_EVENTS).toContain('notes_open');
    expect(TELEMETRY_EVENTS).toContain('excerpt_add');
    expect(TELEMETRY_EVENTS).toContain('excerpt_cite');
  });

  it('posts allowed events and ignores unknown ones', () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    const store = memoryStore();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', { maxTouchPoints: 0 });
    vi.stubGlobal('window', {
      location: { href: 'https://example.test/jia/' },
      matchMedia: () => ({ matches: false }),
    });
    vi.stubGlobal('sessionStorage', store);
    vi.stubGlobal('localStorage', store);
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' });

    track('not_a_real_event', { n: 1 });
    expect(fetchMock).not.toHaveBeenCalled();

    track('excerpt_add', {
      caseKind: 'garden',
      screen: 'G01',
      detail: 'new',
      n: 1,
      notesN: 2,
      excerptsN: 3,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/api\/event$/);
    expect(init.method).toBe('POST');
    const payload = JSON.parse(init.body);
    expect(payload.event).toBe('excerpt_add');
    expect(payload.case_kind).toBe('garden');
    expect(payload.excerpts_n).toBe(3);
  });
});
