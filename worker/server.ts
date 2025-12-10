// worker/server.ts
import dotenv from "dotenv";
dotenv.config(); // load .env (ở root)

import { createApp } from "./app";

const PORT = process.env.PORT || 4000;

(async () => {
  const app = await createApp();

  app.listen(PORT, () => {
    console.log(`[SERVER] Running at http://localhost:${PORT}`);
  });
})();
