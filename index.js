const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;

const userRoutes = require('./routes/userRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const questionRoutes = require('./routes/questionRoutes');
const answerRoutes = require('./routes/answerRoutes');
const packageRoutes = require('./routes/packageRoutes');
const resultRoutes = require('./routes/resultRoutes');
const protocoles = require('./protocoles');


// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ info: 'Gula backend' });
});

app.use('/users', userRoutes);
app.use('/surveys', surveyRoutes);
app.use('/questions', questionRoutes);
app.use('/answers', answerRoutes);
app.use('/packages', packageRoutes);
app.use('/results', resultRoutes);

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
