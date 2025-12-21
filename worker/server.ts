// worker/server.ts
import dotenv from "dotenv";
import http from "http";
dotenv.config(); // load .env (ở root)

import { createApp } from "./app";
import { startNotificationCron } from "./cron/notification.cron";
import { initSocket } from "./realtime/socket";

const PORT = process.env.PORT || 4000;

(async () => {
  const app = await createApp();
  const server = http.createServer(app);
  //Start Socket
  initSocket(server);
  //Call Cron Notification Start
  startNotificationCron();
  app.listen(PORT, () => {
    console.log(`[SERVER] Running at http://localhost:${PORT}`);
  });
})();
