import type { NextConfig } from "next";

// Trigger env validation on `next dev` / `next build`. The lint script is
// special-cased inside src/lib/env.ts to skip validation when env files are
// absent in CI.
import "./src/lib/env";

const nextConfig: NextConfig = {
  // `jsdom` ships native Node modules and a heavy dynamic-require graph that
  // Next's server bundler can't trace correctly — on Vercel this surfaces as
  // `Failed to load external module jsdom-...` at runtime. Opting it out makes
  // Next use plain `require()` from node_modules instead of bundling it.
  serverExternalPackages: ["jsdom"],
};

export default nextConfig;
