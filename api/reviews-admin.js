// Private moderation for Andrew. Requires the REVIEWS_ADMIN_KEY (sent in the x-admin-key header).
// GET  -> all reviews, including hidden ones
// POST { id, action: "hide" | "show" | "delete" }
import { timingSafeEqual } from "node:crypto";
import { listReviews, updateReview, deleteReview } from "./_store.js";

function authorized(req) {
  const expected = process.env.REVIEWS_ADMIN_KEY || "";
  const given = String(req.headers["x-admin-key"] || "");
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!authorized(req)) return res.status(401).json({ error: "Not authorized" });
  try {
    if (req.method === "GET") {
      return res.status(200).json({ reviews: await listReviews({ includeHidden: true }) });
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const id = String(body.id || "");
      if (!/^\d+-[a-f0-9]{8}$/.test(id)) return res.status(400).json({ error: "Bad review id" });
      if (body.action === "delete") { await deleteReview(id); return res.status(200).json({ ok: true }); }
      if (body.action === "hide" || body.action === "show") {
        const updated = await updateReview(id, { hidden: body.action === "hide" });
        return updated ? res.status(200).json({ ok: true, review: updated }) : res.status(404).json({ error: "Not found" });
      }
      return res.status(400).json({ error: "Unknown action" });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("reviews admin", err);
    return res.status(500).json({ error: "Server error" });
  }
}
