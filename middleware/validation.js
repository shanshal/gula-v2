// Validation middleware for survey endpoints

// Helper functions for common validations
const isString = (value) => typeof value === 'string' && value.trim().length > 0;
const isNumber = (value) => typeof value === 'number' && !isNaN(value);
const isBoolean = (value) => typeof value === 'boolean';
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isArray = (value) => Array.isArray(value);
const isUuid = (value) => typeof value === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const normalizePotentialUuid = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
};

const collectUuidParamErrors = (definitions, source, errors) => {
  definitions.forEach(({ name, label }) => {
    const normalized = normalizePotentialUuid(source[name]);
    if (!isUuid(normalized)) {
      errors.push({
        field: name,
        message: `${label} must be a valid UUID string`,
      });
    } else {
      source[name] = normalized;
    }
  });
};

const createUuidParamsValidator = (definitions) => {
  return (req, res, next) => {
    try {
      const errors = [];
      collectUuidParamErrors(definitions, req.params, errors);
      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }
      next();
    } catch (error) {
      res.status(500).json({
        error: 'Validation error',
        message: error.message,
      });
    }
  };
};

const validateUuidParam = createUuidParamsValidator([
  { name: 'id', label: 'ID' },
]);

const validateUserIdParam = createUuidParamsValidator([
  { name: 'userId', label: 'User ID' },
]);

const validateSurveyIdParam = createUuidParamsValidator([
  { name: 'surveyId', label: 'Survey ID' },
]);

const validateUserSurveyParams = createUuidParamsValidator([
  { name: 'userId', label: 'User ID' },
  { name: 'surveyId', label: 'Survey ID' },
]);

const isLocalizedText = (value) => {
  if (!isObject(value)) return false;
  const en = typeof value.en === 'string' && value.en.trim().length > 0;
  const ar = typeof value.ar === 'string' && value.ar.trim().length > 0;
  const text = typeof value.text === 'string' && value.text.trim().length > 0;
  return en || ar || text;
};

