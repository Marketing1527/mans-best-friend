// POST /api/track  { type: "pageview" | "click", path, ref, utm, label, w }
// Sent by assets/js/track.js with navigator.sendBeacon. Always answers 204.
import { recordEvent, classifySource, visitorId } from "./_analytics.js";

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|axios/i;
const clip = (v, n) => String(v ?? "").replace(/[\u0000-\u001f]/g, "").slice(0, n);

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).end(); }
  try {
    const ua = String(req.headers["user-agent"] || "");
    if (!ua || BOT.test(ua)) return res.status(204).end();
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const type = body.type === "click" ? "click" : "pageview";
    let path = clip(body.path, 120) || "/";
    if (!path.startsWith("/")) path = "/";
    if (/^\/(admin|reviews-admin)/.test(path)) return res.status(204).end();
    path = path.replace(/\.html$/, "").replace(/^\/index$/, "/") || "/";

    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    const ts = new Date().toISOString();
    await recordEvent({
      type,
      ts,
      path,
      label: type === "click" ? clip(body.label, 60) || "Click" : null,
      source: classifySource({ ref: clip(body.ref, 300), utmSource: clip(body.utm, 40), host: String(req.headers.host || "") }),
      device: Number(body.w) > 0 && Number(body.w) < 768 ? "Phone" : Number(body.w) < 1100 ? "Tablet" : "Desktop",
      visitor: visitorId(ip, ua, ts.slice(0, 10)),
    });
  } catch (err) {
    console.error("track", err);
  }
  return res.status(204).end();
}
