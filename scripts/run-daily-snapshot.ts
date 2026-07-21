import { runDailyJob } from "../lib/jobs/daily";
runDailyJob().then(console.log).catch(console.error);
