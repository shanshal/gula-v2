const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const app = express();
const port = 8080;

const userRoutes = require('./routes/userRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const questionRoutes = require('./routes/questionRoutes');
const answerRoutes = require('./routes/answerRoutes');
const scoringRoutes = require('./routes/scoringRoutes');
const jsonSurveyRoutes = require('./routes/jsonSurveyRoutes');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Gula Leadership Survey API Documentation'
}));

// API documentation JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/', (req, res) => {
  res.json({ 
    info: 'Gula Leadership Survey Backend',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      users: '/users',
      surveys: '/surveys', 
      questions: '/questions',
      answers: '/answers',
      scoring: '/scoring'
    }
  });
});

app.use('/users', userRoutes);
app.use('/surveys', surveyRoutes);
app.use('/questions', questionRoutes);
app.use('/answers', answerRoutes);
app.use('/scoring', scoringRoutes);
app.use('/surveys/json', jsonSurveyRoutes);


app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
