# RIX Main Agent - Phase 6: Frontend Developer Integration Guide

## Overview

This guide provides frontend developers with everything needed to integrate with the RIX Main Agent Phase 6 N8N workflow management system. The Main Agent now includes comprehensive workflow discovery, AI-triggered executions, and analytics features.

## Architecture Summary

```
RIX Frontend (Next.js) ←→ RIX Main Agent (FastAPI) ←→ N8N MCP Endpoints (LLM Processing)
        │                          │                           │
        │                          ├── PostgreSQL (Workflows)  │
        │                          ├── Redis (Cache)           │
        │                          └── Prometheus (Metrics)    │
        │                                                      │
        └── WebSocket Connection ──────────────────────────────┘
```

### Key Integration Points

1. **HTTP API**: RESTful endpoints for workflow management
2. **WebSocket**: Real-time updates and processing status
3. **Authentication**: JWT-based authentication compatible with frontend
4. **Workflow Types**: Enhanced workflow routing and execution
5. **Analytics**: Performance metrics and usage statistics

## Quick Start Integration

### 1. Environment Configuration

Add these variables to your RIX frontend `.env.local`:

```bash
# Main Agent Integration
NEXT_PUBLIC_MAIN_AGENT_URL=http://localhost:8001
NEXT_PUBLIC_MAIN_AGENT_WS_URL=ws://localhost:8001
NEXT_PUBLIC_N8N_INTEGRATION_ENABLED=true
NEXT_PUBLIC_INTELLIGENCE_FEATURES_ENABLED=true

# Development settings
NEXT_PUBLIC_MOCK_N8N=false
NEXT_PUBLIC_WORKFLOW_DEBUG=false
```

### 2. API Client Setup

Create an API client for Main Agent integration:

