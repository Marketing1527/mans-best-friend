// Privacy-friendly analytics on the private Blob store.
// Each event is written as its own small file (no write conflicts, nothing lost under bursts).
// When the dashboard loads, finished days are rolled up into one summary file and their raw
// events are deleted, so reads stay fast. No cookies for visitors; IPs are hashed per day.
import { put, get, list, del } from "@vercel/blob";
import { createHash, randomBytes } from "node:crypto";

const EVENTS = "analytics/events/";
const DAYS = "analytics/days/";
const RECENT_MAX = 150;

const today = () => new Date().toISOString().slice(0, 10);
const bump = (obj, key, n = 1) => { obj[key] = (obj[key] || 0) + n; };

async function readJson(pathname) {
  const res = await get(pathname, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return null;
  return JSON.parse(await new Response(res.stream).text());
}

async function listAll(prefix) {
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

export function classifySource({ ref, utmSource, host }) {
  if (utmSource) return utmSource.toLowerCase().slice(0, 40);
  if (!ref) return "Direct";
  let h = "";
  try { h = new URL(ref).hostname.replace(/^www\./, ""); } catch { return "Direct"; }
  if (!h || h === host || h.endsWith("mansbestfriendmiami.com")) return "Internal";
  if (/google\./.test(h)) return "Google";
  if (/bing\.com|duckduckgo|yahoo\./.test(h)) return "Other search";
  if (/instagram\./.test(h)) return "Instagram";
  if (/facebook\.|fb\.com|messenger/.test(h)) return "Facebook";
  if (/nextdoor\./.test(h)) return "Nextdoor";
  if (/yelp\./.test(h)) return "Yelp";
  if (/chatgpt|openai|perplexity|claude\.ai|gemini/.test(h)) return "AI assistant";
  return h.slice(0, 60);
}

export function visitorId(ip, ua, date) {
  return createHash("sha256").update(`${ip}|${ua}|${date}|mbf-analytics`).digest("hex").slice(0, 16);
}

export async function recordEvent(evt) {
  const date = evt.ts.slice(0, 10);
  const name = `${EVENTS}${date}/${evt.ts.replace(/[:.]/g, "")}-${randomBytes(4).toString("hex")}.json`;
  await put(name, JSON.stringify(evt), { access: "private", contentType: "application/json", addRandomSuffix: false });
}

function rollup(date, events) {
  const day = { date, pageviews: 0, visitors: [], pages: {}, sources: {}, devices: {}, clicks: {}, recent: [] };
  const seen = new Set();
  for (const e of events) {
    if (e.type === "pageview") {
      day.pageviews += 1;
      seen.add(e.visitor);
      bump(day.pages, e.path); bump(day.sources, e.source); bump(day.devices, e.device);
    } else if (e.type === "click") {
      bump(day.clicks, e.label);
    }
  }
  day.visitors = seen.size;
  day.recent = events
    .slice()
    .sort((a, b) => (a.ts < b.ts ? 1 : -1))
    .slice(0, RECENT_MAX)
    .map(({ ts, type, path, source, device, label }) => ({ ts, type, path, source, device, label: label || null }));
  return day;
}

function merge(a, b) {
  if (!a) return b; if (!b) return a;
  const out = { date: a.date, pageviews: a.pageviews + b.pageviews, visitors: a.visitors + b.visitors, pages: { ...a.pages }, sources: { ...a.sources }, devices: { ...a.devices }, clicks: { ...a.clicks } };
  for (const k of ["pages", "sources", "devices", "clicks"]) for (const [x, n] of Object.entries(b[k])) bump(out[k], x, n);
  out.recent = [...a.recent, ...b.recent].sort((x, y) => (x.ts < y.ts ? 1 : -1)).slice(0, RECENT_MAX);
  return out;
}

export async function readRange(daysBack) {
  const want = [];
  for (let i = 0; i < daysBack; i++) want.push(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const wantSet = new Set(want);
  const [eventBlobs, dayBlobs] = await Promise.all([listAll(EVENTS), listAll(DAYS)]);

  const eventsByDay = {};
  for (const b of eventBlobs) {
    const d = b.pathname.slice(EVENTS.length, EVENTS.length + 10);
    (eventsByDay[d] = eventsByDay[d] || []).push(b);
  }
  const haveDay = new Set(dayBlobs.map((b) => b.pathname.slice(DAYS.length, -5)));
  const now = today();

  // Roll up finished days that still have raw events (even outside the range, to keep storage tidy).
  for (const [d, blobs] of Object.entries(eventsByDay)) {
    if (d >= now) continue;
    const events = (await Promise.all(blobs.map((b) => readJson(b.pathname).catch(() => null)))).filter(Boolean);
    const existing = haveDay.has(d) ? await readJson(`${DAYS}${d}.json`).catch(() => null) : null;
    const merged = merge(existing, rollup(d, events));
    await put(`${DAYS}${d}.json`, JSON.stringify(merged), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true });
    await del(blobs.map((b) => b.url));
    haveDay.add(d);
    delete eventsByDay[d];
  }

  const rows = [];
  for (const d of want) {
    if (!wantSet.has(d)) continue;
    let row = haveDay.has(d) ? await readJson(`${DAYS}${d}.json`).catch(() => null) : null;
    if (d === now && eventsByDay[d]) {
      const events = (await Promise.all(eventsByDay[d].map((b) => readJson(b.pathname).catch(() => null)))).filter(Boolean);
      row = merge(row, rollup(d, events));
    }
    if (row) rows.push(row);
  }
  return rows.sort((a, b) => (a.date < b.date ? -1 : 1));
}
