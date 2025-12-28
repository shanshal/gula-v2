require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
// const { expressjwt: jwt } = require('express-jwt');
// const jwksRsa = require('jwks-rsa');
const { performance } = require('perf_hooks');

const surveyRoutes = require('./routes/surveyRoutes');
const questionRoutes = require('./routes/questionRoutes');
const answerRoutes = require('./routes/answerRoutes');
const scoringRoutes = require('./routes/scoringRoutes');
const errorMiddleware = require('./middleware/error.middleware');
const sequelize = require('./config/db');

const app = express();

// Security / basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  })
);

// Per-request timing for observability
app.use((req, res, next) => {
  const start = performance.now();

  res.on('finish', () => {
    const durationMs = performance.now() - start;
    try {
      console.log(
        JSON.stringify({
          level: 'info',
          type: 'survey_request_completed',
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          duration_ms: Number(durationMs.toFixed(1)),
        })
      );
    } catch (e) {
      // avoid crashing on logging errors
      console.error('[SURVEY] Failed to log request timing:', e.message);
    }
  });

  next();
});

// Health (used by gateway /check-services)
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// JWT auth for normal (non-internal) routes
// app.use(
//   jwt({
//     secret: jwksRsa.expressJwtSecret({
//       cache: true,
//       rateLimit: true,
//       jwksRequestsPerMinute: 5,
//       jwksUri: process.env.JWKS_URI,
//     }),
//     audience: process.env.AUDIENCE,
//     issuer: process.env.ISSUER,
//     algorithms: ['RS256'],
//   }).unless({
//     path: [
//       '/health',
//       // internal endpoints use INTERNAL_ACCESS_TOKEN instead of user JWT
//       /^\/api\/.*\/internal\/.*/i,
//     ],
//   })
// );


// Routes
app.use('/api/surveys', surveyRoutes);
app.use('/api/surveys/questions', questionRoutes);
app.use('/api/surveys/answers', answerRoutes);
app.use('/api/surveys/scoring', scoringRoutes);


// Error handling
app.use(errorMiddleware);

// Startup / DB init with timing logs
(async () => {
  try {
    const t0 = performance.now();
    await sequelize.authenticate();
    const t1 = performance.now();
    console.log(
      '[SURVEY] sequelize.authenticate ms =',
      (t1 - t0).toFixed(1)
    );

    if (process.env.NODE_ENV !== 'production') {
      const t2 = performance.now();
      await sequelize.sync({ alter: true });
      const t3 = performance.now();
      console.log(
        '[SURVEY] sequelize.sync(alter) ms =',
        (t3 - t2).toFixed(1)
      );

      // Optional seeding in non-production (guarded by env)
      if (process.env.RUN_SEED === 'true') {
        const t4 = performance.now();
        require('../scripts/seed_surveys');
        const t5 = performance.now();
        console.log(
          '[SURVEY] seed script ms =',
          (t5 - t4).toFixed(1)
        );
      }
    }

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Survey Service on ${port}`));
  } catch (err) {
    console.error('[SURVEY] Failed to start service:', err);
    process.exit(1);
  }
})();
