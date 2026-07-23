const DEV_DEFAULT_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

// FRONTEND_URL holds a comma-separated allowlist of origins permitted to call
// this API with credentials (e.g. "https://app.moodly.com,https://moodly.com").
// Falls back to the local Vite dev server so `npm run dev` keeps working
// without extra setup, but production deployments must set FRONTEND_URL —
// an unset value must never fall back to allowing every origin.
export function getAllowedOrigins(): string[] {
  const configured = process.env.FRONTEND_URL;
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FRONTEND_URL must be set in production to restrict CORS to known origins");
    }
    return DEV_DEFAULT_ORIGINS;
  }
  return configured.split(",").map((origin) => origin.trim());
}
