import 'tsconfig-paths/register';
import express from 'express';
import './jobs/product-cron.job';
import cors from 'cors';
import { errorMiddleware } from '@packages/error-handler';
import cookieParser from 'cookie-parser';
import router from './routes/product.routes';
import swaggerui from 'swagger-ui-express';
const swaggerDocument = require('./swagger-output.json');

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  })
);

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send({ message: 'Hello Product API' });
});

app.use('/api-docs', swaggerui.serve, swaggerui.setup(swaggerDocument));
app.get('/docs-json', (req, res) => {
  res.json(swaggerDocument);
});

//Routes
app.use('/api', router);

app.use(errorMiddleware);

const port = process.env.PORT || 6002;
const server = app.listen(port, () => {
  console.log(`Product Service is running at http://localhost:${port}/api`);
  console.log(`Swagger Docs available at http://localhost:${port}/docs`);
});

server.on('error', (err) => {
  console.log('Server Error: ', err);
});