// Validation error class
class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Survey creation validation
const validateSurveyCreation = (req, res, next) => {
  try {
    const { name, questions, metadata, scoring, status, interpretation } = req.body;
    const errors = [];

    // Validate required fields
    if (!(isString(name) || isLocalizedText(name))) {
      errors.push({ field: 'name', message: 'Survey name is required and must be a string or localized object' });
    }

    if (!isArray(questions) || questions.length === 0) {
      errors.push({ field: 'questions', message: 'Questions array is required and must contain at least one question' });
    } else {
      // Validate each question
      questions.forEach((question, index) => {
        const questionErrors = validateQuestion(question, index);
        errors.push(...questionErrors);
      });
    }

    // Validate optional fields
    if (metadata !== undefined && !isObject(metadata)) {
      errors.push({ field: 'metadata', message: 'Metadata must be an object if provided' });
    }

    if (scoring !== undefined) {
      const scoringErrors = validateScoring(scoring);
      errors.push(...scoringErrors);
    }

    if (status !== undefined && !['draft', 'active', 'archived'].includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: draft, active, archived' });
    }

    if (interpretation !== undefined && !isObject(interpretation)) {
      errors.push({ field: 'interpretation', message: 'Interpretation must be an object if provided' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Validation error',
      message: error.message
    });
  }
};

// Question validation helper
const validateQuestion = (question, index) => {
  const errors = [];
  const questionNumber = index + 1;

  // Check for required text field (support both formats)
  const questionText = question.text || question.question_text;
  if (!(isString(questionText) || isLocalizedText(questionText))) {
    errors.push({
      field: `questions[${index}].text`,
      message: `Question ${questionNumber}: question_text/text must be a string or localized object`
    });
  }

  // Check for required type field (support both formats)
  const questionType = question.type || question.question_type;
  const validTypes = ['radio', 'checkbox', 'text', 'number', 'select', 'textarea', 'single_choice', 'multiple_choice', 'scale'];
  if (!isString(questionType) || !validTypes.includes(questionType)) {
    errors.push({
      field: `questions[${index}].type`,
      message: `Question ${questionNumber}: type must be one of: ${validTypes.join(', ')}`
    });
  }

  // Validate options for choice-type questions
  if (['radio', 'checkbox', 'select', 'single_choice', 'multiple_choice'].includes(questionType)) {
    if (!isArray(question.options) || question.options.length === 0) {
      errors.push({
        field: `questions[${index}].options`,
        message: `Question ${questionNumber}: options array is required for ${questionType} questions`
      });
    } else {
      // Validate each option
      question.options.forEach((option, optionIndex) => {
        if (isString(option)) {
          return;
        }
        if (isObject(option)) {
          const { value, text } = option;
          const hasValue = typeof value === 'string' && value.trim().length > 0;
          const hasText = isString(text) || isLocalizedText(text);
          if (hasValue && hasText) {
            return;
          }
        }
        errors.push({
          field: `questions[${index}].options[${optionIndex}]`,
          message: `Question ${questionNumber}, option ${optionIndex + 1}: must be a string or object with value/text`
        });
      });
    }
  }

  // Validate optional fields
  if (question.is_required !== undefined && !isBoolean(question.is_required)) {
    errors.push({
      field: `questions[${index}].is_required`,
      message: `Question ${questionNumber}: is_required must be a boolean if provided`
    });
  }

  if (question.question_order !== undefined && (!isNumber(question.question_order) || question.question_order < 1)) {
    errors.push({
      field: `questions[${index}].question_order`,
      message: `Question ${questionNumber}: question_order must be a positive number if provided`
    });
  }

  if (question.weight !== undefined && (!isNumber(question.weight) || question.weight < 0)) {
    errors.push({
      field: `questions[${index}].weight`,
      message: `Question ${questionNumber}: weight must be a non-negative number if provided`
    });
  }

  if (question.min_value !== undefined && !isNumber(question.min_value)) {
    errors.push({
      field: `questions[${index}].min_value`,
      message: `Question ${questionNumber}: min_value must be a number if provided`
    });
  }

  if (question.max_value !== undefined && !isNumber(question.max_value)) {
    errors.push({
      field: `questions[${index}].max_value`,
      message: `Question ${questionNumber}: max_value must be a number if provided`
    });
  }

  return errors;
};

// Scoring validation helper
const validateScoring = (scoring) => {
  const errors = [];

  if (!isObject(scoring)) {
    errors.push({ field: 'scoring', message: 'Scoring must be an object' });
    return errors;
  }

  const validTypes = ['sum', 'grouped', 'paired-options', 'formula', 'mixed_sign'];
  if (!validTypes.includes(scoring.type)) {
    errors.push({
      field: 'scoring.type',
      message: `Scoring type must be one of: ${validTypes.join(', ')}`
    });
  }

  // Validate mappings if provided
  if (scoring.mappings !== undefined && !isObject(scoring.mappings)) {
    errors.push({
      field: 'scoring.mappings',
      message: 'Scoring mappings must be an object if provided'
    });
  }

  // Validate weight_overrides if provided
  if (scoring.weight_overrides !== undefined) {
    if (!isObject(scoring.weight_overrides)) {
      errors.push({
        field: 'scoring.weight_overrides',
        message: 'Weight overrides must be an object if provided'
      });
    } else {
      // Validate each weight override
      Object.entries(scoring.weight_overrides).forEach(([questionId, weight]) => {
        if (!isNumber(weight) || weight < 0) {
          errors.push({
            field: `scoring.weight_overrides.${questionId}`,
            message: `Weight override for question ${questionId} must be a non-negative number`
          });
        }
      });
    }
  }

  // Validate weights if provided
  if (scoring.weights !== undefined) {
    if (!isObject(scoring.weights)) {
      errors.push({
        field: 'scoring.weights',
        message: 'Weights must be an object if provided'
      });
    } else {
      // Validate each weight
      Object.entries(scoring.weights).forEach(([questionId, weight]) => {
        if (!isNumber(weight) || weight < 0) {
          errors.push({
            field: `scoring.weights.${questionId}`,
            message: `Weight for question ${questionId} must be a non-negative number`
          });
        }
      });
    }
  }

  // Type-specific validations
  if (scoring.type === 'grouped') {
    if (!isObject(scoring.groups)) {
      errors.push({
        field: 'scoring.groups',
        message: 'Groups object is required for grouped scoring'
      });
    }
  }

  if (scoring.type === 'paired-options') {
    if (!isObject(scoring.group_mapping)) {
      errors.push({
        field: 'scoring.group_mapping',
        message: 'Group mapping object is required for paired-options scoring'
      });
    }
  }

  if (scoring.type === 'formula') {
    if (!isString(scoring.expression)) {
      errors.push({
        field: 'scoring.expression',
        message: 'Expression string is required for formula scoring'
      });
    }
  }

  return errors;
};

// Survey update validation (PUT)
const validateSurveyUpdate = (req, res, next) => {
  try {
    const { name, scoring, metadata, status } = req.body;
    const errors = [];

    // For PUT, we expect at least one field to update
    if (name === undefined && scoring === undefined && metadata === undefined && status === undefined) {
      errors.push({ field: 'body', message: 'At least one field must be provided for update' });
    }

    // Validate provided fields
    if (name !== undefined && !isString(name)) {
      errors.push({ field: 'name', message: 'Name must be a non-empty string if provided' });
    }

    if (metadata !== undefined && !isObject(metadata)) {
      errors.push({ field: 'metadata', message: 'Metadata must be an object if provided' });
    }

    if (scoring !== undefined) {
      const scoringErrors = validateScoring(scoring);
      errors.push(...scoringErrors);
    }

    if (status !== undefined && !['draft', 'active', 'archived'].includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: draft, active, archived' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Validation error',
      message: error.message
    });
  }
};

