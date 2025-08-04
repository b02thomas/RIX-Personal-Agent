# /03-implementation/backend-improvements/api-documentation.md
# Complete API Documentation for RIX Main Agent and Frontend Integration
# Comprehensive reference for all endpoints supporting chat, tasks, projects, voice, mobile
# RELEVANT FILES: app/api/endpoints/chat.py, app/models/chat.py, enhanced-mock-responses.py, intent-recognition.py

# RIX API Documentation

Complete API reference for RIX Personal Agent backend integration.

## Authentication

### JWT Token System
All API endpoints require JWT authentication via HTTP-only cookies:
- `accessToken`: 15-minute expiry, includes user info
- `refreshToken`: 7-day expiry, for token renewal

**Headers Required:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Authentication Flow:**
1. Login via `/api/auth/signin` 
2. Tokens stored as HTTP-only cookies
3. Auto-refresh handled by frontend
4. Logout clears all tokens

---

## Chat & Conversation APIs

### Core Chat Endpoints

#### POST `/api/conversations/{id}/messages`
Send message to Main Agent for AI processing.

**Request:**
```json
{
  "content": "Create a task for tomorrow",
  "messageType": "text", // "text" | "voice" | "image"
  "metadata": {
    "context": "dashboard",
    "voiceData": "base64audio" // for voice messages
  }
}
```

**Response:**
```json
{
  "message": {
    "id": "msg-123",
    "conversationId": "conv-456",
    "content": "I've created a task for tomorrow...",
    "messageType": "text",
    "isFromAi": true,
    "createdAt": "2025-01-01T12:00:00Z",
    "metadata": {
      "workflowType": "task-management",
      "confidence": 0.95,
      "taskCreated": true,
      "taskId": "task-789"
    }
  },
  "aiResponse": {
    "workflowType": "task-management",
    "confidence": 0.95,
    "processingTime": 1.2,
    "suggestions": ["Set reminder", "Add to project"]
  }
}
```

#### GET `/api/conversations/{id}/messages`
Retrieve conversation message history.

**Query Parameters:**
- `limit`: Number of messages (default: 50)
- `offset`: Pagination offset (default: 0)
- `messageType`: Filter by type

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-123",
      "content": "Hello RIX",
      "messageType": "text",
      "isFromAi": false,
      "createdAt": "2025-01-01T12:00:00Z"
    }
  ],
  "total": 25,
  "hasMore": true
}
```

#### GET `/api/conversations`
List user conversations.

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv-123",
      "title": "Daily Planning",
      "lastMessage": "Let's plan your day",
      "messageCount": 12,
      "createdAt": "2025-01-01T12:00:00Z",
      "updatedAt": "2025-01-01T15:30:00Z"
    }
  ]
}
```

---

## Task Management APIs

### Task CRUD Operations

#### GET `/api/tasks`
Retrieve user tasks with filtering and pagination.

