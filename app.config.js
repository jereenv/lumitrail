// Dynamic Expo config.
//
// Everything static still lives in app.json; this wrapper only injects the
// Android Google Maps API key from the GOOGLE_MAPS_API_KEY environment variable
// (loaded from a local, git-ignored .env). That keeps the real key out of the
// repo. iOS uses Apple Maps and needs no key. See README § "Google Maps API key".
const appJson = require('./app.json');

module.exports = () => {
  const expo = { ...appJson.expo };
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    expo.android = {
      ...expo.android,
      config: {
        ...(expo.android && expo.android.config),
        googleMaps: { apiKey },
      },
    };
  }

  return expo;
};
