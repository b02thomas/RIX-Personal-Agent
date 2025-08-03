# RIX Main Agent

Intelligent middleware layer for the RIX Personal Agent project, providing AI processing, message routing, and real-time communication between the Next.js frontend and N8N workflows.

## Features

- **🧠 Intelligent Message Routing** - AI-powered content analysis to route messages to appropriate N8N workflows
- **🔐 JWT Authentication** - Seamless integration with RIX frontend authentication system
- **⚡ Real-time Communication** - WebSocket support for live chat and notifications
- **🗄️ Database Integration** - Compatible with existing RIX PostgreSQL schema
- **🔄 N8N Orchestration** - Execute and manage N8N workflows with webhook handling
- **📊 Health Monitoring** - Comprehensive health checks and system monitoring
- **🚀 Production Ready** - Docker support, structured logging, and error handling

## Architecture

```
┌─────────────────┐    HTTP/WebSocket    ┌─────────────────┐    HTTP/Webhooks    ┌─────────────────┐
│   RIX Frontend  │ ←─────────────────→ │  Main Agent     │ ←─────────────────→ │  N8N Workflows  │
│   (Next.js)     │                     │   (FastAPI)     │                     │ (SMB-AI-Solution)│
└─────────────────┘                     └─────────────────┘                     └─────────────────┘
                                               │
                                               ▼
                                        ┌─────────────────┐
                                        │   PostgreSQL    │
                                        │   Database      │
                                        └─────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 14+ with existing RIX database
- N8N instance (SMB-AI-Solution)
- RIX frontend running

### Installation

1. **Clone and Setup**
   ```bash
   cd main-agent
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the Service**
   ```bash
   python main.py
   ```

4. **Verify Installation**
   ```bash
   curl http://localhost:8001/health
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | `false` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8001` |
| `JWT_SECRET` | JWT secret (must match RIX frontend) | Required |
| `DB_*` | Database connection settings | Required |
| `N8N_BASE_URL` | N8N instance URL | Required |
| `N8N_API_KEY` | N8N API key | Optional |
| `N8N_JWT_TOKEN` | N8N JWT token | Optional |

### N8N Workflow Integration

The Main Agent integrates with these N8N workflows:

- **Master Brain Orchestrator** - Central AI processing
- **Voice Processing Pipeline** - Speech recognition and processing
- **News Intelligence Engine** - Personalized news analysis
- **Calendar Intelligence System** - Smart calendar management
- **Task Management Automation** - Task and project management
- **Project Chatbot Engine** - Project-specific assistance
- **Morning Brief Generator** - Daily briefings and summaries
- **Notification Management** - Intelligent notifications
- **Analytics Learning Engine** - Usage analytics and insights

## API Documentation

### Authentication

All endpoints (except health checks and webhooks) require JWT authentication compatible with the RIX frontend.

**Headers:**
```
Authorization: Bearer <jwt_token>
```
or
```
Cookie: accessToken=<jwt_token>
```

### Core Endpoints

#### Health Check
```http
GET /health
```

#### Message Processing
```http
POST /chat/message
Content-Type: application/json

{
  "conversation_id": "conv-123",
  "content": "Hello, how can you help me today?",
  "message_type": "text",
  "metadata": {}
}
```

#### Content Analysis
```http
POST /chat/analyze
Content-Type: application/json

{
  "content": "What's the weather like today?",
  "context": {}
}
```

#### N8N Status
```http
GET /n8n/status
```

#### WebSocket Connection
```
WS /ws/chat/{user_id}
```

### Webhook Endpoints

#### N8N Webhook Handler
```http
POST /webhooks/n8n/{workflow_type}
X-N8N-Signature: sha256=<signature>
```

## WebSocket Events

### Client → Server
- `message` - Send chat message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

### Server → Client
- `message_update` - New message received
- `ai_response` - AI response received
- `processing_status` - Processing status update
- `error` - Error notification
- `system_notification` - System notification

## Development

### Project Structure

```
main-agent/
├── app/
│   ├── api/
│   │   ├── endpoints/     # API route handlers
│   │   └── webhooks/      # Webhook handlers
│   ├── core/              # Core configuration and logging
│   ├── middleware/        # Authentication middleware
│   ├── models/            # Pydantic models
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── tests/                 # Test files
├── config/               # Configuration files
├── requirements.txt      # Python dependencies
├── main.py              # Application entry point
├── Dockerfile           # Docker configuration
└── docker-compose.yml   # Docker Compose setup
```

### Running Tests

```bash
# Unit tests
pytest tests/unit/

# Integration tests
pytest tests/integration/

# End-to-end tests
pytest tests/e2e/
```

### Docker Development

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in production mode
docker-compose -f docker-compose.prod.yml up
```

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t rix-main-agent .

# Run container
docker run -p 8001:8001 --env-file .env rix-main-agent
```

### Production Configuration

1. **Security**
   - Use strong JWT secrets
   - Enable HTTPS
   - Configure proper CORS settings
   - Set up webhook signature verification

2. **Performance**
   - Configure connection pooling
   - Set appropriate timeouts
   - Monitor resource usage

3. **Monitoring**
   - Set up health check monitoring
   - Configure logging aggregation
   - Set up error alerting

## Integration with RIX Frontend

### Frontend Changes Required

1. **Update Message API Route**
   ```typescript
   // In src/app/api/conversations/[id]/messages/route.ts
   // Proxy POST requests to Main Agent
   const response = await fetch(`${MAIN_AGENT_URL}/chat/message`, {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${accessToken}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(messageData)
   });
   ```

2. **WebSocket Integration**
   ```typescript
   // Add to chat components
   const ws = new WebSocket(`ws://localhost:8001/ws/chat/${userId}`);
   ws.onmessage = (event) => {
     const data = JSON.parse(event.data);
     handleWebSocketMessage(data);
   };
   ```

3. **Environment Variables**
   ```env
   # Add to RIX frontend .env.local
   NEXT_PUBLIC_MAIN_AGENT_URL=http://localhost:8001
   NEXT_PUBLIC_MAIN_AGENT_WS_URL=ws://localhost:8001
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify PostgreSQL is running
   - Check connection credentials
   - Ensure database exists

2. **JWT Authentication Failed**
   - Verify JWT_SECRET matches frontend
   - Check token expiration
   - Validate token format

3. **N8N Integration Issues**
   - Verify N8N instance is accessible
   - Check API keys and tokens
   - Test webhook connectivity

4. **WebSocket Connection Issues**
   - Check CORS configuration
   - Verify network connectivity
   - Monitor connection logs

### Debug Mode

```bash
export DEBUG=true
export LOG_LEVEL=DEBUG
python main.py
```

### Health Monitoring

```bash
# Check service health
curl http://localhost:8001/health

# Detailed health check
curl http://localhost:8001/health/detailed

# Check specific components
curl http://localhost:8001/n8n/status
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run tests and linting
6. Submit a pull request

## License

This project is part of the RIX Personal Agent system and is licensed under the same terms as the main project.

## Support

For issues and questions:
1. Check the [Implementation Plan](IMPLEMENTATION_PLAN.md)
2. Review the troubleshooting guide
3. Check service logs
4. Create an issue with detailed information

---

**Status:** Production Ready ✅  
**Version:** 1.0.0  
**Compatibility:** RIX Frontend v0.1.0+