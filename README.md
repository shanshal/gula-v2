# Gula Backend API

A comprehensive Express.js backend API for managing psychological surveys, assessments, and user data. This API provides endpoints for user management, survey administration, question handling, and answer processing with built-in psychological assessment scoring algorithms.

## 🚀 Features

- **User Management**: Complete CRUD operations for user profiles
- **Survey Management**: Create and manage psychological surveys
- **Question Management**: Dynamic question creation with various types
- **Answer Processing**: Bulk answer submission and retrieval
- **Psychological Assessments**: Built-in scoring algorithms for multiple assessment types
- **PostgreSQL Database**: Robust data storage with connection pooling

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gulaBackend
```

2. Install dependencies:
```bash
npm install
```

3. Set up your PostgreSQL database and update the connection details in `db/index.js`

4. Start the server:
```bash
node index.js
```

The server will run on port 8080 by default.

## 🗄️ Database Setup

The application expects the following database tables:

- `users` - User profiles and demographics
- `surveys` - Survey definitions
- `questions` - Survey questions with metadata
- `answers` - User responses to survey questions

## 📚 API Endpoints

### Base URL
```
http://localhost:8080
```

### 1. User Management (`/users`)

#### Get All Users
```http
GET /users
```
**Response**: Array of all user objects
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "sex": "male",
    "weight": 70
  }
]
```

#### Get User by ID
```http
GET /users/:id
```
**Parameters**: `id` - User ID (integer)
**Response**: Single user object

#### Create User
```http
POST /users
```
**Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "age": 25,
  "sex": "female",
  "weight": 60
}
```
**Response**: Success message with new user ID

#### Update User
```http
PUT /users/:id
```
**Parameters**: `id` - User ID (integer)
**Request Body**: Same as create user
**Response**: Success message

#### Delete User
```http
DELETE /users/:id
```
**Parameters**: `id` - User ID (integer)
**Response**: Success message

### 2. Survey Management (`/surveys`)

#### Get All Surveys
```http
GET /surveys
```
**Response**: Array of all survey objects
```json
[
  {
    "id": 1,
    "name": "Leadership Style Assessment"
  }
]
```

#### Get Survey by ID
```http
GET /surveys/:id
```
**Parameters**: `id` - Survey ID (integer)
**Response**: Single survey object

#### Create Survey
```http
POST /surveys
```
**Request Body**:
```json
{
  "name": "New Survey"
}
```
**Response**: New survey object

#### Update Survey
```http
PUT /surveys/:id
```
**Parameters**: `id` - Survey ID (integer)
**Request Body**: Same as create survey
**Response**: Success message

#### Delete Survey
```http
DELETE /surveys/:id
```
**Parameters**: `id` - Survey ID (integer)
**Response**: Success message

### 3. Question Management (`/questions`)

#### Get All Questions
```http
GET /questions
```
**Response**: Array of all question objects

#### Get Question by ID
```http
GET /questions/:id
```
**Parameters**: `id` - Question ID (integer)
**Response**: Single question object

#### Create Question
```http
POST /questions
```
**Request Body**:
```json
{
  "text": "How do you typically make decisions?",
  "survey_id": 1,
  "type": "multiple_choice",
  "is_required": true,
  "options": ["Independently", "With team input", "Based on data"],
  "order_index": 1,
  "placeholder": "Select your answer",
  "help_text": "Choose the option that best describes your approach"
}
```

**Question Types Available**:
- `text` - Text input
- `multiple_choice` - Multiple choice selection
- `numeric` - Numeric input
- `boolean` - Yes/No questions

#### Update Question
```http
PUT /questions/:id
```
**Parameters**: `id` - Question ID (integer)
**Request Body**: Any question fields to update
**Response**: Updated question object

#### Delete Question
```http
DELETE /questions/:id
```
**Parameters**: `id` - Question ID (integer)
**Response**: Success message

### 4. Answer Management (`/answers`)

#### Submit Bulk Answers
```http
POST /answers/bulk
```
**Request Body**:
```json
{
  "answers": [
    {
      "user_id": 1,
      "question_id": 1,
      "answer": "2",
      "survey_id": 1
    },
    {
      "user_id": 1,
      "question_id": 2,
      "answer": "1",
      "survey_id": 1
    }
  ]
}
```
**Response**: Array of created/updated answer objects

#### Get User's Answers
```http
GET /answers/user/:userId
```
**Parameters**: `userId` - User ID (integer)
**Response**: Array of all answers for the specified user

#### Get User's Answers for Specific Survey
```http
GET /answers/survey/:surveyId/user/:userId
```
**Parameters**: 
- `surveyId` - Survey ID (integer)
- `userId` - User ID (integer)
**Response**: Array of answers for the specified user and survey

#### Get Specific Answer
```http
GET /answers/user/:userId/question/:questionId
```
**Parameters**: 
- `userId` - User ID (integer)
- `questionId` - Question ID (integer)
**Response**: Single answer object

## 🧠 Psychological Assessment Protocols

The API includes built-in scoring algorithms for various psychological assessments. These are available in the `protocoles.js` file and can be integrated into your application logic.

### Available Assessment Types

#### 1. Leadership Style Assessment
- **Questions**: 18 questions
- **Scoring**: Authoritarian, Democratic, Laissez-Faire styles
- **Output**: Classification and detailed interpretation

#### 2. Love Languages Assessment
- **Questions**: 30 questions
- **Scoring**: 5 love language categories
- **Output**: Primary/secondary languages with interpretations

#### 3. Somatic Symptom Scale
- **Questions**: Variable number
- **Scoring**: 0-30 point scale
- **Output**: Severity classification (Minimal to High)

#### 4. PHQ-9 Depression Screening
- **Questions**: 9 questions
- **Scoring**: 0-27 point scale
- **Output**: Depression severity with clinical recommendations

#### 5. PSS-10 Perceived Stress Scale
- **Questions**: 10 questions
- **Scoring**: 0-40 point scale with reverse scoring
- **Output**: Stress level classification

#### 6. GAD-7 Anxiety Screening
- **Questions**: 8 questions (7 + functional impairment)
- **Scoring**: 0-21 point scale
- **Output**: Anxiety severity with clinical guidance

#### 7. ASRS v1.1 Adult ADHD Screening
- **Questions**: 18 questions (Part A: 6, Part B: 12)
- **Scoring**: Part A (0-24), Part B (0-48)
- **Output**: ADHD likelihood assessment

## 🔧 Usage Examples

### Creating a Complete Assessment Flow

1. **Create a User**:
```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "age": 30, "sex": "male", "weight": 70}'
```

2. **Create a Survey**:
```bash
curl -X POST http://localhost:8080/surveys \
  -H "Content-Type: application/json" \
  -d '{"name": "Leadership Assessment"}'
