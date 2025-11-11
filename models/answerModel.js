const pool = require('../db');

const ANSWER_SELECT = `
  SELECT sa.id,
         sa.submission_id,
         sa.question_id,
         sa.answer_value,
         sa.answer_text,
         sa.created_at,
         ss.user_id,
         ss.survey_id,
         ss.status,
         ss.submitted_at,
         ss.updated_at
    FROM survey_answers sa
    JOIN survey_submissions ss ON sa.submission_id = ss.id
`;

const mapAnswerRow = (row) => ({
  id: row.id,
  submission_id: row.submission_id,
  question_id: row.question_id,
  answer_value: row.answer_value,
  answer_text: row.answer_text,
  created_at: row.created_at,
  user_id: row.user_id,
  survey_id: row.survey_id,
  status: row.status,
  submitted_at: row.submitted_at,
  updated_at: row.updated_at,
});

const getAnswers = async () => {
  const res = await pool.query(`${ANSWER_SELECT} ORDER BY ss.submitted_at DESC, sa.id ASC`);
  return res.rows.map(mapAnswerRow);
};

const getAnswerById = async (id) => {
  const res = await pool.query(`${ANSWER_SELECT} WHERE sa.id = $1`, [id]);
  return res.rows.length > 0 ? mapAnswerRow(res.rows[0]) : null;
};

const getAnswersByUserId = async (userId) => {
  const res = await pool.query(
    `${ANSWER_SELECT} WHERE ss.user_id = $1 ORDER BY ss.submitted_at DESC, sa.id ASC`,
    [userId],
  );
  return res.rows.map(mapAnswerRow);
};

const getAnswersByQuestionId = async (questionId) => {
  const res = await pool.query(
    `${ANSWER_SELECT} WHERE sa.question_id = $1 ORDER BY ss.submitted_at DESC, sa.id ASC`,
    [questionId],
  );
  return res.rows.map(mapAnswerRow);
};

const getAnswersBySurveyId = async (surveyId) => {
  const res = await pool.query(
    `${ANSWER_SELECT} WHERE ss.survey_id = $1 ORDER BY ss.submitted_at DESC, sa.id ASC`,
    [surveyId],
  );
  return res.rows.map(mapAnswerRow);
};

