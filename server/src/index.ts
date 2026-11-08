import "dotenv/config";
import { env } from "./env.js";
export const isProduction = env.NODE_ENV === "production";
import createApp from "./app.js";

const PORT = env.PORT ?? "5000";

if (!isProduction) {
  console.log("check 00");
}

async function main() {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`link server listening on :${PORT} in ${env.NODE_ENV} mode`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
