# Gula Backend API Endpoints

## Overview
This is a survey management system backend built with Express.js and PostgreSQL.

## Database Tables Expected
The API expects the following database structure:

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    age INTEGER,
    sex VARCHAR(10),
    weight DECIMAL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Surveys Table
```sql
CREATE TABLE surveys (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Questions Table
```sql
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'text',
    is_required BOOLEAN DEFAULT false,
    options JSONB,
    min_value INTEGER,
    max_value INTEGER,
    order_index INTEGER DEFAULT 0,
    placeholder TEXT,
    help_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Answers Table
```sql
CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    answer_value TEXT NOT NULL,
    answer_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "sex": "male",
    "weight": 75.5
  }
  ```
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Surveys
- `GET /surveys` - Get all surveys
- `GET /surveys/:id` - Get survey by ID
- `POST /surveys` - Create new survey
  ```json
  {
    "name": "Customer Satisfaction Survey"
  }
  ```
- `PUT /surveys/:id` - Update survey
- `DELETE /surveys/:id` - Delete survey

### Questions
- `GET /questions` - Get all questions
- `GET /questions/:id` - Get question by ID
- `POST /questions` - Create new question
  ```json
  {
    "text": "How satisfied are you with our service?",
    "survey_id": 1,
    "type": "multiple_choice",
    "is_required": true,
    "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
    "order_index": 1,
    "help_text": "Please select one option"
  }
  ```
- `PUT /questions/:id` - Update question
- `DELETE /questions/:id` - Delete question

### Answers ✅ **NEWLY IMPLEMENTED**
- `GET /answers` - Get all answers
- `GET /answers/:id` - Get answer by ID
- `POST /answers` - Create new answer
  ```json
  {
    "user_id": 1,
    "question_id": 1,
    "answer_value": "Very Satisfied",
    "answer_text": "The service was excellent and exceeded my expectations"
  }
  ```
- `PUT /answers/:id` - Update answer
  ```json
  {
    "answer_value": "Satisfied",
    "answer_text": "Updated response"
  }
  ```
- `DELETE /answers/:id` - Delete answer

#### Additional Answer Endpoints
- `GET /answers/user/:userId` - Get all answers by user ID
- `GET /answers/question/:questionId` - Get all answers for a question
- `GET /answers/survey/:surveyId` - Get all answers for a survey (with question details)
- `DELETE /answers/user/:userId/all` - Delete all answers by user
- `DELETE /answers/question/:questionId/all` - Delete all answers for a question

## Example Usage

### Submit Survey Responses
1. Create a user: `POST /users`
2. Create a survey: `POST /surveys`
3. Add questions to survey: `POST /questions`
4. User submits answers: `POST /answers`

### Analyze Survey Results
1. Get survey responses: `GET /answers/survey/:surveyId`
2. Get specific user responses: `GET /answers/user/:userId`
3. Analyze question responses: `GET /answers/question/:questionId`

## Error Handling
All endpoints include proper error handling with appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (missing required fields)
- 404: Not Found
- 500: Internal Server Error