const createSubmissionWithAnswers = async (
  userId,
  surveyId,
  answers,
  { status = 'completed' } = {},
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const submissionRes = await client.query(
      `INSERT INTO survey_submissions (user_id, survey_id, status)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, survey_id, status, submitted_at, updated_at`,
      [userId, surveyId, status],
    );
    const submission = submissionRes.rows[0];
    const createdAnswers = [];

    for (const ans of answers) {
      const answerRes = await client.query(
        `INSERT INTO survey_answers (submission_id, question_id, answer_value, answer_text)
         VALUES ($1, $2, $3, $4)
         RETURNING id, submission_id, question_id, answer_value, answer_text, created_at`,
        [submission.id, ans.question_id, ans.answer_value, ans.answer_text ?? null],
      );
      createdAnswers.push(answerRes.rows[0]);
    }

    await client.query('COMMIT');
    return {
      submission,
      answers: createdAnswers,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getLatestSubmission = async (userId, surveyId) => {
  const submissionRes = await pool.query(
    `SELECT id, user_id, survey_id, status, submitted_at, updated_at
       FROM survey_submissions
      WHERE user_id = $1 AND survey_id = $2 AND status = 'completed'
      ORDER BY submitted_at DESC
      LIMIT 1`,
    [userId, surveyId],
  );
  if (submissionRes.rows.length === 0) {
    return null;
  }
  const submission = submissionRes.rows[0];
  const answersRes = await pool.query(
    `SELECT sa.id,
            sa.submission_id,
            sa.question_id,
            sa.answer_value,
            sa.answer_text,
            sa.created_at,
            q.question_order
       FROM survey_answers sa
       JOIN questions q ON sa.question_id = q.id
      WHERE sa.submission_id = $1
      ORDER BY q.question_order ASC, sa.id ASC`,
    [submission.id],
  );
  return {
    submission,
    answers: answersRes.rows,
  };
};

const getUserSurveySubmission = async (userId, surveyId) => {
  const latest = await getLatestSubmission(userId, surveyId);
  if (!latest) {
    return null;
  }
  const { submission, answers } = latest;
  return {
    id: submission.id,
    survey_id: submission.survey_id,
    user_id: submission.user_id,
    status: submission.status,
    submitted_at: submission.submitted_at,
    updated_at: submission.updated_at,
    responses: answers.map((answer) => ({
      id: answer.id,
      question_id: answer.question_id,
      answer_value: answer.answer_value,
      answer_text: answer.answer_text,
      created_at: answer.created_at,
      question_order: answer.question_order,
    })),
  };
};

const getUserAnswersForSurvey = async (userId, surveyId) => {
  const latest = await getLatestSubmission(userId, surveyId);
  if (!latest) {
    return {};
  }
  const responses = {};
  for (const answer of latest.answers) {
    const value = answer.answer_text ?? answer.answer_value;
    responses[answer.question_id] = value;
  }
  return responses;
};

const getSubmissionHistory = async (userId, surveyId, options = {}) => {
  const values = [userId, surveyId];

  let limitSql = '';
  if (Number.isFinite(Number(options.limit)) && Number(options.limit) > 0) {
    values.push(Number(options.limit));
    limitSql = ` LIMIT $${values.length}`;
  }

  let offsetSql = '';
  if (Number.isFinite(Number(options.offset)) && Number(options.offset) >= 0) {
    values.push(Number(options.offset));
    offsetSql = ` OFFSET $${values.length}`;
  }

  const submissionsRes = await pool.query(
    `SELECT id, user_id, survey_id, status, submitted_at, updated_at
       FROM survey_submissions
      WHERE user_id = $1 AND survey_id = $2 AND status = 'completed'
      ORDER BY submitted_at DESC, id DESC${limitSql}${offsetSql}`,
    values,
  );

  const submissions = submissionsRes.rows;
  if (submissions.length === 0) {
    return [];
  }

  const submissionIds = submissions.map((row) => row.id);
  const answersRes = await pool.query(
    `SELECT sa.id,
            sa.submission_id,
            sa.question_id,
            sa.answer_value,
            sa.answer_text,
            sa.created_at,
            q.question_order
       FROM survey_answers sa
       JOIN questions q ON sa.question_id = q.id
      WHERE sa.submission_id = ANY($1::uuid[])
      ORDER BY sa.submission_id, q.question_order ASC, sa.id ASC`,
    [submissionIds],
  );

  const groupedAnswers = new Map();
  for (const row of answersRes.rows) {
    const submissionId = row.submission_id;
    if (!groupedAnswers.has(submissionId)) {
      groupedAnswers.set(submissionId, []);
    }
    groupedAnswers.get(submissionId).push(row);
  }

  return submissions.map((submission) => {
    const answers = groupedAnswers.get(submission.id) || [];
    return {
      ...submission,
      responses: answers.map((answer) => ({
        id: answer.id,
        submission_id: answer.submission_id,
        question_id: answer.question_id,
        answer_value: answer.answer_value,
        answer_text: answer.answer_text,
        created_at: answer.created_at,
        question_order: answer.question_order,
      })),
    };
  });
};

const createAnswer = async (userId, questionId, answerValue, answerText = null) => {
  const questionRes = await pool.query(
    'SELECT survey_id FROM questions WHERE id = $1',
    [questionId],
  );
  const questionRow = questionRes.rows[0];
  if (!questionRow) {
    throw new Error(`Question ${questionId} not found`);
  }
  const { answers } = await createSubmissionWithAnswers(
    userId,
    questionRow.survey_id,
    [{ question_id: questionId, answer_value: answerValue, answer_text: answerText }],
    { status: 'draft' },
  );
  return answers[0];
};

const updateAnswer = async (id, answerValue, answerText = null) => {
  const res = await pool.query(
    `UPDATE survey_answers
        SET answer_value = $1,
            answer_text = $2,
            created_at = NOW()
      WHERE id = $3
      RETURNING id, submission_id, question_id, answer_value, answer_text, created_at`,
    [answerValue, answerText, id],
  );
  return res.rows[0] ?? null;
};

const deleteAnswer = async (id) => {
  await pool.query('DELETE FROM survey_answers WHERE id = $1', [id]);
};

const deleteAnswersByUserId = async (userId) => {
  await pool.query('DELETE FROM survey_submissions WHERE user_id = $1', [userId]);
};

const deleteAnswersByQuestionId = async (questionId) => {
  await pool.query('DELETE FROM survey_answers WHERE question_id = $1', [questionId]);
};

const replaceAnswersForSurvey = async (userId, surveyId, answers) => {
  return createSubmissionWithAnswers(userId, surveyId, answers);
};

module.exports = {
  getAnswers,
  getAnswerById,
  getAnswersByUserId,
  getAnswersByQuestionId,
  getAnswersBySurveyId,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  deleteAnswersByUserId,
  deleteAnswersByQuestionId,
  getUserAnswersForSurvey,
  getUserSurveySubmission,
  getSubmissionHistory,
  createSubmissionWithAnswers,
  replaceAnswersForSurvey,
};
