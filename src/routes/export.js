const express = require("express");
const { stringify } = require("csv-stringify/sync");

const db = require("../config/database");

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const city = String(req.query.city || "").trim();
    const category = String(req.query.category || "").trim();

    const artisans = db.prepare(`
      SELECT
        name,
        category,
        city,
        address,
        phone,
        email,
        website,
        email_source
      FROM artisans
      WHERE (? = '' OR city = ?)
        AND (? = '' OR category = ?)
      ORDER BY name ASC
    `).all(
      city,
      city,
      category,
      category
    );

    const csv = stringify(artisans, {
      header: true,
      bom: true,
      delimiter: ";",
      columns: [
        { key: "name", header: "Entreprise" },
        { key: "category", header: "Métier" },
        { key: "city", header: "Ville" },
        { key: "address", header: "Adresse" },
        { key: "phone", header: "Téléphone" },
        { key: "email", header: "Email" },
        { key: "website", header: "Site web" },
        { key: "email_source", header: "Source email" },
      ],
    });

    const filename = [
      "artisans",
      city || "toutes-villes",
      category || "tous-metiers",
    ]
      .join("-")
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}.csv"`
    );

    res.send(csv);
  } catch (error) {
    console.error("Erreur d'export CSV :", error);

    res.status(500).json({
      error: "Impossible de générer le fichier CSV.",
    });
  }
});

module.exports = router;