const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  swSrc: "service-worker.js",
  disable: false,
});
const { withPlausibleProxy } = require("next-plausible");
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPlausibleProxy()(withPWA(nextConfig));
