// worker/server.ts
import dotenv from "dotenv";
dotenv.config(); // load .env (ở root)

import { createApp } from "./app";
import { startNotificationCron } from "./cron/notification.cron";

const PORT = process.env.PORT || 4000;

(async () => {
  const app = await createApp();
  //Call Cron Notification Start
  startNotificationCron();
  app.listen(PORT, () => {
    console.log(`[SERVER] Running at http://localhost:${PORT}`);
  });
})();
