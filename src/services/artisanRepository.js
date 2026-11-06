const db = require("../config/database");

const upsertArtisan = db.prepare(`
  INSERT INTO artisans (
    google_place_id,
    name,
    category,
    city,
    address,
    phone,
    website
  )
  VALUES (
    @google_place_id,
    @name,
    @category,
    @city,
    @address,
    @phone,
    @website
  )
  ON CONFLICT(google_place_id)
  DO UPDATE SET
    name = excluded.name,
    category = excluded.category,
    city = excluded.city,
    address = excluded.address,
    phone = COALESCE(excluded.phone, artisans.phone),
    website = COALESCE(excluded.website, artisans.website)
`);

function saveArtisan(place, category, city) {
  if (!place.id || !place.displayName?.text) {
    return;
  }

  upsertArtisan.run({
    google_place_id: place.id,
    name: place.displayName.text,
    category,
    city,
    address: place.formattedAddress || null,
    phone: place.nationalPhoneNumber || null,
    website: place.websiteUri || null,
  });
}

module.exports = { saveArtisan };
