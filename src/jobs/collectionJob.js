const { randomUUID } = require("node:crypto");

const {
  searchArtisans,
} = require("../services/googlePlaces");

const {
  saveArtisan,
} = require("../services/artisanRepository");

const {
  extractEmails,
} = require("../services/emailExtractor");

const db = require("../config/database");

// État des jobs en mémoire.
// Les jobs et leur progression seront perdus au redémarrage du serveur.
const jobs = new Map();

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function startCollection({ city, category, limit = 200 }) {
  const id = randomUUID();

  const job = {
    id,
    city,
    category,
    limit,
    status: "running",
    totalFound: 0,
    saved: 0,
    emailsFound: 0,
    errors: 0,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    error: null,
  };

  jobs.set(id, job);

  // Ne pas attendre la fin du job dans la route HTTP.
  runCollection(job).catch((error) => {
    console.error(`Erreur du job ${id}:`, error);

    job.status = "failed";
    job.error = error.message;
    job.finishedAt = new Date().toISOString();
  });

  return { ...job };
}

async function runCollection(job) {
  let pageToken;

  const seenPlaceIds = new Set();

  try {
    do {
      const result = await searchArtisans({
        city: job.city,
        category: job.category,
        pageToken,
      });

      const places = result.places || [];

      for (const place of places) {
        if (job.totalFound >= job.limit) {
          break;
        }

        if (!place.id || seenPlaceIds.has(place.id)) {
          continue;
        }

        seenPlaceIds.add(place.id);
        job.totalFound++;

        try {
          // Enregistrer l'entreprise dans SQLite.
          saveArtisan(place, job.category, job.city);

          job.saved++;

          // Rechercher un e-mail sur le site professionnel.
          if (place.websiteUri) {
            await sleep(500);

            const emails = await extractEmails(place.websiteUri);

            if (emails.length > 0) {
              // Enregistrer une adresse trouvée.
              // Le schéma actuel ne prévoit qu'un e-mail par artisan.
              const updateEmail = db.prepare(`
                UPDATE artisans
                SET email = ?,
                    email_source = ?
                WHERE google_place_id = ?
              `);

              updateEmail.run(
                emails[0],
                place.websiteUri,
                place.id
              );

              job.emailsFound++;
            }
          }
        } catch (error) {
          job.errors++;

          console.error(
            `Erreur pour ${place.displayName?.text || place.id}:`,
            error.message
          );
        }
      }

      if (job.totalFound >= job.limit) {
        break;
      }

      pageToken = result.nextPageToken;

      // Si Google ne fournit plus de page, la collecte s'arrête.
      if (!pageToken) {
        break;
      }

      // Petite pause entre les pages.
      await sleep(1000);
    } while (pageToken);

    job.status = "completed";
  } catch (error) {
    job.status = "failed";
    job.error = error.message;

    console.error("Erreur de collecte Google Places :", error);
  } finally {
    job.finishedAt = new Date().toISOString();
  }

  return job;
}

function getJob(id) {
  const job = jobs.get(id);

  return job ? { ...job } : null;
}

module.exports = {
  startCollection,
  getJob,
};