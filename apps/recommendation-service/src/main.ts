import express from 'express';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import router from './routes/recommendation.route';
import { runOfflineSimilarityJob } from './services/similarity.service';

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

app.use('/api', router);

app.get('/', (_req, res) => {
  res.send({ message: 'Welcome to recommendation-service!' });
});

// Recompute similarities every 6 hours
cron.schedule('0 */6 * * *', () => {
  runOfflineSimilarityJob().catch(console.error);
});

// Run once on startup so Redis is populated before first request
runOfflineSimilarityJob().catch(console.error);

const port = process.env.PORT || 6007;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
