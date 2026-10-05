// GET  /api/reviews  -> published reviews for the homepage
// POST /api/reviews  -> submit a review from /review (published immediately)
import { listReviews, saveReview, allowSubmission } from "./_store.js";

const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const hasLink = (s) => /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|ru|xyz|info|biz)\b)/i.test(s);

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const reviews = (await listReviews()).slice(0, 60).map(({ id, name, dog, rating, comment, createdAt }) => ({ id, name, dog, rating, comment, createdAt }));
      res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=300");
      return res.status(200).json({ reviews });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      // Spam traps: hidden field must stay empty, and a person takes more than a few seconds.
      if (clean(body.website, 100)) return res.status(200).json({ ok: true });
      if (Number(body.elapsed) > 0 && Number(body.elapsed) < 4000) return res.status(400).json({ error: "Please take a moment and try again." });

      const name = clean(body.name, 60);
      const dog = clean(body.dog, 40);
      const comment = clean(body.comment, 1200);
      const rating = Number(body.rating);

      if (name.length < 2) return res.status(400).json({ error: "Please add your name." });
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: "Please choose a star rating." });
      if (comment.length < 10) return res.status(400).json({ error: "Please write a few words about your dog's stay." });
      if (hasLink(comment) || hasLink(name) || hasLink(dog)) return res.status(400).json({ error: "Please leave out web links." });

      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
      if (!(await allowSubmission(ip))) return res.status(429).json({ error: "Thanks! We've already received your review today." });

      const review = await saveReview({ name, dog, rating, comment });
      return res.status(201).json({ ok: true, id: review.id });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("reviews api", err);
    return res.status(500).json({ error: "Something went wrong saving your review. Please try again." });
  }
}
