// Admin login and analytics data for /admin.
// POST /api/admin?action=login   { email, password }  -> sets a signed, httpOnly session cookie
// POST /api/admin?action=logout
// GET  /api/admin?action=stats&days=30                -> rollups (requires session)
// Config (Vercel env): ADMIN_EMAIL, ADMIN_PASSWORD_HASH (scrypt, set with tools/set-admin-password.mjs), ADMIN_SESSION_SECRET
import { createHmac, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { readRange } from "./_analytics.js";
import { put, get } from "@vercel/blob";

const COOKIE = "mbf_admin";
const WEEK = 7 * 24 * 3600;

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
function sign(value) {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET || "").update(value).digest("base64url");
}
function makeSession() {
  const exp = Math.floor(Date.now() / 1000) + WEEK;
  const payload = `${exp}`;
  return `${payload}.${sign(payload)}`;
}
function validSession(req) {
  if (!process.env.ADMIN_SESSION_SECRET) return false;
  const m = String(req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [exp, sig] = decodeURIComponent(m[1]).split(".");
  return !!exp && !!sig && safeEqual(sig, sign(exp)) && Number(exp) > Date.now() / 1000;
}
function checkPassword(password) {
  // stored as scrypt$<saltB64>$<hashB64>
  const [kind, salt, hash] = String(process.env.ADMIN_PASSWORD_HASH || "").split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const got = scryptSync(String(password), Buffer.from(salt, "base64"), 64).toString("base64");
  return safeEqual(got, hash);
}
// Slow down guessing: at most 8 failed logins per IP per hour.
async function tooManyFailures(ip, addFailure) {
  const hour = new Date().toISOString().slice(0, 13);
  const key = createHash("sha256").update(`${ip}|${hour}|mbf-admin`).digest("hex").slice(0, 24);
  const pathname = `ratelimit/admin/${hour}/${key}.json`;
  let count = 0;
  try {
    const r = await get(pathname, { access: "private", useCache: false });
    if (r && r.statusCode === 200) count = JSON.parse(await new Response(r.stream).text()).count || 0;
  } catch {}
  if (addFailure) {
    count += 1;
    await put(pathname, JSON.stringify({ count }), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true });
  }
  return count >= 8;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const action = String(req.query?.action || "");
  const secure = String(req.headers["x-forwarded-proto"] || "https") === "https";
  const cookieBase = `Path=/; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
  try {
    if (action === "login" && req.method === "POST") {
      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
      if (await tooManyFailures(ip, false)) return res.status(429).json({ error: "Too many attempts. Try again in an hour." });
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const emailOk = safeEqual(String(body.email || "").trim().toLowerCase(), String(process.env.ADMIN_EMAIL || "").trim().toLowerCase());
      const passOk = checkPassword(body.password || "");
      if (!emailOk || !passOk || !process.env.ADMIN_SESSION_SECRET) {
        await tooManyFailures(ip, true);
        return res.status(401).json({ error: "Email or password is incorrect." });
      }
      res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(makeSession())}; Max-Age=${WEEK}; ${cookieBase}`);
      return res.status(200).json({ ok: true });
    }
    if (action === "logout" && req.method === "POST") {
      res.setHeader("Set-Cookie", `${COOKIE}=; Max-Age=0; ${cookieBase}`);
      return res.status(200).json({ ok: true });
    }
    if (action === "stats" && req.method === "GET") {
      if (!validSession(req)) return res.status(401).json({ error: "Not signed in" });
      const days = Math.min(90, Math.max(1, Number(req.query?.days) || 30));
      const rows = await readRange(days);
      return res.status(200).json({ days, rows });
    }
    if (action === "session") return res.status(200).json({ signedIn: validSession(req) });
    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    console.error("admin api", err);
    return res.status(500).json({ error: "Server error" });
  }
}
