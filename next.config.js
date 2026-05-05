/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

const buildDate = new Date().toISOString().slice(0, 10);

/** @type {import("next").NextConfig} */
const config = {
  env: {
    BUILD_DATE: buildDate,
  },
};

export default config;
