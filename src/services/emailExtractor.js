const axios = require("axios");
const cheerio = require("cheerio");

const EMAIL_REGEX =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

async function extractEmails(website) {
  if (!website) {
    return [];
  }

  const baseUrl = new URL(website);

  if (!["http:", "https:"].includes(baseUrl.protocol)) {
    return [];
  }

  const paths = [
    "/",
    "/contact",
    "/mentions-legales",
  ];

  const emails = new Set();

  for (const pagePath of paths) {
    const url = new URL(pagePath, baseUrl);

    // Ne pas explorer un autre domaine.
    if (url.hostname !== baseUrl.hostname) {
      continue;
    }

    try {
      const response = await axios.get(url.href, {
        timeout: 8000,
        maxRedirects: 3,
        maxContentLength: 2_000_000,
        headers: {
          "User-Agent": "ArtisanFinder/1.0",
        },
      });

      const contentType =
        response.headers["content-type"] || "";

      if (!contentType.includes("text/html")) {
        continue;
      }

      const $ = cheerio.load(response.data);

      $('a[href^="mailto:"]').each((_, element) => {
        const href = $(element).attr("href");

        const email = href
          .slice(7)
          .split("?")[0]
          .trim();

        if (EMAIL_REGEX.test(email)) {
          emails.add(email);
        }

        EMAIL_REGEX.lastIndex = 0;
      });

      const text = $("body").text();

      const matches = text.match(EMAIL_REGEX) || [];

      for (const email of matches) {
        emails.add(email.toLowerCase());
      }
    } catch {
      // Une page peut être indisponible.
      continue;
    }
  }

  return [...emails];
}

module.exports = { extractEmails };
