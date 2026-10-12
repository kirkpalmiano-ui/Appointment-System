import { config } from './config/env.js';
import connectDB from './config/db.js';
import app from './app.js';
import { startReminderJob } from './utils/reminderJob.js';

try {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`API running on port ${config.port} (${config.nodeEnv})`);
  });
  startReminderJob();
} catch (err) {
  console.error('Failed to start server:', err.message);
  process.exit(1);
}
