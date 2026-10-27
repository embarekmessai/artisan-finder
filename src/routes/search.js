const express = require("express");
const { startCollection } = require("../jobs/collectionJob");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const city = String(req.body.city || "").trim();
    const category = String(req.body.category || "").trim();

    const requestedLimit = Number(req.body.limit ?? 200);

    if (!city || !category) {
      return res.status(400).json({
        error: "Les champs city et category sont obligatoires.",
      });
    }

    if (
      !Number.isInteger(requestedLimit) ||
      requestedLimit < 1 ||
      requestedLimit > 500
    ) {
      return res.status(400).json({
        error: "Le champ limit doit être compris entre 1 et 500.",
      });
    }

    if (city.length > 100 || category.length > 100) {
      return res.status(400).json({
        error: "La ville et la catégorie ne doivent pas dépasser 100 caractères.",
      });
    }

    const job = startCollection({
      city,
      category,
      limit: requestedLimit,
    });

    return res.status(202).json({
      message: "Collecte lancée.",
      jobId: job.id,
      status: job.status,
      statusUrl: `/api/search/${job.id}`,
    });
  } catch (error) {
    console.error("Erreur lors du lancement de la collecte :", error);

    return res.status(500).json({
      error: "Impossible de lancer la collecte.",
    });
  }
});

// Consulter la progression d'une collecte.
router.get("/:jobId", (req, res) => {
  const { getJob } = require("../jobs/collectionJob");

  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      error: "Tâche introuvable.",
    });
  }

  return res.json(job);
});

module.exports = router;