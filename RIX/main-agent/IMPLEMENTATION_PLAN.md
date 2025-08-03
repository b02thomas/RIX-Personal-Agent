# RIX Main Agent - Implementation Plan

## Overview

This document provides a comprehensive implementation roadmap for the RIX Main Agent, the intelligent middleware layer between the RIX Next.js frontend and N8N workflows.

## Architecture Summary

```
RIX Frontend (Next.js) ←→ Main Agent (FastAPI) ←→ N8N Workflows
```

The Main Agent provides:
- **Intelligent Message Routing** - Content analysis to determine appropriate N8N workflow
- **JWT Authentication** - Compatible with RIX frontend authentication
- **Real-time Communication** - WebSocket support for live chat
- **Database Integration** - PostgreSQL compatibility with existing RIX schema
- **N8N Orchestration** - Workflow execution and webhook handling

## Implementation Phases

### Phase 1: Core Setup and Infrastructure (Priority: High)

#### 1.1 Environment Setup
- [ ] Copy `.env.example` to `.env` and configure with your values
- [ ] Ensure PostgreSQL database is accessible with RIX schema
- [ ] Verify N8N instance is running and accessible
- [ ] Install Python dependencies: `pip install -r requirements.txt`

#### 1.2 Database Preparation
- [ ] Ensure existing RIX PostgreSQL database is accessible
- [ ] Verify tables exist: `users`, `conversations`, `messages`, `user_sessions`
- [ ] Test database connection with provided credentials

#### 1.3 Basic Service Startup
- [ ] Start Main Agent: `python main.py`
- [ ] Verify health endpoint: `GET http://localhost:8001/health`
- [ ] Check API documentation: `http://localhost:8001/docs`

**Success Criteria:**
- Main Agent starts without errors
- Health check returns `healthy` status
- API documentation is accessible
- Database connection is established

### Phase 2: Authentication Integration (Priority: High)

#### 2.1 JWT Compatibility Testing
```bash
# Test with RIX frontend JWT token
curl -X POST http://localhost:8001/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_RIX_JWT_TOKEN"}'
```

#### 2.2 Frontend Integration
- [ ] Update RIX frontend to use Main Agent endpoints
- [ ] Modify `/api/conversations/[id]/messages/route.ts` to proxy to Main Agent
- [ ] Test authentication flow between frontend and Main Agent

#### 2.3 Middleware Testing
- [ ] Test protected endpoints require valid JWT
- [ ] Verify user information is correctly extracted
- [ ] Test token expiration handling

**Success Criteria:**
- RIX frontend JWT tokens are validated successfully
- Protected endpoints require authentication
- User context is properly maintained

### Phase 3: Message Processing and Routing (Priority: High)

#### 3.1 Content Analysis Testing
```bash
# Test content analysis
curl -X POST http://localhost:8001/chat/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "What is the weather like today?"}'
```

#### 3.2 Workflow Routing
- [ ] Test different message types route to correct workflows
- [ ] Verify confidence scoring works appropriately
- [ ] Test fallback to Master Brain for ambiguous messages

#### 3.3 N8N Integration
- [ ] Test N8N workflow execution (mock mode first)
- [ ] Verify webhook endpoints receive N8N responses
- [ ] Test error handling for N8N failures

**Success Criteria:**
- Messages are correctly analyzed and routed
- N8N workflows execute successfully
- Responses are processed and stored

### Phase 4: Real-time Communication (Priority: Medium)

#### 4.1 WebSocket Setup
```javascript
// Test WebSocket connection from frontend
const ws = new WebSocket('ws://localhost:8001/ws/chat/USER_ID');
ws.onmessage = (event) => console.log('Received:', event.data);
```

#### 4.2 Live Chat Integration
- [ ] Implement WebSocket connection in RIX frontend
- [ ] Test real-time message delivery
- [ ] Test typing indicators and presence

#### 4.3 Background Processing
- [ ] Test async workflow execution
- [ ] Verify WebSocket notifications for completed workflows
- [ ] Test error notifications

**Success Criteria:**
- WebSocket connections are stable
- Real-time message delivery works
- Background processing notifications are delivered

### Phase 5: Production Deployment (Priority: Medium)

#### 5.1 Configuration
- [ ] Set production environment variables
- [ ] Configure proper JWT secrets
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting

#### 5.2 Monitoring and Logging
- [ ] Set up structured logging
- [ ] Configure health check monitoring
- [ ] Set up error alerting
- [ ] Monitor performance metrics

#### 5.3 Security Hardening
- [ ] Review CORS settings
- [ ] Implement request size limits
- [ ] Set up webhook signature verification
- [ ] Review authentication security