```typescript
// src/lib/main-agent-client.ts
class MainAgentClient {
  private baseUrl: string;
  private wsUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_MAIN_AGENT_URL || 'http://localhost:8001';
    this.wsUrl = process.env.NEXT_PUBLIC_MAIN_AGENT_WS_URL || 'ws://localhost:8001';
  }

  // Health check
  async healthCheck(): Promise<HealthStatus> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }

  // N8N workflow management
  async getWorkflowStatus(): Promise<N8NStatusResponse> {
    const response = await fetch(`${this.baseUrl}/n8n/status`);
    return response.json();
  }

  async getWorkflows(): Promise<N8NWorkflowInfo[]> {
    const response = await fetch(`${this.baseUrl}/n8n/workflows`);
    return response.json();
  }

  async triggerWorkflow(request: WorkflowTriggerRequest): Promise<any> {
    const response = await fetch(`${this.baseUrl}/n8n/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return response.json();
  }

  // Intelligence features
  async routineCoaching(request: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/intelligence/routine-coaching`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return response.json();
  }

  async projectIntelligence(request: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/intelligence/project-intelligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return response.json();
  }

  async calendarOptimization(request: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/intelligence/calendar-optimization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return response.json();
  }

  // WebSocket connection
  connectWebSocket(userId: string): WebSocket {
    return new WebSocket(`${this.wsUrl}/ws/chat/${userId}`);
  }
}

export const mainAgentClient = new MainAgentClient();
```

### 3. TypeScript Interfaces

```typescript
// src/types/main-agent.ts

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    database: 'healthy' | 'unhealthy';
    n8n: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
  };
}

export interface N8NStatusResponse {
  available: boolean;
  response_time?: number;
  active_workflows: number;
  recent_executions: number;
  last_check: string;
  workflows: N8NWorkflowInfo[];
}

export interface N8NWorkflowInfo {
  id: string;
  name: string;
  active: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  version: string;
}

export interface WorkflowTriggerRequest {
  workflow_type: WorkflowType;
  input_data: Record<string, any>;
  user_id: string;
  conversation_id?: string;
  async_execution?: boolean;
}

export enum WorkflowType {
  MASTER_BRAIN = 'master-brain',
  TASK_MANAGEMENT = 'task-management',
  CALENDAR_INTELLIGENCE = 'calendar-intelligence',
  NEWS_INTELLIGENCE = 'news-intelligence',
  VOICE_PROCESSING = 'voice-processing',
  PROJECT_CHATBOT = 'project-chatbot',
  MORNING_BRIEF = 'morning-brief',
  NOTIFICATION_MANAGEMENT = 'notification-management',
  ANALYTICS_LEARNING = 'analytics-learning',
  // Phase 5 Intelligence Features
  ROUTINE_COACHING = 'routine-coaching',
  PROJECT_INTELLIGENCE = 'project-intelligence',
  CALENDAR_OPTIMIZATION = 'calendar-optimization'
}

export interface IntelligenceFeatureRequest {
  message: string;
  context?: Record<string, any>;
  conversation_id?: string;
}

export interface IntelligenceFeatureResponse {
  success: boolean;
  insights?: string;
  analysis?: Record<string, any>;
  recommendations?: Record<string, any>;
  processing_info: {
    workflow_type: string;
    processing_time: number;
    execution_id?: string;
    confidence: number;
  };
  metadata: {
    timestamp: string;
    context_quality: 'high' | 'medium' | 'limited';
    user_id: string;
  };
}
```

## API Endpoints Reference

### Health & Status Endpoints

#### `GET /health`
Basic health check for the Main Agent service.

```typescript
const health = await mainAgentClient.healthCheck();
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "n8n": "healthy",
    "redis": "healthy"
  }
}
```

#### `GET /health/ready`
Readiness check including N8N connectivity.

#### `GET /health/live`
Liveness check for container orchestration.

### N8N Workflow Management

#### `GET /n8n/status`
Get N8N service status and available workflows.

```typescript
const status = await mainAgentClient.getWorkflowStatus();
```

#### `GET /n8n/workflows`
List all available N8N workflows.

```typescript
const workflows = await mainAgentClient.getWorkflows();
```

#### `POST /n8n/trigger`
Manually trigger a workflow execution.

```typescript
const result = await mainAgentClient.triggerWorkflow({
  workflow_type: WorkflowType.TASK_MANAGEMENT,
  input_data: {
    message: "Create a task for tomorrow's meeting",
    priority: "high"
  },
  user_id: "user123",
  conversation_id: "conv456",
  async_execution: true
});
```

#### `GET /n8n/executions/{execution_id}`
Get execution details and status.

#### `POST /n8n/discover`
Discover and categorize available workflows.

#### `POST /n8n/activate`
Activate or deactivate workflows.

#### `GET /n8n/analytics`
Get workflow performance analytics.

### Intelligence Features (Phase 5)

#### `POST /intelligence/routine-coaching`
Analyze user routines and provide coaching suggestions.

```typescript
const coaching = await mainAgentClient.routineCoaching({
  message: "How can I improve my morning routine?",
  context: {
    current_routines: ["meditation", "exercise", "breakfast"],
    goals: ["better_focus", "more_energy"]
  },
  conversation_id: "conv789"
});
```

#### `POST /intelligence/project-intelligence`
Analyze projects and calculate health scores.

```typescript
const projectAnalysis = await mainAgentClient.projectIntelligence({
  message: "Analyze my current project status",
  context: {
    project_focus: "RIX Development",
    include_health_scores: true
  },
  conversation_id: "conv789"
});
```

#### `POST /intelligence/calendar-optimization`
Optimize calendar and provide scheduling suggestions.

```typescript
const calendarOptimization = await mainAgentClient.calendarOptimization({
  message: "Optimize my calendar for next week",
  context: {
    optimization_goals: ["productivity", "work_life_balance"],
    time_range: {
      start: "2024-01-15",
      end: "2024-01-21"
    }
  },
  conversation_id: "conv789"
});
```

#### `GET /intelligence/features/status`
Get status of all intelligence features.

### Webhook Endpoints

#### `POST /webhooks/n8n/{workflow_type}`
Receive webhook responses from N8N workflows.

#### `GET /webhooks/n8n/health`
Webhook endpoint health check.

## WebSocket Integration

### Connection Setup

```typescript
// src/hooks/useMainAgentWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import { mainAgentClient } from '@/lib/main-agent-client';

export function useMainAgentWebSocket(userId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const ws = mainAgentClient.connectWebSocket(userId);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Main Agent WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setLastMessage(message);
      handleWebSocketMessage(message);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Main Agent WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('Main Agent WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [userId]);

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { isConnected, lastMessage, sendMessage };
}

function handleWebSocketMessage(message: any) {
  switch (message.type) {
    case 'workflow_completed':
      // Handle workflow completion
      console.log('Workflow completed:', message);
      break;
    case 'ai_triggered_execution':
      // Handle AI-triggered workflow
      console.log('AI triggered workflow:', message);
      break;
    case 'processing_status':
      // Handle processing status updates
      console.log('Processing status:', message);
      break;
    case 'error_notification':
      // Handle error notifications
      console.error('Workflow error:', message);
      break;
    default:
      console.log('Unknown message type:', message);
  }
}
```

### WebSocket Message Types

```typescript
interface WebSocketMessage {
  type: 'workflow_completed' | 'ai_triggered_execution' | 'processing_status' | 'error_notification';
  data: any;
  timestamp: string;
  user_id: string;
  conversation_id?: string;
}

interface WorkflowCompletedMessage extends WebSocketMessage {
  type: 'workflow_completed';
  data: {
    workflow_type: string;
    execution_id: string;
    result: string;
    processing_time: number;
  };
}

interface ProcessingStatusMessage extends WebSocketMessage {
  type: 'processing_status';
  data: {
    status: 'analyzing_routines' | 'analyzing_projects' | 'optimizing_calendar' | 'processing';
    feature: string;
    context_prepared: boolean;
  };
}
```

## React Components Examples

### Workflow Status Component

```tsx
// src/components/workflow-status.tsx
import { useEffect, useState } from 'react';
import { mainAgentClient } from '@/lib/main-agent-client';
import { N8NStatusResponse } from '@/types/main-agent';

export function WorkflowStatus() {
  const [status, setStatus] = useState<N8NStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const statusData = await mainAgentClient.getWorkflowStatus();
        setStatus(statusData);
      } catch (error) {
        console.error('Failed to fetch workflow status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading workflow status...</div>;
  if (!status) return <div>Failed to load workflow status</div>;

  return (
    <div className="workflow-status">
      <h3>N8N Integration Status</h3>
      <div className={`status-indicator ${status.available ? 'healthy' : 'unhealthy'}`}>
        {status.available ? 'Connected' : 'Disconnected'}
      </div>
      <div className="metrics">
        <span>Active Workflows: {status.active_workflows}</span>
        <span>Recent Executions: {status.recent_executions}</span>
        {status.response_time && (
          <span>Response Time: {status.response_time.toFixed(2)}s</span>
        )}
      </div>
    </div>
  );
}
```

### Intelligence Feature Component

```tsx
// src/components/intelligence-feature.tsx
import { useState } from 'react';
import { mainAgentClient } from '@/lib/main-agent-client';
import { IntelligenceFeatureResponse } from '@/types/main-agent';

interface IntelligenceFeatureProps {
  type: 'routine-coaching' | 'project-intelligence' | 'calendar-optimization';
  userId: string;
  conversationId?: string;
}

export function IntelligenceFeature({ type, userId, conversationId }: IntelligenceFeatureProps) {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<IntelligenceFeatureResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      let result;
      const request = {
        message,
        conversation_id: conversationId,
        context: {} // Add relevant context based on feature type
      };

      switch (type) {
        case 'routine-coaching':
          result = await mainAgentClient.routineCoaching(request);
          break;
        case 'project-intelligence':
          result = await mainAgentClient.projectIntelligence(request);
          break;
        case 'calendar-optimization':
          result = await mainAgentClient.calendarOptimization(request);
          break;
      }

      setResponse(result);
    } catch (error) {
      console.error(`Failed to execute ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getFeatureTitle = () => {
    switch (type) {
      case 'routine-coaching':
        return 'Routine Coaching';
      case 'project-intelligence':
        return 'Project Intelligence';
      case 'calendar-optimization':
        return 'Calendar Optimization';
    }
  };

  return (
    <div className="intelligence-feature">
      <h3>{getFeatureTitle()}</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Ask about ${type.replace('-', ' ')}...`}
          rows={3}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !message.trim()}>
          {loading ? 'Processing...' : 'Analyze'}
        </button>
      </form>

      {response && (
        <div className="response">
          <h4>Analysis Results</h4>
          {response.success ? (
            <div>
              <div className="insights">{response.insights}</div>
              {response.analysis && (
                <div className="analysis">
                  <h5>Analysis Details</h5>
                  <pre>{JSON.stringify(response.analysis, null, 2)}</pre>
                </div>
              )}
              {response.recommendations && (
                <div className="recommendations">
                  <h5>Recommendations</h5>
                  <pre>{JSON.stringify(response.recommendations, null, 2)}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="error">Analysis failed. Please try again.</div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Workflow Trigger Component

```tsx
// src/components/workflow-trigger.tsx
import { useState } from 'react';
import { mainAgentClient } from '@/lib/main-agent-client';
import { WorkflowType } from '@/types/main-agent';

interface WorkflowTriggerProps {
  userId: string;
  conversationId?: string;
}

export function WorkflowTrigger({ userId, conversationId }: WorkflowTriggerProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType>(WorkflowType.MASTER_BRAIN);
  const [inputData, setInputData] = useState('');
  const [asyncExecution, setAsyncExecution] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTrigger = async () => {
    if (!inputData.trim()) return;

    setLoading(true);
    try {
      const response = await mainAgentClient.triggerWorkflow({
        workflow_type: selectedWorkflow,
        input_data: { message: inputData },
        user_id: userId,
        conversation_id: conversationId,
        async_execution: asyncExecution
      });

      setResult(response);
    } catch (error) {
      console.error('Failed to trigger workflow:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workflow-trigger">
      <h3>Manual Workflow Trigger</h3>
      <div className="form-group">
        <label>Workflow Type:</label>
        <select
          value={selectedWorkflow}
          onChange={(e) => setSelectedWorkflow(e.target.value as WorkflowType)}
        >
          {Object.values(WorkflowType).map(type => (
            <option key={type} value={type}>
              {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Input Message:</label>
        <textarea
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder="Enter your message or request..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={asyncExecution}
            onChange={(e) => setAsyncExecution(e.target.checked)}
          />
          Asynchronous Execution
        </label>
      </div>

      <button onClick={handleTrigger} disabled={loading || !inputData.trim()}>
        {loading ? 'Triggering...' : 'Trigger Workflow'}
      </button>

      {result && (
        <div className="result">
          <h4>Execution Result</h4>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

## Error Handling

### API Error Handling

```typescript
// src/lib/api-error-handler.ts
export class MainAgentAPIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: any
  ) {
    super(`API Error: ${status} ${statusText}`);
  }
}

export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new MainAgentAPIError(response.status, response.statusText, errorBody);
  }
  return response.json();
}

// Usage in API client
async getWorkflowStatus(): Promise<N8NStatusResponse> {
  const response = await fetch(`${this.baseUrl}/n8n/status`);
  return handleAPIResponse<N8NStatusResponse>(response);
}
```

### Error Boundary Component

```tsx
// src/components/main-agent-error-boundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MainAgentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Main Agent Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>Main Agent Connection Error</h3>
          <p>There was a problem connecting to the Main Agent service.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Integration

### Mock API Client

```typescript
// src/lib/mock-main-agent-client.ts
export class MockMainAgentClient {
  async healthCheck(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        n8n: 'healthy',
        redis: 'healthy'
      }
    };
  }

  async getWorkflowStatus(): Promise<N8NStatusResponse> {
    return {
      available: true,
      response_time: 0.1,
      active_workflows: 12,
      recent_executions: 25,
      last_check: new Date().toISOString(),
      workflows: [
        {
          id: 'workflow-1',
          name: 'Task Management',
          active: true,
          tags: ['productivity'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: '1.0.0'
        }
      ]
    };
  }

  // Add more mock methods as needed...
}
```

### Jest Tests

```typescript
// src/__tests__/main-agent-integration.test.ts
import { mainAgentClient } from '@/lib/main-agent-client';

describe('Main Agent Integration', () => {
  beforeEach(() => {
    // Setup test environment
  });

  test('should check health status', async () => {
    const health = await mainAgentClient.healthCheck();
    expect(health.status).toBe('healthy');
  });

  test('should get workflow status', async () => {
    const status = await mainAgentClient.getWorkflowStatus();
    expect(status.available).toBe(true);
    expect(status.workflows).toBeInstanceOf(Array);
  });

  test('should trigger workflow', async () => {
    const result = await mainAgentClient.triggerWorkflow({
      workflow_type: WorkflowType.TASK_MANAGEMENT,
      input_data: { message: 'Test task' },
      user_id: 'test-user',
      async_execution: true
    });
    expect(result.status).toBe('accepted');
  });
});
```

## Performance Considerations

### Caching Strategies

```typescript
// src/lib/main-agent-cache.ts
class MainAgentCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const mainAgentCache = new MainAgentCache();
```

### Request Debouncing

```typescript
// src/hooks/useDebouncedWorkflowTrigger.ts
import { useCallback, useRef } from 'react';
import { mainAgentClient } from '@/lib/main-agent-client';

export function useDebouncedWorkflowTrigger(delay: number = 1000) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const triggerWorkflow = useCallback((request: WorkflowTriggerRequest) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      mainAgentClient.triggerWorkflow(request);
    }, delay);
  }, [delay]);

  return triggerWorkflow;
}
```

## Monitoring Integration

### Performance Metrics

```typescript
// src/lib/performance-metrics.ts
class PerformanceMetrics {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetrics(name: string) {
    const values = this.metrics.get(name) || [];
    return {
      count: values.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  async trackAPICall<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      this.recordMetric(`${name}_success`, performance.now() - start);
      return result;
    } catch (error) {
      this.recordMetric(`${name}_error`, performance.now() - start);
      throw error;
    }
  }
}

export const performanceMetrics = new PerformanceMetrics();
```

## Deployment Integration

### Environment-Specific Configuration

```typescript
// src/config/main-agent.ts
interface MainAgentConfig {
  baseUrl: string;
  wsUrl: string;
  timeout: number;
  retryAttempts: number;
  enableMocking: boolean;
}

const configs: Record<string, MainAgentConfig> = {
  development: {
    baseUrl: 'http://localhost:8001',
    wsUrl: 'ws://localhost:8001',
    timeout: 30000,
    retryAttempts: 3,
    enableMocking: false
  },
  production: {
    baseUrl: process.env.NEXT_PUBLIC_MAIN_AGENT_URL!,
    wsUrl: process.env.NEXT_PUBLIC_MAIN_AGENT_WS_URL!,
    timeout: 15000,
    retryAttempts: 1,
    enableMocking: false
  },
  test: {
    baseUrl: 'http://localhost:8001',
    wsUrl: 'ws://localhost:8001',
    timeout: 5000,
    retryAttempts: 1,
    enableMocking: true
  }
};

export const mainAgentConfig = configs[process.env.NODE_ENV] || configs.development;
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check if Main Agent is running on correct port
2. **WebSocket Connection Failed**: Verify WebSocket URL and firewall settings
3. **Authentication Errors**: Ensure JWT tokens are properly configured
4. **Workflow Timeouts**: Check N8N connectivity and increase timeout values
5. **Missing Features**: Verify Phase 6 deployment is complete

### Debug Tools

```typescript
// src/lib/debug-tools.ts
export const debugMainAgent = {
  logAPICall: (url: string, method: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Main Agent API] ${method} ${url}`, data);
    }
  },

  logWebSocketMessage: (message: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Main Agent WS]', message);
    }
  },

  inspectHealth: async () => {
    try {
      const health = await mainAgentClient.healthCheck();
      console.table(health.services);
      return health;
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }
};
```

## Next Steps

1. **Deploy Main Agent**: Use the deployment guide to set up Phase 6
2. **Configure Environment**: Set up environment variables in your frontend
3. **Implement API Client**: Create the main agent client in your codebase
4. **Add Components**: Integrate the workflow and intelligence components
5. **Test Integration**: Verify all features work with your frontend
6. **Monitor Performance**: Set up performance tracking and error monitoring

## Support

For integration issues:
1. Check the Main Agent health endpoint: `http://localhost:8001/health`
2. Review the deployment logs: `./scripts/deploy.sh logs main-agent`
3. Verify N8N connectivity: `http://localhost:8001/n8n/status`
4. Test WebSocket connection manually
5. Check browser network tab for API request failures

The Main Agent Phase 6 provides a robust foundation for workflow management and intelligence features. Follow this guide to integrate seamlessly with your RIX frontend application.