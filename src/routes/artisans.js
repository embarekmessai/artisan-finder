const express = require("express");
const db = require("../config/database");

const router = express.Router();

router.get("/", (req, res) => {
  const city = String(req.query.city || "").trim();
  const category = String(req.query.category || "").trim();

  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit, 10) || 50, 1),
    100
  );

  const offset = Math.max(
    Number.parseInt(req.query.offset, 10) || 0,
    0
  );

  const artisans = db.prepare(`
    SELECT
      id,
      name,
      category,
      city,
      address,
      phone,
      website,
      email,
      email_source
    FROM artisans
    WHERE (? = '' OR city = ?)
      AND (? = '' OR category = ?)
    ORDER BY name
    LIMIT ? OFFSET ?
  `).all(
    city,
    city,
    category,
    category,
    limit,
    offset
  );

  res.json({
    count: artisans.length,
    limit,
    offset,
    data: artisans,
  });
});

module.exports = router;