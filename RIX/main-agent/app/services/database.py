"""
Database service for RIX Main Agent
Compatible with existing RIX PostgreSQL schema
"""

import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional

import asyncpg
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class DatabaseService:
    """Database service for RIX Main Agent"""

    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.connected = False

    async def connect(self):
        """Establish database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                settings.async_database_url,
                min_size=1,
                max_size=10,
                command_timeout=60,
                server_settings={"jit": "off"},  # Disable JIT for better performance on small queries
            )
            self.connected = True
            logger.info("Database connection pool established")

            # Test connection
            async with self.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
                logger.info("Database connection test successful")

        except Exception as e:
            logger.error("Database connection failed", error=str(e))
            self.connected = False
            raise

    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            self.connected = False
            logger.info("Database connection pool closed")

    async def health_check(self) -> Dict[str, Any]:
        """Perform database health check"""
        if not self.connected or not self.pool:
            return {"status": "unhealthy", "error": "Not connected to database"}

        try:
            start_time = asyncio.get_event_loop().time()

            async with self.pool.acquire() as conn:
                # Test basic query
                result = await conn.fetchval("SELECT 1")

                # Get connection stats
                pool_stats = {
                    "size": self.pool.get_size(),
                    "min_size": self.pool.get_min_size(),
                    "max_size": self.pool.get_max_size(),
                    "idle_size": self.pool.get_idle_size(),
                }

            response_time = asyncio.get_event_loop().time() - start_time

            return {"status": "healthy", "response_time": response_time, "pool_stats": pool_stats, "test_query_result": result}

        except Exception as e:
            logger.error("Database health check failed", error=str(e))
            return {"status": "unhealthy", "error": str(e)}

    async def create_message(
        self,
        conversation_id: str,
        user_id: str,
        content: str,
        message_type: str = "text",
        is_from_ai: bool = False,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a new message in the database"""
        if not self.connected or not self.pool:
            raise RuntimeError("Database not connected")

        try:
            async with self.pool.acquire() as conn:
                # Insert message
                message_id = await conn.fetchval(
                    """
                    INSERT INTO messages (conversation_id, user_id, content, message_type, is_from_ai, created_at)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                    RETURNING id
                    """,
                    conversation_id,
                    user_id,
                    content,
                    message_type,
                    is_from_ai,
                )

                # Update conversation timestamp
                await conn.execute("UPDATE conversations SET updated_at = NOW() WHERE id = $1", conversation_id)

                # Fetch the created message
                message = await conn.fetchrow(
                    """
                    SELECT id, conversation_id, user_id, content, message_type, 
                           is_from_ai, created_at
                    FROM messages 
                    WHERE id = $1
                    """,
                    message_id,
                )

                return dict(message)

        except Exception as e:
            logger.error("Failed to create message", error=str(e), conversation_id=conversation_id)
            raise

    async def get_conversation_messages(self, conversation_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get messages for a conversation"""
        if not self.connected or not self.pool:
            raise RuntimeError("Database not connected")

        try:
            async with self.pool.acquire() as conn:
                messages = await conn.fetch(
                    """
                    SELECT id, conversation_id, user_id, content, message_type, 
                           is_from_ai, created_at
                    FROM messages 
                    WHERE conversation_id = $1
                    ORDER BY created_at ASC
                    LIMIT $2
                    """,
                    conversation_id,
                    limit,
                )

                return [dict(message) for message in messages]

        except Exception as e:
            logger.error("Failed to get conversation messages", error=str(e), conversation_id=conversation_id)
            raise

    async def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get conversation details"""
        if not self.connected or not self.pool:
            raise RuntimeError("Database not connected")

        try:
            async with self.pool.acquire() as conn:
                conversation = await conn.fetchrow(
                    """
                    SELECT id, user_id, title, created_at, updated_at
                    FROM conversations 
                    WHERE id = $1
                    """,
                    conversation_id,
                )

                return dict(conversation) if conversation else None

        except Exception as e:
            logger.error("Failed to get conversation", error=str(e), conversation_id=conversation_id)
            raise

    async def create_conversation(self, user_id: str, title: str) -> Dict[str, Any]:
        """Create a new conversation"""
        if not self.connected or not self.pool:
            raise RuntimeError("Database not connected")

        try:
            async with self.pool.acquire() as conn:
                conversation_id = await conn.fetchval(
                    """
                    INSERT INTO conversations (user_id, title, created_at, updated_at)
                    VALUES ($1, $2, NOW(), NOW())
                    RETURNING id
                    """,
                    user_id,
                    title,
                )

                # Fetch the created conversation
                conversation = await conn.fetchrow(
                    """
                    SELECT id, user_id, title, created_at, updated_at
                    FROM conversations 
                    WHERE id = $1
                    """,
                    conversation_id,
                )

                return dict(conversation)

        except Exception as e:
            logger.error("Failed to create conversation", error=str(e), user_id=user_id)
            raise

    async def get_user_conversations(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get user's conversations"""
        if not self.connected or not self.pool:
            raise RuntimeError("Database not connected")

        try:
            async with self.pool.acquire() as conn:
                conversations = await conn.fetch(
                    """
                    SELECT id, user_id, title, created_at, updated_at
                    FROM conversations 
                    WHERE user_id = $1
                    ORDER BY updated_at DESC
                    LIMIT $2
                    """,
                    user_id,
                    limit,
                )

                return [dict(conversation) for conversation in conversations]

        except Exception as e:
            logger.error("Failed to get user conversations", error=str(e), user_id=user_id)
            raise

    async def store_n8n_execution(
        self,
        execution_id: str,
        user_id: str,
        workflow_type: str,
        conversation_id: Optional[str] = None,
        status: str = "running",
        input_data: Optional[Dict[str, Any]] = None,
        output_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Store N8N execution information"""
        if not self.connected or not self.pool:
            raise RuntimeError("Database not connected")

        try:
            async with self.pool.acquire() as conn:
                # Create execution tracking table if not exists
                await conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS n8n_executions (
                        id VARCHAR PRIMARY KEY,
                        user_id VARCHAR NOT NULL,
                        workflow_type VARCHAR NOT NULL,
                        conversation_id VARCHAR,
                        status VARCHAR NOT NULL DEFAULT 'running',
                        input_data JSONB,
                        output_data JSONB,
                        error_message TEXT,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW()
                    )
                    """
                )

                # Insert or update execution
                await conn.execute(
                    """
                    INSERT INTO n8n_executions 
                    (id, user_id, workflow_type, conversation_id, status, input_data, output_data, error_message, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                    ON CONFLICT (id) 
                    DO UPDATE SET 
                        status = EXCLUDED.status,
                        output_data = EXCLUDED.output_data,
                        error_message = EXCLUDED.error_message,
                        updated_at = NOW()
                    """,
                    execution_id,
                    user_id,
                    workflow_type,
                    conversation_id,
                    status,
                    input_data,
                    output_data,
                    error_message,
                )

                # Fetch the stored execution
                execution = await conn.fetchrow(
                    """
                    SELECT id, user_id, workflow_type, conversation_id, status,
                           input_data, output_data, error_message, created_at, updated_at
                    FROM n8n_executions 
                    WHERE id = $1
                    """,
                    execution_id,
                )

                return dict(execution)

        except Exception as e:
            logger.error("Failed to store N8N execution", error=str(e), execution_id=execution_id)
            raise

    async def get_n8n_execution(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get N8N execution information"""
        if not self.connected or not self.pool:
            raise RuntimeError("Database not connected")

        try:
            async with self.pool.acquire() as conn:
                execution = await conn.fetchrow(
                    """
                    SELECT id, user_id, workflow_type, conversation_id, status,
                           input_data, output_data, error_message, created_at, updated_at
                    FROM n8n_executions 
                    WHERE id = $1
                    """,
                    execution_id,
                )

                return dict(execution) if execution else None

        except Exception as e:
            logger.error("Failed to get N8N execution", error=str(e), execution_id=execution_id)
            raise

    async def create_n8n_workflows_table(self):
        """Create N8N workflows table for Phase 6 workflow management"""
        if not self.connected or not self.pool:
            raise RuntimeError("Database not connected")

        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS n8n_workflows (
                        id VARCHAR PRIMARY KEY,
                        name VARCHAR NOT NULL,
                        description TEXT,
                        category VARCHAR DEFAULT 'general',
                        workflow_type VARCHAR,
                        active BOOLEAN DEFAULT false,
                        tags TEXT[] DEFAULT '{}',
                        version VARCHAR DEFAULT '1.0.0',
                        execution_count INTEGER DEFAULT 0,
                        last_execution_at TIMESTAMP,
                        ai_triggered_count INTEGER DEFAULT 0,
                        success_rate FLOAT DEFAULT 0.0,
                        average_execution_time FLOAT DEFAULT 0.0,
                        metadata JSONB DEFAULT '{}',
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW(),
                        UNIQUE(name)
                    )
                    """
                )

                # Create indexes for performance
                await conn.execute("CREATE INDEX IF NOT EXISTS idx_n8n_workflows_active ON n8n_workflows(active)")
                await conn.execute("CREATE INDEX IF NOT EXISTS idx_n8n_workflows_category ON n8n_workflows(category)")
                await conn.execute("CREATE INDEX IF NOT EXISTS idx_n8n_workflows_type ON n8n_workflows(workflow_type)")

                logger.info("N8N workflows table created successfully")

        except Exception as e:
            logger.error("Failed to create N8N workflows table", error=str(e))
            raise

    async def store_workflow_metadata(
        self,
        workflow_id: str,
        name: str,
        active: bool = False,
        description: str = None,
        category: str = "general",
        workflow_type: str = None,
        tags: List[str] = None,
        version: str = "1.0.0",
        metadata: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """Store or update workflow metadata"""
        if not self.connected or not self.pool:
            raise RuntimeError("Database not connected")

        try:
            async with self.pool.acquire() as conn:
                # Ensure table exists
                await self.create_n8n_workflows_table()

                await conn.execute(
                    """
                    INSERT INTO n8n_workflows 
                    (id, name, description, category, workflow_type, active, tags, version, metadata, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                    ON CONFLICT (id) 
                    DO UPDATE SET 
                        name = EXCLUDED.name,
                        description = EXCLUDED.description,
                        category = EXCLUDED.category,
                        workflow_type = EXCLUDED.workflow_type,
                        active = EXCLUDED.active,
                        tags = EXCLUDED.tags,
                        version = EXCLUDED.version,
                        metadata = EXCLUDED.metadata,
                        updated_at = NOW()
                    """,
                    workflow_id,
                    name,
                    description,
                    category,
                    workflow_type,
                    active,
                    tags or [],
                    version,
                    metadata or {},
                )

                # Fetch the stored workflow
                workflow = await conn.fetchrow(
                    """
                    SELECT id, name, description, category, workflow_type, active, tags, version,
                           execution_count, last_execution_at, ai_triggered_count, success_rate,
                           average_execution_time, metadata, created_at, updated_at
                    FROM n8n_workflows 
                    WHERE id = $1
                    """,
                    workflow_id,
                )

                return dict(workflow)

        except Exception as e:
            logger.error("Failed to store workflow metadata", error=str(e), workflow_id=workflow_id)
            raise

    async def get_workflows_by_category(self, category: str = None, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get workflows by category"""
        if not self.connected or not self.pool:
            raise RuntimeError("Database not connected")

        try:
            async with self.pool.acquire() as conn:
                # Ensure table exists
                await self.create_n8n_workflows_table()

                if category:
                    if active_only:
                        workflows = await conn.fetch(
                            """
                            SELECT id, name, description, category, workflow_type, active, tags, version,
                                   execution_count, last_execution_at, ai_triggered_count, success_rate,
                                   average_execution_time, metadata, created_at, updated_at
                            FROM n8n_workflows 
                            WHERE category = $1 AND active = true
                            ORDER BY name
                            """,
                            category,
                        )
                    else:
                        workflows = await conn.fetch(
                            """
                            SELECT id, name, description, category, workflow_type, active, tags, version,
                                   execution_count, last_execution_at, ai_triggered_count, success_rate,
                                   average_execution_time, metadata, created_at, updated_at
                            FROM n8n_workflows 
                            WHERE category = $1
                            ORDER BY name
                            """,
                            category,
                        )
                else:
                    if active_only:
                        workflows = await conn.fetch(
                            """
                            SELECT id, name, description, category, workflow_type, active, tags, version,
                                   execution_count, last_execution_at, ai_triggered_count, success_rate,
                                   average_execution_time, metadata, created_at, updated_at
                            FROM n8n_workflows 
                            WHERE active = true
                            ORDER BY category, name
                            """
                        )
                    else:
                        workflows = await conn.fetch(
                            """
                            SELECT id, name, description, category, workflow_type, active, tags, version,
                                   execution_count, last_execution_at, ai_triggered_count, success_rate,
                                   average_execution_time, metadata, created_at, updated_at
                            FROM n8n_workflows 
                            ORDER BY category, name
                            """
                        )

                return [dict(workflow) for workflow in workflows]

        except Exception as e:
            logger.error("Failed to get workflows by category", error=str(e), category=category)
            raise

    async def update_workflow_status(self, workflow_id: str, active: bool) -> bool:
        """Update workflow active status"""
        if not self.connected or not self.pool:
            raise RuntimeError("Database not connected")

        try:
            async with self.pool.acquire() as conn:
                result = await conn.execute(
                    """
                    UPDATE n8n_workflows 
                    SET active = $2, updated_at = NOW()
                    WHERE id = $1
                    """,
                    workflow_id,
                    active,
                )

                return result != "UPDATE 0"

        except Exception as e:
            logger.error("Failed to update workflow status", error=str(e), workflow_id=workflow_id)
            raise

    async def track_workflow_execution(
        self, workflow_id: str, execution_time: float = None, success: bool = True, ai_triggered: bool = False
    ) -> Dict[str, Any]:
        """Track workflow execution metrics"""
        if not self.connected or not self.pool:
            raise RuntimeError("Database not connected")

        try:
            async with self.pool.acquire() as conn:
                # Get current stats
                current = await conn.fetchrow(
                    """
                    SELECT execution_count, ai_triggered_count, success_rate, average_execution_time
                    FROM n8n_workflows 
                    WHERE id = $1
                    """,
                    workflow_id,
                )

                if not current:
                    logger.warning("Workflow not found for execution tracking", workflow_id=workflow_id)
                    return {}

                # Calculate new metrics
                new_exec_count = current["execution_count"] + 1
                new_ai_count = current["ai_triggered_count"] + (1 if ai_triggered else 0)

                # Calculate success rate (assume previous executions were successful if success_rate was 1.0)
                if current["execution_count"] == 0:
                    new_success_rate = 1.0 if success else 0.0
                else:
                    total_successes = current["success_rate"] * current["execution_count"]
                    if success:
                        total_successes += 1
                    new_success_rate = total_successes / new_exec_count

                # Calculate average execution time
                if execution_time is not None:
                    if current["execution_count"] == 0:
                        new_avg_time = execution_time
                    else:
                        total_time = current["average_execution_time"] * current["execution_count"]
                        new_avg_time = (total_time + execution_time) / new_exec_count
                else:
                    new_avg_time = current["average_execution_time"]

                # Update workflow metrics
                await conn.execute(
                    """
                    UPDATE n8n_workflows 
                    SET execution_count = $2,
                        ai_triggered_count = $3,
                        success_rate = $4,
                        average_execution_time = $5,
                        last_execution_at = NOW(),
                        updated_at = NOW()
                    WHERE id = $1
                    """,
                    workflow_id,
                    new_exec_count,
                    new_ai_count,
                    new_success_rate,
                    new_avg_time,
                )

                # Return updated workflow data
                updated = await conn.fetchrow(
                    """
                    SELECT id, name, execution_count, ai_triggered_count, success_rate,
                           average_execution_time, last_execution_at
                    FROM n8n_workflows 
                    WHERE id = $1
                    """,
                    workflow_id,
                )

                return dict(updated) if updated else {}

        except Exception as e:
            logger.error("Failed to track workflow execution", error=str(e), workflow_id=workflow_id)
            raise

    async def get_workflow_analytics(self, days: int = 7) -> Dict[str, Any]:
        """Get workflow analytics for the specified number of days"""
        if not self.connected or not self.pool:
            raise RuntimeError("Database not connected")

        try:
            async with self.pool.acquire() as conn:
                # Ensure table exists
                await self.create_n8n_workflows_table()

                # Get workflow stats
                stats = await conn.fetchrow(
                    """
                    SELECT 
                        COUNT(*) as total_workflows,
                        COUNT(*) FILTER (WHERE active = true) as active_workflows,
                        SUM(execution_count) as total_executions,
                        SUM(ai_triggered_count) as total_ai_triggered,
                        AVG(success_rate) as average_success_rate,
                        AVG(average_execution_time) as average_execution_time
                    FROM n8n_workflows
                    """
                )

                # Get category breakdown
                categories = await conn.fetch(
                    """
                    SELECT 
                        category,
                        COUNT(*) as workflow_count,
                        SUM(execution_count) as execution_count,
                        AVG(success_rate) as avg_success_rate
                    FROM n8n_workflows
                    GROUP BY category
                    ORDER BY execution_count DESC
                    """
                )

                # Get recent executions from n8n_executions table
                recent_executions = await conn.fetch(
                    """
                    SELECT 
                        workflow_type,
                        status,
                        created_at
                    FROM n8n_executions 
                    WHERE created_at >= NOW() - INTERVAL $1 * INTERVAL '1 day'
                    ORDER BY created_at DESC
                    LIMIT 100
                    """,
                    days,
                )

                return {
                    "summary": dict(stats) if stats else {},
                    "categories": [dict(cat) for cat in categories],
                    "recent_executions": [dict(exec) for exec in recent_executions],
                    "period_days": days,
                }

        except Exception as e:
            logger.error("Failed to get workflow analytics", error=str(e))
            raise


# Global database service instance
database = DatabaseService()
