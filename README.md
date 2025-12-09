# Survey Service

A microservice for managing surveys, questions, and user responses, integrated with the Gula Health App ecosystem.

## Features

- Survey management (creation, retrieval, updates)
- Question management with various question types
- User response collection and management
- Survey scoring and interpretation
- Integration with auth microservice for user management

## Architecture

This service is part of a microservices architecture and communicates with:

- **Auth Service**: For user authentication and user profile management
- **API Gateway**: For request routing and JWT validation
- **Database**: PostgreSQL for data persistence

## User Management Integration

The survey service has been updated to use the auth microservice for user-related operations instead of maintaining a local User model. User validation and profile access are handled through HTTP API calls to the auth service.

### Key Integration Points

- `src/services/authClient.js`: HTTP client for communicating with the auth service
- User existence validation in survey response endpoints
- User ID validation using auth service's internal API

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/survey_db

# Auth Service Integration
AUTH_SERVICE_URL=http://localhost:3001
INTERNAL_ACCESS_TOKEN=your_internal_access_token_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

## API Endpoints

### Surveys
- `GET /surveys` - List all surveys
- `GET /surveys/:id` - Get survey by ID
- `POST /surveys` - Create new survey
- `PUT /surveys/:id` - Update survey
- `DELETE /surveys/:id` - Delete survey

### Questions
- `GET /surveys/:surveyId/questions` - Get questions for a survey
- `POST /surveys/:surveyId/questions` - Add question to survey
- `PUT /questions/:id` - Update question
- `DELETE /questions/:id` - Delete question

### Answers
- `GET /answers/user/:userId` - Get all answers for a user
- `GET /answers/user/:userId/survey/:surveyId` - Get user's answers for specific survey
- `POST /answers/user/:userId/survey/:surveyId` - Submit answers for a survey
- `DELETE /answers/user/:userId/all` - Delete all answers for a user

### Scoring
- `GET /scoring/:surveyId/user/:userId/score` - Calculate and get survey score
- `GET /scoring/:surveyId/result-pages` - Get result pages configuration

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (copy `.env.example` to `.env` and update values)

3. Run database migrations/setup if needed

4. Start the service:
   ```bash
   npm start
   ```

   For development:
   ```bash
   npm run dev
   ```

## Dependencies

- **axios**: For HTTP communication with auth service
- **express**: Web framework
- **sequelize**: ORM for database operations
- **pg**: PostgreSQL client
- **express-validator**: Request validation
- **helmet**: Security headers
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: Rate limiting

## Migration from Local User Model

This service was migrated from using a local User model to integrating with the auth microservice:

1. **Removed**: Local User model and associations
2. **Added**: AuthClient service for HTTP communication
3. **Updated**: Controllers to use auth service API calls
4. **Maintained**: `user_id` foreign key references in Answer model

The migration ensures backward compatibility while enabling centralized user management through the auth service.