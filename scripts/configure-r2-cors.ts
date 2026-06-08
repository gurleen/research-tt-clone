import {
  configureR2Cors,
  parseCorsOrigins,
} from "../src/server/services/r2/configure-cors.ts";

const origins = parseCorsOrigins(process.env.R2_CORS_ORIGINS);

try {
  await configureR2Cors(origins);
  console.log(
    `R2 CORS configured for bucket with origins:\n${origins.map((o) => `  - ${o}`).join("\n")}`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to configure R2 CORS: ${message}\n`);
  console.error(
    "If the API token cannot edit bucket CORS, set it manually in Cloudflare:",
  );
  console.error("  R2 → your bucket → Settings → CORS policy\n");
  console.error(
    JSON.stringify(
      [
        {
          AllowedOrigins: origins,
          AllowedMethods: ["GET", "PUT", "HEAD"],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
      null,
      2,
    ),
  );
  process.exit(1);
}
