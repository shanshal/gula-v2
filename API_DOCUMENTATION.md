# Gula Backend API Documentation

A comprehensive survey management system with weighted scoring, validation, and flexible survey types.

## Table of Contents
- [Overview](#overview)
- [Survey Endpoints](#survey-endpoints)
- [Answer Endpoints](#answer-endpoints)
- [User Endpoints](#user-endpoints)
- [Question Endpoints](#question-endpoints)
- [Scoring Endpoints](#scoring-endpoints)
- [Survey Type Examples](#survey-type-examples)
- [Common Operations](#common-operations)

## Overview

The Gula Backend API provides a complete survey management system with support for:
- Multiple survey types (sum, grouped, paired-options, formula, mixed_sign)
- Weighted scoring with question-level weights and overrides
- Comprehensive validation
- Partial survey updates (PATCH)
- Bulk answer submission

**Base URL**: Your server URL (e.g., `https://gula-v2.onrender.com`)

## Survey Endpoints

### GET /surveys
**Behavior**: Retrieve all surveys in the system
**Input**: None
**Output**: Array of survey objects with basic information

```json
[
  {
    "id": 1,
    "name": "Customer Satisfaction Survey",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /surveys/:id
**Behavior**: Get a specific survey with all questions and configuration
**Input**: Survey ID in URL path
**Output**: Complete survey object with questions

```json
{
  "survey": {
    "id": 1,
    "name": "Customer Satisfaction Survey",
    "metadata": {
      "category": "feedback",
      "language": "en"
    },
    "scoring": {
      "type": "sum",
      "mappings": {...},
      "weight_overrides": {...}
    },
    "status": "active"
  },
  "questions": [
    {
      "id": 1,
      "question_text": "How satisfied are you?",
      "question_type": "radio",
      "options": ["Very Satisfied", "Satisfied", "Neutral"]
    }
  ]
}
```

### POST /surveys/create
**Behavior**: Create a new survey with questions, scoring, and weights
**Input**: Complete survey JSON object
**Output**: Created survey with assigned IDs

### PUT /surveys/:id
**Behavior**: Update survey metadata, scoring, and status (not questions)
**Input**: Survey ID + updated fields
**Output**: Success message

### PATCH /surveys/:id
**Behavior**: Partially update specific survey fields with deep merge
**Input**: Survey ID + partial update object
**Output**: Success message with updated fields list

### DELETE /surveys/:id
**Behavior**: Permanently delete survey and all associated data
**Input**: Survey ID in URL path
**Output**: Deletion confirmation message

## Answer Endpoints

### POST /answers/user/:userId/survey/:surveyId
**Behavior**: Submit multiple answers for a user and survey
**Input**: User ID, Survey ID, array of answer objects
**Output**: Success confirmation with submission count

```json
{
  "success": true,
  "submitted_count": 5,
  "message": "Answers submitted successfully"
}
```

### GET /answers/user/:userId/survey/:surveyId
**Behavior**: Retrieve all answers for a specific user and survey
**Input**: User ID and Survey ID in URL path
**Output**: Array of answer objects

## User Endpoints

### GET /users
**Behavior**: Get all registered users
**Input**: None
**Output**: Array of user objects

### GET /users/:id
**Behavior**: Get a specific user by ID
**Input**: User ID in URL path
**Output**: User object

### POST /users
**Behavior**: Create a new user with validation
**Input**: User data (name, email required)
**Output**: Created user with assigned ID

### PUT /users/:id
**Behavior**: Update user information
**Input**: User ID + updated user data
**Output**: Update confirmation

### DELETE /users/:id
**Behavior**: Delete a user
**Input**: User ID in URL path
**Output**: Deletion confirmation

## Question Endpoints

### GET /questions
**Behavior**: Get all questions from all surveys
**Input**: None
**Output**: Array of all question objects

### GET /questions/:id
**Behavior**: Get a specific question by ID
**Input**: Question ID in URL path
**Output**: Question object

### GET /questions/survey/:surveyId
**Behavior**: Get all questions for a specific survey
**Input**: Survey ID in URL path
**Output**: Array of question objects for the survey

### POST /questions
**Behavior**: Create a new question for an existing survey
**Input**: Question data including survey_id
**Output**: Created question object

### PUT /questions/:id
**Behavior**: Update an existing question
**Input**: Question ID + updated question data
**Output**: Update confirmation

### DELETE /questions/:id
**Behavior**: Delete a question and its answers
**Input**: Question ID in URL path
**Output**: Deletion confirmation

## Scoring Endpoints

### GET /scoring/:surveyId/user/:userId/score
**Behavior**: Calculate and return the score for a user's survey responses
**Input**: Survey ID and User ID in URL path
**Output**: Calculated score with detailed breakdown

```json
{
  "score": 8.5,
  "total": 8.5,
  "breakdown": {
    "1": {
      "original": "Yes",
      "mapped": 1,
      "weight": 3,
      "weighted": 3
    }
  },
  "surveyId": 1,
  "userId": 1,
  "scoringType": "sum",
  "responseCount": 10
}
```

## Survey Type Examples

### 1. Sum Scoring Survey
Simple addition of weighted mapped values.

```json
{
  "name": "Customer Satisfaction Survey",
  "metadata": {
    "category": "feedback",
    "language": "en",
    "description": "Measures customer satisfaction levels"
  },
  "status": "draft",
  "questions": [
    {
      "question_text": "How satisfied are you with our service?",
      "type": "radio",
      "is_required": true,
      "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
      "question_order": 1,
      "weight": 2
    },
    {
      "question_text": "Would you recommend us to others?",
      "type": "radio",
      "is_required": true,
      "options": ["Definitely", "Probably", "Maybe", "Probably Not", "Definitely Not"],
      "question_order": 2,
      "weight": 3
    }
  ],
  "scoring": {
    "type": "sum",
    "mappings": {
      "1": {
        "Very Satisfied": 5,
        "Satisfied": 4,
        "Neutral": 3,
        "Dissatisfied": 2,
        "Very Dissatisfied": 1
      },
      "2": {
        "Definitely": 5,
        "Probably": 4,
        "Maybe": 3,
        "Probably Not": 2,
        "Definitely Not": 1
      }
    },
    "weight_overrides": {
      "2": 4
    },
    "thresholds": {
      "0-4": "Poor satisfaction",
      "5-7": "Average satisfaction",
      "8-10": "Good satisfaction"
    }
  },
  "interpretation": {
    "0-4": "Consider significant improvements to service quality",
    "5-7": "Service is acceptable but has room for improvement",
    "8-10": "Excellent service quality maintained"
  }
}
```

### 2. Grouped Scoring Survey
Groups questions and calculates separate scores for each group.

```json
{
  "name": "Leadership Assessment",
  "metadata": {
    "category": "assessment",
    "language": "en",
    "description": "Evaluates leadership skills across different dimensions"
  },
  "status": "draft",
  "questions": [
    {
      "question_text": "I effectively communicate vision to my team",
      "type": "radio",
      "is_required": true,
      "options": ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
      "question_order": 1,
      "weight": 1.5
    },
    {
      "question_text": "I listen actively to team members",
      "type": "radio",
      "is_required": true,
      "options": ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
      "question_order": 2,
      "weight": 1.2
    },
    {
      "question_text": "I make decisions confidently",
      "type": "radio",
      "is_required": true,
      "options": ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
      "question_order": 3,
      "weight": 2
    },
    {
      "question_text": "I delegate tasks effectively",
      "type": "radio",
      "is_required": true,
      "options": ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
      "question_order": 4,
      "weight": 1.8
    }
  ],
  "scoring": {
    "type": "grouped",
    "mappings": {
      "1": {"Strongly Agree": 5, "Agree": 4, "Neutral": 3, "Disagree": 2, "Strongly Disagree": 1},
      "2": {"Strongly Agree": 5, "Agree": 4, "Neutral": 3, "Disagree": 2, "Strongly Disagree": 1},
      "3": {"Strongly Agree": 5, "Agree": 4, "Neutral": 3, "Disagree": 2, "Strongly Disagree": 1},
      "4": {"Strongly Agree": 5, "Agree": 4, "Neutral": 3, "Disagree": 2, "Strongly Disagree": 1}
    },
    "groups": {
      "communication": [1, 2],
      "decision_making": [3, 4]
    },
    "weight_overrides": {
      "3": 2.5
    }
  },
  "interpretation": {
    "communication": {
      "0-4": "Needs significant improvement in communication skills",
      "5-7": "Good communication with room for growth",
      "8-10": "Excellent communication skills"
    },
    "decision_making": {
      "0-4": "Decision-making skills need development",
      "5-7": "Solid decision-making abilities",
      "8-10": "Outstanding decision-making skills"
    }
  }
}
```

### 3. Paired-Options Survey
Users choose between paired options to determine preferences/personality.

```json
{
  "name": "Work Style Assessment",
  "metadata": {
    "category": "personality",
    "language": "en",
    "description": "Determines preferred work style and approach"
  },
  "status": "draft",
  "questions": [
    {
      "question_text": "Choose your preferred approach:",
      "type": "radio",
      "is_required": true,
      "options": ["Detailed Planning", "Flexible Adaptation"],
      "question_order": 1,
      "weight": 1
    },
    {
      "question_text": "In team settings, you prefer:",
      "type": "radio",
      "is_required": true,
      "options": ["Leading Discussions", "Supporting Others"],
      "question_order": 2,
      "weight": 1
    },
    {
      "question_text": "When facing challenges:",
      "type": "radio",
      "is_required": true,
      "options": ["Analyze Thoroughly", "Act Quickly"],
      "question_order": 3,
      "weight": 1
    }
  ],
  "scoring": {
    "type": "paired-options",
    "categories": {
      "planner": {
        "options": ["Detailed Planning", "Leading Discussions", "Analyze Thoroughly"],
        "description": "Structured and methodical approach"
      },
      "adaptor": {
        "options": ["Flexible Adaptation", "Supporting Others", "Act Quickly"],
        "description": "Flexible and responsive approach"
      }
    }
  },
  "interpretation": {
    "planner": "You prefer structured, planned approaches to work and leadership",
    "adaptor": "You thrive in flexible, adaptive work environments"
  }
}
```

### 4. Formula Scoring Survey
Uses mathematical expressions to calculate scores.

```json
{
  "name": "Risk Assessment Calculator",
  "metadata": {
    "category": "assessment",
    "language": "en",
    "description": "Calculates risk score using weighted formula"
  },
  "status": "draft",
  "questions": [
    {
      "question_text": "Years of experience in this field:",
      "type": "number",
      "is_required": true,
      "min_value": 0,
      "max_value": 50,
      "question_order": 1,
      "weight": 0.3
    },
    {
      "question_text": "Risk tolerance level (1-10):",
      "type": "number",
      "is_required": true,
      "min_value": 1,
      "max_value": 10,
      "question_order": 2,
      "weight": 0.4
    },
    {
      "question_text": "Previous incidents count:",
      "type": "number",
      "is_required": true,
      "min_value": 0,
      "max_value": 100,
      "question_order": 3,
      "weight": 0.3
    }
  ],
  "scoring": {
    "type": "formula",
    "mappings": {
      "1": "direct",
      "2": "direct", 
      "3": "direct"
    },
    "formula": "(experience * 0.3) + (risk_tolerance * 0.4) - (incidents * 0.3)",
    "variables": {
      "experience": 1,
      "risk_tolerance": 2,
      "incidents": 3
    },
    "weight_overrides": {
      "2": 0.5
    }
  },
  "interpretation": {
    "0-3": "High risk profile - requires additional oversight",
    "4-6": "Moderate risk profile - standard procedures apply",
    "7-10": "Low risk profile - minimal oversight required"
  }
}
```

### 5. Mixed Sign Scoring Survey
Handles both positive and negative scoring values.

```json
{
  "name": "Stress Level Assessment",
  "metadata": {
    "category": "health",
    "language": "en",
    "description": "Measures stress levels with positive and negative indicators"
  },
  "status": "draft",
  "questions": [
    {
      "question_text": "I feel overwhelmed by my workload",
      "type": "radio",
      "is_required": true,
      "options": ["Never", "Rarely", "Sometimes", "Often", "Always"],
      "question_order": 1,
      "weight": 2
    },
    {
      "question_text": "I have effective coping strategies",
      "type": "radio",
      "is_required": true,
      "options": ["Never", "Rarely", "Sometimes", "Often", "Always"],
      "question_order": 2,
      "weight": 1.5
    },
    {
      "question_text": "I get adequate sleep",
      "type": "radio",
      "is_required": true,
      "options": ["Never", "Rarely", "Sometimes", "Often", "Always"],
      "question_order": 3,
      "weight": 1.8
    }
  ],
  "scoring": {
    "type": "mixed_sign",
    "mappings": {
      "1": {
        "Never": -2,
        "Rarely": -1,
        "Sometimes": 0,
        "Often": 1,
        "Always": 2
      },
      "2": {
        "Never": 2,
        "Rarely": 1,
        "Sometimes": 0,
        "Often": -1,
        "Always": -2
      },
      "3": {
        "Never": 2,
        "Rarely": 1,
        "Sometimes": 0,
        "Often": -1,
        "Always": -2
      }
    },
    "weight_overrides": {
      "1": 2.5
    }
  },
  "interpretation": {
    "-10--5": "High stress levels - consider professional support",
    "-4-0": "Moderate stress - implement stress management techniques",
    "1-5": "Low stress levels - maintain current practices",
    "6-10": "Excellent stress management"
  }
}
```

## Common Operations

### Finding All Available Surveys

```bash
curl -X GET "https://your-server.com/surveys" \
  -H "accept: application/json"
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Customer Satisfaction Survey",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Leadership Assessment",
    "status": "draft",
    "created_at": "2024-01-02T00:00:00.000Z",
    "updated_at": "2024-01-02T00:00:00.000Z"
  }
]
```

### Editing a Survey (Partial Update with PATCH)

Update only specific fields without sending the entire survey:

```bash
curl -X PATCH "https://your-server.com/surveys/1" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "metadata": {
      "version": "2.0",
      "updated_by": "Admin"
    }
  }'
```

**Response:**
```json
{
  "message": "Survey 1 updated successfully",
  "updatedFields": ["status", "metadata"],
  "survey": {
    "id": 1,
    "name": "Customer Satisfaction Survey",
    "status": "active",
    "metadata": {
      "category": "feedback",
      "language": "en",
      "version": "2.0",
      "updated_by": "Admin"
    }
  }
}
```

### Updating Survey Scoring Configuration

```bash
curl -X PATCH "https://your-server.com/surveys/1" \
  -H "Content-Type: application/json" \
  -d '{
    "scoring": {
      "weight_overrides": {
        "1": 3,
        "2": 2.5
      },
      "thresholds": {
        "0-3": "Low satisfaction",
        "4-7": "Medium satisfaction", 
        "8-10": "High satisfaction"
      }
    }
  }'
```

### Deleting a Survey

```bash
curl -X DELETE "https://your-server.com/surveys/1" \
  -H "accept: application/json"
```

**Response:**
```json
{
  "message": "Survey deleted 1"
}
```

### Submitting Answers as JSON

Submit multiple answers for a user and survey:

```bash
curl -X POST "https://your-server.com/answers/user/1/survey/1" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "question_id": 1,
      "answer_value": "Very Satisfied",
      "answer_text": "Excellent service quality"
    },
    {
      "question_id": 2,
      "answer_value": "Definitely"
    },
    {
      "question_id": 3,
      "answer_value": 5
    },
    {
      "question_id": 4,
      "answer_value": true,
      "answer_text": "Yes, I agree completely"
    }
  ]'
```

**Response:**
```json
{
  "success": true,
  "submitted_count": 4,
  "message": "Answers submitted successfully"
}
```

### Getting Survey Score

Calculate the weighted score for submitted answers:

```bash
curl -X GET "https://your-server.com/scoring/1/user/1/score" \
  -H "accept: application/json"
```

**Response:**
```json
{
  "score": 27.5,
  "total": 27.5,
  "breakdown": {
    "1": {
      "original": "Very Satisfied",
      "mapped": 5,
      "weight": 3,
      "weighted": 15
    },
    "2": {
      "original": "Definitely", 
      "mapped": 5,
      "weight": 2.5,
      "weighted": 12.5
    }
  },
  "surveyId": 1,
  "userId": 1,
  "scoringType": "sum",
  "responseCount": 2
}
```

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "questions[0].weight",
      "message": "Weight must be a non-negative number"
    },
    {
      "field": "name",
      "message": "Survey name is required"
    }
  ]
}
```

## Weight System

The API supports a flexible weight system:

1. **Question-level weights**: Set `weight` property on individual questions (default: 1)
2. **Scoring-level overrides**: Use `weight_overrides` in scoring configuration to override specific question weights
3. **Priority**: `weight_overrides` > question-level `weight` > default (1)

Example weight calculation:
- Question has `weight: 2`
- Scoring has `weight_overrides: {"1": 3}`
- Final weight used: `3` (override takes priority)
- If answer maps to value `5`: `5 × 3 = 15` contribution to total score

## Field Name Compatibility

The API accepts both field name formats for questions:
- `question_text` or `text` (for question content)
- `question_type` or `type` (for question type)

This ensures compatibility with different client implementations.