**Success Criteria:**
- Service runs stably in production
- Monitoring and alerting are functional
- Security measures are in place

## Integration Testing Strategy

### 1. Unit Tests
```bash
# Run unit tests (when implemented)
pytest tests/unit/
```

### 2. Integration Tests
```bash
# Test database integration
pytest tests/integration/test_database.py

# Test N8N integration
pytest tests/integration/test_n8n.py

# Test authentication
pytest tests/integration/test_auth.py
```

### 3. End-to-End Tests
```bash
# Test complete message flow
pytest tests/e2e/test_message_flow.py

# Test WebSocket communication
pytest tests/e2e/test_websocket.py
```

### 4. Load Testing
```bash
# Test concurrent connections
python tests/load/test_concurrent_messages.py

# Test WebSocket scaling
python tests/load/test_websocket_load.py
```

## API Endpoint Testing

### Health Check
```bash
curl http://localhost:8001/health
```

### Authentication
```bash
# Verify token
curl -X POST http://localhost:8001/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_JWT_TOKEN"}'

# Get user info
curl http://localhost:8001/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Chat Processing
```bash
# Send message
curl -X POST http://localhost:8001/chat/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "conv-123",
    "content": "Hello, how can you help me today?",
    "message_type": "text"
  }'

# Get conversation messages
curl http://localhost:8001/chat/conversations/conv-123/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### N8N Management
```bash
# Get N8N status
curl http://localhost:8001/n8n/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Trigger workflow manually
curl -X POST http://localhost:8001/n8n/trigger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_type": "master-brain",
    "input_data": {"message": "Test message"},
    "user_id": "user-123",
    "async_execution": false
  }'
```

## Troubleshooting Guide

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database connection
python -c "
import asyncpg
import asyncio
async def test():
    conn = await asyncpg.connect('postgresql://user:pass@localhost/rix_personal_agent')
    print(await conn.fetchval('SELECT 1'))
    await conn.close()
asyncio.run(test())
"
```

#### 2. JWT Token Issues
- Ensure `JWT_SECRET` matches RIX frontend configuration
- Check token expiration times
- Verify algorithm is `HS256`

#### 3. N8N Integration Issues
- Verify N8N instance is accessible
- Check webhook endpoints are configured
- Validate API keys and JWT tokens

#### 4. WebSocket Connection Issues
- Check CORS settings
- Verify WebSocket URL format
- Test network connectivity

### Logging and Debugging

#### Enable Debug Logging
```bash
export DEBUG=true
export LOG_LEVEL=DEBUG
python main.py
```

#### Monitor Logs
```bash
# Follow application logs
tail -f logs/main-agent.log

# Filter specific components
grep "websocket" logs/main-agent.log
grep "n8n" logs/main-agent.log
```

## Performance Optimization

### 1. Database Performance
- Monitor connection pool usage
- Optimize queries with indexes
- Use connection pooling effectively

### 2. N8N Integration Performance
- Implement request timeout handling
- Use async execution for long-running workflows
- Cache workflow status when possible

### 3. WebSocket Performance
- Monitor connection counts
- Implement connection cleanup
- Use heartbeat/ping-pong for connection health

## Security Considerations

### 1. Authentication Security
- Use strong JWT secrets
- Implement token rotation
- Monitor authentication failures

### 2. API Security
- Implement request rate limiting
- Validate all input data
- Use HTTPS in production

### 3. WebSocket Security
- Authenticate WebSocket connections
- Implement message size limits
- Monitor for abuse patterns

## Monitoring and Maintenance

### 1. Health Monitoring
- Monitor `/health` endpoint
- Set up alerting for service downtime
- Track response times

### 2. Performance Monitoring
- Monitor memory usage
- Track database connection counts
- Monitor N8N integration latency

### 3. Error Monitoring
- Track error rates by endpoint
- Monitor N8N workflow failures
- Alert on authentication issues

## Next Steps

After successful implementation:

1. **Performance Tuning** - Optimize based on real usage patterns
2. **Feature Enhancement** - Add advanced AI capabilities
3. **Scaling** - Implement horizontal scaling if needed
4. **Advanced Analytics** - Add detailed usage analytics
5. **Security Hardening** - Regular security audits and updates

## Support and Maintenance

- Monitor service health regularly
- Keep dependencies updated
- Review logs for issues
- Plan for database maintenance
- Document operational procedures

---

**Implementation Status:** Ready for deployment
**Estimated Implementation Time:** 2-3 days for full integration
**Prerequisites:** RIX frontend, PostgreSQL database, N8N instance