```

3. **Add Questions**:
```bash
curl -X POST http://localhost:8080/questions \
  -H "Content-Type: application/json" \
  -d '{"text": "I prefer to make decisions independently", "survey_id": 1, "type": "multiple_choice", "options": ["1", "2", "3", "4", "5"]}'
```

4. **Submit Answers**:
```bash
curl -X POST http://localhost:8080/answers/bulk \
  -H "Content-Type: application/json" \
  -d '{"answers": [{"user_id": 1, "question_id": 1, "answer": "4", "survey_id": 1}]}'
```

5. **Retrieve Results**:
```bash
curl http://localhost:8080/answers/survey/1/user/1
```

## 📊 Data Models

### User Schema
```javascript
{
  id: integer (auto-increment),
  name: string,
  email: string,
  age: integer,
  sex: string,
  weight: numeric
}
```

### Survey Schema
```javascript
{
  id: integer (auto-increment),
  name: string
}
```

### Question Schema
```javascript
{
  id: integer (auto-increment),
  text: string,
  survey_id: integer (foreign key),
  type: string,
  is_required: boolean,
  options: json,
  min_value: numeric,
  max_value: numeric,
  order_index: integer,
  placeholder: string,
  help_text: string
}
```

### Answer Schema
```javascript
{
  id: integer (auto-increment),
  user_id: integer (foreign key),
  question_id: integer (foreign key),
  answer: string,
  survey_id: integer (foreign key),
  created_at: timestamp,
  updated_at: timestamp
}
```

## 🚨 Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

Error responses include an `error` field with a descriptive message.

## 🔒 Security Considerations

- Input validation is implemented for all endpoints
- SQL injection protection through parameterized queries
- Consider implementing authentication and authorization for production use
- Validate and sanitize all user inputs

## 🚀 Production Deployment

For production deployment, consider:

1. **Environment Variables**: Use environment variables for database credentials
2. **HTTPS**: Enable HTTPS for secure communication
3. **Rate Limiting**: Implement API rate limiting
4. **Logging**: Add comprehensive logging
5. **Monitoring**: Implement health checks and monitoring
6. **Authentication**: Add JWT or session-based authentication
7. **CORS**: Configure CORS policies appropriately

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For questions or support, please open an issue in the repository or contact the development team.

---

**Note**: This API is designed for psychological assessment purposes. Always ensure compliance with relevant healthcare regulations and ethical guidelines when using psychological assessment tools in clinical or research settings.
