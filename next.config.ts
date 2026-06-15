import type { NextConfig } from "next";

// Trigger env validation on `next dev` / `next build`. The lint script is
// special-cased inside src/lib/env.ts to skip validation when env files are
// absent in CI.
import "./src/lib/env";

const nextConfig: NextConfig = {};

export default nextConfig;
