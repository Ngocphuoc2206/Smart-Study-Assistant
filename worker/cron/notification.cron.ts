import cron from "node-cron";
import { generateNotificationFromRemiders } from "../services/notificationCron";
import { logDebug } from "../utils/logger";

export function startNotificationCron(){
    //run each 5 minutes
    cron.schedule("*/5 * * * *", async () => {
        try{
            logDebug("[Cron] generate notification from reminders")
            await generateNotificationFromRemiders();
            logDebug("[Cron] generate notification from reminders OK");
        }catch(e){
            console.error("[Cron] generateNotificationsFromReminders error:", e);
        }
    })
}