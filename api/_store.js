// Review storage on a private Vercel Blob store: one JSON file per review.
import { put, get, list, del } from "@vercel/blob";
import { createHash, randomBytes } from "node:crypto";

const PREFIX = "reviews/";
const LIMIT_PREFIX = "ratelimit/";

async function readJson(pathname) {
  const res = await get(pathname, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return null;
  return JSON.parse(await new Response(res.stream).text());
}

async function writeJson(pathname, data) {
  await put(pathname, JSON.stringify(data), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function listReviews({ includeHidden = false } = {}) {
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const reviews = (await Promise.all(blobs.map((b) => readJson(b.pathname).catch(() => null)))).filter(Boolean);
  return reviews
    .filter((r) => includeHidden || !r.hidden)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function saveReview(review) {
  const id = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const record = { id, ...review, hidden: false, createdAt: new Date().toISOString() };
  await writeJson(`${PREFIX}${id}.json`, record);
  return record;
}

export async function updateReview(id, changes) {
  const pathname = `${PREFIX}${id}.json`;
  const current = await readJson(pathname);
  if (!current) return null;
  const next = { ...current, ...changes };
  await writeJson(pathname, next);
  return next;
}

export async function deleteReview(id) {
  await del(`${PREFIX}${id}.json`);
}

// At most `max` reviews per visitor per day. The IP is hashed, never stored.
export async function allowSubmission(ip, max = 3) {
  const day = new Date().toISOString().slice(0, 10);
  const key = createHash("sha256").update(`${ip}|${day}|mbf-reviews`).digest("hex").slice(0, 32);
  const pathname = `${LIMIT_PREFIX}${day}/${key}.json`;
  const current = (await readJson(pathname).catch(() => null)) || { count: 0 };
  if (current.count >= max) return false;
  await writeJson(pathname, { count: current.count + 1 });
  return true;
}
