const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

// Modern phone cameras can produce huge photos (many phones now ship
// 48MP-108MP sensors). Decoding a single frame like that into an in-memory
// bitmap for resizing/uploading can require 200MB-1GB+ of RAM, which
// exceeds Android's default per-app heap limit on many devices and causes
// a hard native OutOfMemoryError crash that no JS try/catch can reach.
// android:largeHeap="true" gives the process a significantly larger heap
// ceiling, which is the standard mitigation for exactly this class of
// crash in image-heavy RN/Expo apps.
module.exports = function withLargeHeap(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    mainApplication.$['android:largeHeap'] = 'true';
    return config;
  });
};
