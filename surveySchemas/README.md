# Gula Survey Management Service

A comprehensive survey management system with advanced scoring capabilities, built on PostgreSQL with Node.js/Express.

## 🚀 Quick Start

### Base URL
```
https://gula-v2.onrender.com
```

### Create a Survey
```bash
curl -X POST "https://gula-v2.onrender.com/surveys/create" \
  -H "Content-Type: application/json" \
  -d @your-survey.json
```

### Submit Answers
```bash
curl -X POST "https://gula-v2.onrender.com/answers/user/1/survey/1" \
  -H "Content-Type: application/json" \
  -d '[{"question_id": 1, "answer_value": 5, "answer_text": "Excellent"}]'
```

### Get Score
```bash
curl -X GET "https://gula-v2.onrender.com/scoring/1/user/1/score"
```

## 📊 Scoring Types

| Type | Description | Use Case |
|------|-------------|----------|
| **sum** | Simple addition of weighted scores | Basic surveys, questionnaires |
| **grouped** | Score questions in separate groups | Leadership styles, personality types |
| **paired-options** | Two-choice questions with group scoring | Love languages, preferences |
| **formula** | Custom mathematical expressions | Complex calculations, wellness scores |
| **mixed_sign** | Positive and negative scoring | Psychological assessments, bipolar scales |

## 🗄️ Database Schema

### Surveys Table
```sql
CREATE TABLE surveys (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'published', 'archived')),
  scoring JSONB DEFAULT '{"type": "sum"}'
);
```

### Questions Table  
```sql
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  options JSONB,
  question_order INTEGER,
  min_value NUMERIC,
  max_value NUMERIC,
  help_text TEXT,
  placeholder TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  question_route TEXT,
  flag TEXT
);
```

### Answers Table
```sql
CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  answer_value NUMERIC,
  answer_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  age INTEGER CHECK (age >= 0),
  sex TEXT CHECK (sex IN ('male', 'female', 'other')),
  weight NUMERIC(5,2) CHECK (weight > 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 📝 Question Types

| Type | Description | Options Format |
|------|-------------|----------------|
| `multiple_choice` | Standard multiple choice | `["Option 1", "Option 2", "Option 3"]` |
| `single_choice` | Single selection | `["Yes", "No"]` |
| `scale` | Numeric scale | `null` (use min_value/max_value) |
| `number` | Numeric input | `null` |
| `text` | Free text input | `null` |
| `boolean` | True/false | `null` |
| `paired-options` | Two-choice with groups | `[{"text": "Option A", "group": "A"}]` |

## 🔧 API Endpoints

### Survey Management
- `GET /surveys` - List all surveys
- `GET /surveys/:id` - Get survey with questions
- `POST /surveys/create` - Create new survey
- `PUT /surveys/:id` - Update entire survey
- `PATCH /surveys/:id` - Partial survey update
- `DELETE /surveys/:id` - Delete survey

### Answer Submission
- `POST /answers/user/:userId/survey/:surveyId` - Bulk answer submission
- `POST /answers` - Single answer submission
- `GET /answers/user/:userId/survey/:surveyId` - Get user's answers

### Scoring
- `GET /scoring/:surveyId/user/:userId/score` - Calculate and return score

### User Management
- `GET /users` - List users
- `POST /users` - Create user
- `GET /users/:id` - Get user details

## ⚙️ Advanced Features

### Formula Scoring with Q Variables
Use `Q1`, `Q2`, `Q3`, etc. to reference questions by their order:
```json
{
  "type": "formula",
  "expression": "(Q1 + Q2) * 0.4 + Q3 * 0.1 - Q4 * 0.2"
}
```

### Weight System
Three levels of weight control (priority: overrides > question weights > default):
```json
{
  "questions": [{"weight": 2}],
  "scoring": {
    "weight_overrides": {"1": 3}
  }
}
```

### Partial Updates (PATCH)
Update only specific fields without sending the entire survey:
```json
{
  "name": "Updated Survey Name",
  "scoring": {
    "thresholds": {
      "0-5": "Low score",
      "6-10": "High score"
    }
  }
}
```

## 📋 Validation Rules

- Survey `name` is required
- Questions must have `question_text` and `question_type`
- Choice-type questions must have `options` array
- `answer_value` must be numeric for scoring
- `status` must be 'draft', 'published', or 'archived'
- Weights must be non-negative numbers

## 🎯 Examples

See the individual JSON files for complete working examples:
- `sum_scoring_example.json` - Basic sum scoring
- `grouped_scoring_example.json` - Group-based scoring
- `paired_options_example.json` - Love languages style
- `formula_scoring_example.json` - Mathematical expressions
- `mixed_sign_example.json` - Positive/negative scoring

## 🔍 Error Handling

All endpoints return structured error responses:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "questions[0].question_text",
      "message": "Question text is required"
    }
  ]
}
```

## 📊 Response Formats

### Survey Creation Response
```json
{
  "survey": {
    "id": 1,
    "name": "My Survey",
    "status": "draft",
    "scoring": {...}
  },
  "questions": [
    {
      "id": 1,
      "question_text": "How satisfied are you?",
      "question_order": 1
    }
  ]
}
```

### Scoring Response
```json
{
  "score": 8.5,
  "total": 8.5,
  "breakdown": {
    "1": {
      "original": "Very Satisfied",
      "mapped": 5,
      "weight": 2,
      "weighted": 10
    }
  },
  "surveyId": 1,
  "userId": 1,
  "scoringType": "sum",
  "responseCount": 5
}
```

## 🚀 Getting Started

1. **Create a User**: `POST /users` with name and email
2. **Create a Survey**: `POST /surveys/create` with your JSON
3. **Submit Answers**: `POST /answers/user/:userId/survey/:surveyId`
4. **Get Results**: `GET /scoring/:surveyId/user/:userId/score`

## 💡 Tips

- Use `question_order` to control the sequence of questions
- Set `is_required: true` for mandatory questions
- Use `help_text` to provide additional guidance
- Test your scoring logic with sample data before deployment
- Use PATCH for updating specific survey properties
- Question IDs in mappings must match actual database question IDs

## 🔗 Need Help?

- Check the example JSON files for working implementations
- All database constraints are enforced at the API level
- Use the schema file for IDE autocomplete and validation
- Test endpoints with curl or Postman before integrating