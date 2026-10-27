const axios = require("axios");

const API_URL =
  "https://places.googleapis.com/v1/places:searchText";

async function searchArtisans({
  category,
  city,
  pageToken,
}) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY est manquante.");
  }

  const response = await axios.post(
    API_URL,
    {
      textQuery: `${category} à ${city}`,
      languageCode: "fr",
      regionCode: "FR",
      pageSize: 20,
      ...(pageToken ? { pageToken } : {}),
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.nationalPhoneNumber",
          "places.websiteUri",
          "nextPageToken",
        ].join(","),
      },
      timeout: 15000,
    }
  );

  return {
    places: response.data.places || [],
    nextPageToken: response.data.nextPageToken || null,
  };
}

module.exports = { searchArtisans };
