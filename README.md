# Backend Wizard — Stage 0

API endpoint that classifies a name by gender using the Genderize API.

## Endpoint

GET /api/classify?name={name}

## Example

Request:
GET /api/classify?name=john

Response:
{
  "status": "success",
  "data": {
    "name": "john",
    "gender": "male",
    "probability": 0.99,
    "sample_size": 1234,
    "is_confident": true,
    "processed_at": "2026-04-13T10:30:00.000Z"
  }
}

## Error Responses

- 400: Missing or empty name parameter
- 422: name must be a string
- 500/502: Server or upstream error

## Tech Stack

- Node.js
- Express
- Axios