**Query Parameters:**
- `status`: "todo" | "in_progress" | "completed" | "blocked"
- `priority`: "low" | "medium" | "high" 
- `projectId`: Filter by project
- `search`: Text search in title/description
- `dueDate`: Filter by due date range
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-123",
      "title": "Implement voice commands",
      "description": "Add voice input to chat interface",
      "status": "in_progress",
      "priority": "high",
      "projectId": "proj-456",
      "assignedTo": "user-789",
      "dueDate": "2025-01-05T00:00:00Z",
      "createdAt": "2025-01-01T12:00:00Z",
      "updatedAt": "2025-01-02T09:30:00Z",
      "completionPercentage": 75,
      "estimatedHours": 8,
      "tags": ["frontend", "voice", "feature"]
    }
  ],
  "total": 42,
  "summary": {
    "todo": 15,
    "in_progress": 8,
    "completed": 18,
    "blocked": 1,
    "high_priority": 5
  }
}
```

#### POST `/api/tasks`
Create new task.

**Request:**
```json
{
  "title": "Implement mobile navigation",
  "description": "Create drawer navigation for mobile",
  "priority": "medium",
  "dueDate": "2025-01-10T00:00:00Z",
  "projectId": "proj-123",
  "tags": ["mobile", "navigation"],
  "estimatedHours": 6
}
```

#### PUT `/api/tasks/{id}`
Update existing task.

#### DELETE `/api/tasks/{id}`
Delete task.

---

## Project Management APIs

### Project Operations

#### GET `/api/projects`
List user projects with health scores.

**Response:**
```json
{
  "projects": [
    {
      "id": "proj-123",
      "name": "RIX Personal Agent",
      "description": "AI-powered productivity assistant",
      "status": "active",
      "priority": "high",
      "healthScore": 85,
      "progress": 75,
      "teamSize": 3,
      "color": "#0066FF",
      "tags": ["ai", "productivity"],
      "createdAt": "2025-01-01T12:00:00Z",
      "updatedAt": "2025-01-02T15:30:00Z",
      "metrics": {
        "tasksTotal": 24,
        "tasksCompleted": 18,
        "velocity": "above_average",
        "riskLevel": "low"
      }
    }
  ]
}
```

#### POST `/api/projects`
Create new project.

#### GET `/api/projects/{id}/health`
Get detailed project health analysis.

**Response:**
```json
{
  "projectId": "proj-123",
  "healthScore": 85,
  "analysis": {
    "codeQuality": 90,
    "teamVelocity": 85,
    "deadlineAdherence": 80,
    "riskFactors": ["testing_coverage", "documentation"]
  },
  "recommendations": [
    "Increase test coverage",
    "Update API documentation",
    "Focus on mobile optimization"
  ],
  "trends": {
    "direction": "improving",
    "velocity": "25% above average",
    "momentum": "positive"
  }
}
```

---

## Voice Processing APIs

### Voice Input Handling

#### POST `/api/voice/process`
Process voice input for commands and transcription.

**Request:**
```json
{
  "audioData": "base64encodedaudio",
  "format": "webm", // "webm" | "wav" | "mp3"
  "duration": 3.2,
  "context": {
    "page": "dashboard",
    "activeProject": "proj-123"
  }
}
```

**Response:**
```json
{
  "transcription": "Create a task for tomorrow",
  "confidence": 0.95,
  "intent": "task_creation",
  "command": {
    "action": "create_task",
    "parameters": {
      "title": "Task for tomorrow",
      "dueDate": "2025-01-02"
    }
  },
  "audioFile": "voice_note_abc123.wav",
  "processingTime": 2.1
}
```

#### GET `/api/voice/commands`
Get available voice commands and examples.

**Response:**
```json
{
  "commands": [
    {
      "category": "tasks",
      "examples": [
        "Create a task to update the documentation",
        "Mark task as completed", 
        "Show my high priority tasks"
      ]
    },
    {
      "category": "navigation", 
      "examples": [
        "Go to projects page",
        "Open calendar view",
        "Show dashboard"
      ]
    }
  ]
}
```

---

## Intelligence & AI APIs

### Routine Coaching

#### GET `/api/intelligence/routine-coaching`
Get AI coaching insights for user routines.

**Response:**
```json
{
  "analysis": {
    "completionRate": 85,
    "strongestHabit": "Morning Exercise",
    "improvementArea": "Evening Reading",
    "streaks": {
      "exercise": 12,
      "meditation": 8,
      "reading": 3
    }
  },
  "coaching": {
    "advice": "Try setting a specific time for reading to build consistency",
    "suggestions": [
      "Start with 5 minutes of reading after dinner",
      "Use reading apps with progress tracking",
      "Set reading reminders"
    ],
    "motivation": "You're doing great with exercise! Let's build that same consistency with reading."
  }
}
```

#### POST `/api/intelligence/routine-optimization`
Get personalized routine optimization suggestions.

### Project Intelligence

#### GET `/api/projects/{id}/intelligence`
AI-powered project insights and recommendations.

**Response:**
```json
{
  "intelligence": {
    "healthAnalysis": {
      "score": 85,
      "factors": ["velocity", "quality", "timeline"],
      "risks": ["testing_coverage"]
    },
    "recommendations": [
      {
        "priority": "high",
        "action": "Increase test coverage",
        "impact": "Reduces technical debt",
        "effort": "medium"
      }
    ],
    "insights": {
      "teamPerformance": "above_average",
      "predictedCompletion": "2025-02-15",
      "riskLevel": "low"
    }
  }
}
```

### Calendar Optimization

#### GET `/api/intelligence/calendar-optimization`
Smart scheduling and time management suggestions.

**Response:**
```json
{
  "optimization": {
    "productiveHours": ["09:00-11:00", "14:00-16:00"],
    "suggestions": [
      {
        "type": "time_blocking",
        "recommendation": "Block 2-hour deep work sessions",
        "timeSlots": ["09:00-11:00", "14:00-16:00"]
      }
    ],
    "availability": {
      "today": ["09:00-10:00", "15:00-16:00"],
      "tomorrow": ["10:00-12:00", "13:00-15:00"]
    }
  }
}
```

---

## N8N Workflow APIs

### Workflow Management

#### GET `/api/n8n/workflows`
List available N8N workflows.

**Response:**
```json
{
  "workflows": [
    {
      "id": "wf-123",
      "name": "Task Management",
      "description": "Automated task creation and management",
      "status": "active",
      "category": "productivity",
      "lastExecution": "2025-01-01T15:30:00Z",
      "executionCount": 142,
      "successRate": 98.5
    }
  ]
}
```

#### POST `/api/n8n/workflows/{id}/execute`
Trigger workflow execution.

**Request:**
```json
{
  "input": {
    "message": "Create a high priority task",
    "context": {
      "userId": "user-123",
      "conversationId": "conv-456"
    }
  }
}
```

#### GET `/api/n8n/analytics`
Get N8N workflow analytics and performance.

---

## Real-time APIs

### WebSocket Connections

#### WebSocket `/ws/chat/{userId}`
Real-time chat updates and notifications.

**Message Types:**
```json
// New message
{
  "type": "new_message",
  "data": {
    "conversationId": "conv-123",
    "message": { /* message object */ }
  }
}

