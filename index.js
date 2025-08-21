const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;

const userRoutes = require('./routes/userRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const questionRoutes = require('./routes/questionRoutes');
const answerRoutes = require ('./routes/answerRoutes');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ info: 'Gula backend' });
});

app.use('/users', userRoutes);
app.use('/surveys', surveyRoutes);
app.use('/questions', questionRoutes)
app.use('/answers', answerRoutes);


app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