// Survey patch validation (PATCH)
const validateSurveyPatch = (req, res, next) => {
  try {
    const body = req.body;
    const errors = [];

    // Check that we have at least one field
    if (Object.keys(body).length === 0) {
      errors.push({ field: 'body', message: 'At least one field must be provided for patch update' });
    }

    // Validate each provided field
    Object.keys(body).forEach(key => {
      switch (key) {
        case 'name':
          if (!isString(body[key])) {
            errors.push({ field: 'name', message: 'Name must be a non-empty string' });
          }
          break;
        case 'metadata':
          if (!isObject(body[key])) {
            errors.push({ field: 'metadata', message: 'Metadata must be an object' });
          }
          break;
        case 'scoring':
          if (!isObject(body[key])) {
            errors.push({ field: 'scoring', message: 'Scoring must be an object' });
          } else {
            // For PATCH, we only validate the provided scoring fields
            const scoringErrors = validatePartialScoring(body[key]);
            errors.push(...scoringErrors);
          }
          break;
        case 'status':
          if (!['draft', 'active', 'archived'].includes(body[key])) {
            errors.push({ field: 'status', message: 'Status must be one of: draft, active, archived' });
          }
          break;
        case 'interpretation':
          if (!isObject(body[key])) {
            errors.push({ field: 'interpretation', message: 'Interpretation must be an object' });
          }
          break;
        default:
          errors.push({ field: key, message: `Unknown field: ${key}` });
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Validation error',
      message: error.message
    });
  }
};

// Partial scoring validation for PATCH requests
const validatePartialScoring = (scoring) => {
  const errors = [];

  // Only validate fields that are provided
  if (scoring.type !== undefined) {
    const validTypes = ['sum', 'grouped', 'paired-options', 'formula', 'mixed_sign'];
    if (!validTypes.includes(scoring.type)) {
      errors.push({
        field: 'scoring.type',
        message: `Scoring type must be one of: ${validTypes.join(', ')}`
      });
    }
  }

  if (scoring.mappings !== undefined && !isObject(scoring.mappings)) {
    errors.push({
      field: 'scoring.mappings',
      message: 'Scoring mappings must be an object'
    });
  }

  if (scoring.weight_overrides !== undefined) {
    if (!isObject(scoring.weight_overrides)) {
      errors.push({
        field: 'scoring.weight_overrides',
        message: 'Weight overrides must be an object'
      });
    } else {
      Object.entries(scoring.weight_overrides).forEach(([questionId, weight]) => {
        if (!isNumber(weight) || weight < 0) {
          errors.push({
            field: `scoring.weight_overrides.${questionId}`,
            message: `Weight override for question ${questionId} must be a non-negative number`
          });
        }
      });
    }
  }

  if (scoring.weights !== undefined) {
    if (!isObject(scoring.weights)) {
      errors.push({
        field: 'scoring.weights',
        message: 'Weights must be an object'
      });
    } else {
      Object.entries(scoring.weights).forEach(([questionId, weight]) => {
        if (!isNumber(weight) || weight < 0) {
          errors.push({
            field: `scoring.weights.${questionId}`,
            message: `Weight for question ${questionId} must be a non-negative number`
          });
        }
      });
    }
  }

  return errors;
};

// User creation validation
const validateUserCreation = (req, res, next) => {
  try {
    const { name, email, age, sex, weight } = req.body;
    const errors = [];

    // Required fields
    if (!isString(name)) {
      errors.push({ field: 'name', message: 'Name is required and must be a non-empty string' });
    }

    if (!isString(email) || !isValidEmail(email)) {
      errors.push({ field: 'email', message: 'Valid email address is required' });
    }

    // Optional fields validation
    if (age !== undefined && (!isNumber(age) || age < 0 || age > 150)) {
      errors.push({ field: 'age', message: 'Age must be a number between 0 and 150' });
    }

    if (sex !== undefined && !['male', 'female', 'other'].includes(sex)) {
      errors.push({ field: 'sex', message: 'Sex must be one of: male, female, other' });
    }

    if (weight !== undefined && (!isNumber(weight) || weight < 0 || weight > 1000)) {
      errors.push({ field: 'weight', message: 'Weight must be a number between 0 and 1000 kg' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Validation error',
      message: error.message
    });
  }
};

// Sign up validation (includes password)
const validateSignUp = (req, res, next) => {
  try {
    const { name, email, password, age, sex, weight } = req.body;
    const errors = [];

    // Required fields
    if (!isString(name)) {
      errors.push({ field: 'name', message: 'Name is required and must be a non-empty string' });
    }

    if (!isString(email) || !isValidEmail(email)) {
      errors.push({ field: 'email', message: 'Valid email address is required' });
    }

    if (!isString(password) || password.length < 6) {
      errors.push({ field: 'password', message: 'Password is required and must be at least 6 characters long' });
    }

    // Optional fields validation
    if (age !== undefined && (!isNumber(age) || age < 0 || age > 150)) {
      errors.push({ field: 'age', message: 'Age must be a number between 0 and 150' });
    }

    if (sex !== undefined && !['male', 'female', 'other'].includes(sex)) {
      errors.push({ field: 'sex', message: 'Sex must be one of: male, female, other' });
    }

    if (weight !== undefined && (!isNumber(weight) || weight < 0 || weight > 1000)) {
      errors.push({ field: 'weight', message: 'Weight must be a number between 0 and 1000 kg' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Validation error',
      message: error.message
    });
  }
};

// Sign in validation
const validateSignIn = (req, res, next) => {
  try {
    const { email, password } = req.body;
    const errors = [];

    // Required fields
    if (!isString(email) || !isValidEmail(email)) {
      errors.push({ field: 'email', message: 'Valid email address is required' });
    }

    if (!isString(password) || password.length === 0) {
      errors.push({ field: 'password', message: 'Password is required' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Validation error',
      message: error.message
    });
  }
};

// Answer submission validation (for bulk answer submission)
const validateAnswerSubmission = (req, res, next) => {
  try {
    const answers = req.body;
    const errors = [];

    collectUuidParamErrors(
      [
        { name: 'userId', label: 'User ID' },
        { name: 'surveyId', label: 'Survey ID' },
      ],
      req.params,
      errors,
    );

    // Validate answers array
    if (!isArray(answers) || answers.length === 0) {
      errors.push({ field: 'body', message: 'Request body must be an array of answers with at least one answer' });
    } else {
      // Validate each answer
      answers.forEach((answer, index) => {
        if (!isObject(answer)) {
          errors.push({
            field: `answers[${index}]`,
            message: 'Each answer must be an object'
          });
          return;
        }

        // Validate required fields for each answer
        if (!isNumber(answer.question_id) || answer.question_id < 1) {
          errors.push({
            field: `answers[${index}].question_id`,
            message: 'question_id must be a positive integer'
          });
        }

        // answer_value is required
        if (answer.answer_value === undefined || answer.answer_value === null) {
          errors.push({
            field: `answers[${index}].answer_value`,
            message: 'answer_value is required'
          });
        }

        // answer_text is optional but if provided must be string
        if (answer.answer_text !== undefined && answer.answer_text !== null && !isString(answer.answer_text)) {
          errors.push({
            field: `answers[${index}].answer_text`,
            message: 'answer_text must be a string if provided'
          });
        }
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Validation error',
      message: error.message
    });
  }
};

// Single answer creation validation
const validateSingleAnswer = (req, res, next) => {
  try {
    const { user_id, question_id, answer_value, answer_text } = req.body;
    const errors = [];

    // Required fields
    const normalizedUserId = normalizePotentialUuid(user_id);
    if (!isUuid(normalizedUserId)) {
      errors.push({ field: 'user_id', message: 'Valid user_id is required (UUID string)' });
    }

    if (!isNumber(question_id) || question_id < 1) {
      errors.push({ field: 'question_id', message: 'Valid question_id is required (positive integer)' });
    }

    if (answer_value === undefined || answer_value === null) {
      errors.push({ field: 'answer_value', message: 'answer_value is required' });
    }

    // Optional field validation
    if (answer_text !== undefined && answer_text !== null && !isString(answer_text)) {
      errors.push({ field: 'answer_text', message: 'answer_text must be a string if provided' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Validation error',
      message: error.message
    });
  }
};

// ID parameter validation middleware
const validateIdParam = (req, res, next) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({
      error: 'Validation failed',
      details: [{ field: 'id', message: 'ID must be a positive integer' }]
    });
  }
  req.params.id = id; // Ensure it's parsed as integer
  next();
};

module.exports = {
  validateSurveyCreation,
  validateSurveyUpdate,
  validateSurveyPatch,
  validateUserCreation,
  validateSignUp,
  validateSignIn,
  validateAnswerSubmission,
  validateSingleAnswer,
  validateIdParam,
  validateUuidParam,
  validateUserIdParam,
  validateSurveyIdParam,
  validateUserSurveyParams,
  ValidationError
};
