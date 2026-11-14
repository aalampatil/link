import { createServer } from "vite";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { eq } from "../../server/node_modules/drizzle-orm/index.js";
import { db, testApp, testSmtp } from "../../server/test/helpers.js";
import { linksTable } from "../../server/src/db/schema.js";

const api = await testApp();
process.env.VITE_SERVER = api.url.replace(/\/link$/, "");
const vite = await createServer({
  root: fileURLToPath(new URL("..", import.meta.url)),
  server: { port: 55173, host: "127.0.0.1", strictPort: true },
});
await writeFile(
  new URL(".browser-state.json", import.meta.url),
  JSON.stringify({ api: api.url }),
);
await vite.listen();
console.log("Local browser verification stack ready");
let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  await vite.close();
  await api.close();
  await db.delete(linksTable).where(eq(linksTable.ownerId, "browser-owner"));
  await testSmtp.close();
  await db.$client.end();
};
for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, stop);