// Typing indicator
{
  "type": "typing",
  "data": {
    "conversationId": "conv-123", 
    "isTyping": true
  }
}

// AI processing status
{
  "type": "processing_status",
  "data": {
    "status": "processing", // "processing" | "completed" | "error"
    "workflow": "task-management",
    "confidence": 0.95
  }
}
```

---

## Mobile-Specific APIs

### Mobile Optimization Endpoints

#### GET `/api/mobile/config`
Get mobile-specific configuration.

**Response:**
```json
{
  "config": {
    "touchTargetSize": 44,
    "gesturesEnabled": true,
    "hapticFeedback": true,
    "voiceInputEnabled": true,
    "offlineMode": false
  }
}
```

#### POST `/api/mobile/haptic`
Trigger haptic feedback for touch events.

#### GET `/api/mobile/performance`
Mobile performance metrics and optimization data.

---

## Error Handling

### Standard Error Format
All API errors follow consistent format:

```json
{
  "error": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-01T12:00:00Z",
  "details": {
    "field": "Additional context",
    "suggestion": "How to fix the issue"
  }
}
```

### Common Error Codes
- `AUTH_TOKEN_INVALID`: Authentication failed
- `VALIDATION_ERROR`: Request validation failed
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request  
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `429`: Rate Limited
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## Rate Limiting

### Request Limits
- **Authentication**: 10 requests/minute
- **Chat Messages**: 60 requests/minute  
- **API Calls**: 1000 requests/hour
- **Voice Processing**: 20 requests/minute
- **Bulk Operations**: 10 requests/minute

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## Pagination

### Standard Pagination
All list endpoints support pagination:

**Query Parameters:**
- `limit`: Items per page (1-100, default: 50)
- `offset`: Number of items to skip (default: 0)
- `sort`: Sort field (default: `created_at`)
- `order`: Sort direction (`asc` | `desc`, default: `desc`)

**Response Headers:**
```
X-Total-Count: 150
X-Page-Count: 3
Link: </api/tasks?offset=50&limit=50>; rel="next"
```

---

## Data Formats

### Date/Time Format
All timestamps use ISO 8601 format:
```
2025-01-01T12:00:00Z
```

### File Uploads
Voice files and attachments:
- **Formats**: WebM, WAV, MP3 (voice); PNG, JPG (images)
- **Size Limit**: 10MB per file
- **Encoding**: Base64 for JSON payloads, multipart/form-data for direct uploads

### Search Queries
Text search supports:
- **Fuzzy matching**: Handles typos and partial matches
- **Boolean operators**: AND, OR, NOT
- **Field-specific**: `title:task description:bug`
- **Filters**: Combined with query parameters

---

## Security

### Authentication Security
- JWT tokens with short expiry (15 minutes)
- HTTP-only cookies prevent XSS
- Refresh token rotation
- CSRF protection via SameSite cookies

### API Security
- Rate limiting per user and IP
- Input validation and sanitization  
- SQL injection prevention
- CORS configuration for frontend origins
- Request size limits (10MB max)

### Data Privacy
- User data isolation by user ID
- Encrypted sensitive data at rest
- Audit logging for data access
- GDPR compliance for data deletion

---

## Testing

### Mock Mode
Development environment supports mock responses:
- Set `NODE_ENV=development` and `AUTH_MODE=mock`
- Realistic mock data for all endpoints
- Simulated processing delays
- No external dependencies required

### API Testing
```bash
# Health check
curl -X GET http://localhost:8001/health

# Authentication test
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@rix.com","password":"test123"}'

# Chat message test
curl -X POST http://localhost:3000/api/conversations/conv-123/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content":"Create a task","messageType":"text"}'
```

### WebSocket Testing
```javascript
const ws = new WebSocket('ws://localhost:8001/ws/chat/user-123');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

---

## Integration Guide

### Frontend Integration
1. **Authentication**: Handle JWT tokens and refresh flow
2. **Error Handling**: Implement standard error response parsing
3. **Real-time**: Connect WebSocket for live updates
4. **Mobile**: Use mobile-specific optimizations
5. **Voice**: Integrate Web Speech API with backend processing

### Main Agent Integration
1. **Pattern Recognition**: Route messages to appropriate N8N workflows
2. **Context Management**: Maintain conversation context and user state
3. **Performance**: Optimize response times and concurrent requests
4. **Monitoring**: Track workflow execution and system health

### N8N Integration
1. **Workflow Registration**: Discover and register available workflows
2. **Execution Monitoring**: Track workflow runs and success rates
3. **Error Recovery**: Handle workflow failures gracefully
4. **Data Flow**: Pass context between RIX and N8N systems

---

This API documentation provides comprehensive coverage for all RIX frontend features including chat interface, task management, project tracking, voice input, mobile optimization, and AI intelligence features.