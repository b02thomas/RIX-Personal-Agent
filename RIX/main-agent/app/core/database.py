# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/core/database.py
# PostgreSQL connection pool with AsyncPG for RIX Personal Agent
# Manages database connections and provides query execution utilities  
# RELEVANT FILES: config.py, models/schemas.py, services/core_apis.py, database/schema.sql

import asyncpg
import asyncio
import logging
from typing import Any, Dict, List, Optional, Union, Tuple
from contextlib import asynccontextmanager
import json
from datetime import datetime, date
import uuid

from app.core.config import settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    PostgreSQL database manager using AsyncPG connection pooling
    Provides high-level database operations for RIX Personal Agent
    """
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self._lock = asyncio.Lock()
    
    async def connect(self) -> None:
        """Initialize database connection pool"""
        # Check if we're in development mode and skip database connection
        if getattr(settings, 'DEV_MODE', False):
            logger.info("Development mode: Skipping database connection")
            return
            
        if self.pool is not None:
            logger.warning("Database pool already initialized")
            return
            
        async with self._lock:
            if self.pool is not None:
                return
                
            try:
                # Connection parameters
                connection_kwargs = {
                    'user': settings.DB_USER,
                    'password': settings.DB_PASSWORD,
                    'host': settings.DB_HOST,
                    'port': settings.DB_PORT,
                    'database': settings.DB_NAME,
                    'min_size': 5,  # Minimum connections in pool
                    'max_size': 20,  # Maximum connections in pool
                    'command_timeout': 30,  # 30 second timeout for queries
                }
                
                # Create connection pool
                self.pool = await asyncpg.create_pool(**connection_kwargs)
                
                # Test connection and setup
                async with self.pool.acquire() as conn:
                    # Enable pgvector extension if not already enabled
                    await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
                    
                    # Set up JSON encoder for custom types
                    await conn.set_type_codec(
                        'json',
                        encoder=json.dumps,
                        decoder=json.loads,
                        schema='pg_catalog'
                    )
                    await conn.set_type_codec(
                        'jsonb',
                        encoder=json.dumps,
                        decoder=json.loads,
                        schema='pg_catalog'
                    )
                
                logger.info("Database connection pool initialized successfully")
                
            except Exception as e:
                logger.error(f"Failed to initialize database pool: {e}")
                raise
    
    async def disconnect(self) -> None:
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            self.pool = None
            logger.info("Database connection pool closed")
    
    @asynccontextmanager
    async def get_connection(self):
        """Get a database connection from the pool"""
        if not self.pool:
            raise RuntimeError("Database pool not initialized")
            
        async with self.pool.acquire() as connection:
            yield connection
    
    async def execute(
        self, 
        query: str, 
        *args, 
        fetch: bool = False,
        fetch_one: bool = False,
        fetch_val: bool = False
    ) -> Union[str, List[Dict[str, Any]], Dict[str, Any], Any, None]:
        """
        Execute a database query with automatic connection management
        
        Args:
            query: SQL query string
            *args: Query parameters
            fetch: Return all rows as list of dicts
            fetch_one: Return single row as dict
            fetch_val: Return single value
            
        Returns:
            Query result based on fetch flags
        """
        async with self.get_connection() as conn:
            try:
                if fetch_val:
                    result = await conn.fetchval(query, *args)
                    return result
                elif fetch_one:
                    row = await conn.fetchrow(query, *args)
                    return dict(row) if row else None
                elif fetch:
                    rows = await conn.fetch(query, *args)
                    return [dict(row) for row in rows]
                else:
                    result = await conn.execute(query, *args)
                    return result
            except Exception as e:
                logger.error(f"Database query failed: {e}")
                logger.error(f"Query: {query}")
                logger.error(f"Args: {args}")
                raise
    
    async def execute_transaction(
        self, 
        queries: List[Tuple[str, tuple]]
    ) -> List[Any]:
        """
        Execute multiple queries in a transaction
        
        Args:
            queries: List of (query, args) tuples
            
        Returns:
            List of query results
        """
        async with self.get_connection() as conn:
            async with conn.transaction():
                results = []
                for query, args in queries:
                    try:
                        result = await conn.execute(query, *args)
                        results.append(result)
                    except Exception as e:
                        logger.error(f"Transaction query failed: {e}")
                        logger.error(f"Query: {query}")
                        logger.error(f"Args: {args}")
                        raise
                return results
    
    async def fetch_with_pagination(
        self,
        base_query: str,
        count_query: str,
        params: tuple = (),
        page: int = 1,
        page_size: int = 20,
        order_by: str = "created_at DESC"
    ) -> Dict[str, Any]:
        """
        Execute paginated query with count
        
        Args:
            base_query: Base SELECT query without LIMIT/OFFSET
            count_query: COUNT query for total records
            params: Query parameters
            page: Page number (1-based)
            page_size: Records per page
            order_by: ORDER BY clause
            
        Returns:
            Dict with items, total_count, page, page_size, total_pages
        """
        # Calculate offset
        offset = (page - 1) * page_size
        
        # Add ORDER BY, LIMIT, OFFSET to base query
        paginated_query = f"{base_query} ORDER BY {order_by} LIMIT {page_size} OFFSET {offset}"
        
        async with self.get_connection() as conn:
            # Execute both queries in parallel
            items_task = conn.fetch(paginated_query, *params)
            count_task = conn.fetchval(count_query, *params)
            
            items_rows, total_count = await asyncio.gather(items_task, count_task)
            
            # Convert rows to dicts
            items = [dict(row) for row in items_rows]
            
            # Calculate pagination info
            total_pages = (total_count + page_size - 1) // page_size
            
            return {
                "items": items,
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
    
    async def vector_search(
        self,
        table: str,
        embedding_column: str,
        query_embedding: List[float],
        where_clause: str = "",
        where_params: tuple = (),
        limit: int = 10,
        similarity_threshold: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        Perform vector similarity search using pgvector
        
        Args:
            table: Table name
            embedding_column: Name of vector column
            query_embedding: Query vector as list of floats
            where_clause: Additional WHERE conditions
            where_params: Parameters for WHERE clause
            limit: Maximum results to return
            similarity_threshold: Minimum similarity score (0.0-1.0)
            
        Returns:
            List of matching records with similarity scores
        """
        # Convert embedding to pgvector format
        embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
        
        # Build query
        query = f"""
            SELECT *, 
                   1 - ({embedding_column} <=> %s::vector) as similarity_score
            FROM {table}
        """
        
        params = [embedding_str]
        
        if where_clause:
            query += f" WHERE {where_clause}"
            params.extend(where_params)
            
        if similarity_threshold > 0:
            threshold_clause = "1 - ({} <=> %s::vector) >= %s".format(embedding_column)
            if where_clause:
                query += f" AND {threshold_clause}"
            else:
                query += f" WHERE {threshold_clause}"
            params.extend([embedding_str, similarity_threshold])
        
        query += f" ORDER BY {embedding_column} <=> %s::vector LIMIT %s"
        params.extend([embedding_str, limit])
        
        return await self.execute(query, *params, fetch=True)
    
    async def upsert(
        self,
        table: str,
        data: Dict[str, Any],
        conflict_columns: List[str],
        update_columns: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Perform UPSERT (INSERT ... ON CONFLICT DO UPDATE)
        
        Args:
            table: Table name
            data: Data to insert/update
            conflict_columns: Columns that define conflicts
            update_columns: Columns to update on conflict (defaults to all data columns)
            
        Returns:
            The inserted/updated record
        """
        if update_columns is None:
            update_columns = [k for k in data.keys() if k not in conflict_columns]
        
        # Build column lists and placeholders
        columns = list(data.keys())
        placeholders = [f"${i+1}" for i in range(len(columns))]
        values = list(data.values())
        
        # Build conflict resolution
        conflict_cols = ", ".join(conflict_columns)
        update_sets = [f"{col} = EXCLUDED.{col}" for col in update_columns]
        update_clause = ", ".join(update_sets)
        
        query = f"""
            INSERT INTO {table} ({", ".join(columns)})
            VALUES ({", ".join(placeholders)})
            ON CONFLICT ({conflict_cols})
            DO UPDATE SET {update_clause}
            RETURNING *
        """
        
        return await self.execute(query, *values, fetch_one=True)
    
    async def bulk_insert(
        self,
        table: str,
        records: List[Dict[str, Any]],
        batch_size: int = 1000
    ) -> int:
        """
        Perform bulk insert with batching
        
        Args:
            table: Table name
            records: List of record dictionaries
            batch_size: Records per batch
            
        Returns:
            Number of records inserted
        """
        if not records:
            return 0
            
        total_inserted = 0
        
        # Process in batches
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            
            # All records should have same columns
            columns = list(batch[0].keys())
            
            # Build VALUES clause
            value_clauses = []
            params = []
            param_idx = 1
            
            for record in batch:
                placeholders = []
                for col in columns:
                    placeholders.append(f"${param_idx}")
                    params.append(record[col])
                    param_idx += 1
                value_clauses.append(f"({', '.join(placeholders)})")
            
            query = f"""
                INSERT INTO {table} ({", ".join(columns)})
                VALUES {", ".join(value_clauses)}
            """
            
            result = await self.execute(query, *params)
            # Extract number from result like "INSERT 0 25"
            inserted = int(result.split()[2]) if result else 0
            total_inserted += inserted
        
        return total_inserted
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check database connectivity and performance
        
        Returns:
            Health check results
        """
        # Handle development mode
        if getattr(settings, 'DEV_MODE', False):
            return {
                'status': 'healthy',
                'mode': 'development',
                'message': 'Database checks disabled in development mode',
                'response_time': 0.001
            }
            
        try:
            start_time = datetime.now()
            
            # Test basic connectivity
            result = await self.execute("SELECT 1 as test", fetch_val=True)
            
            # Check pool status  
            pool_info = {
                "size": self.pool.get_size() if self.pool else 0,
                "max_connections": self.pool.get_max_size() if self.pool else 0,
                "idle_connections": self.pool.get_idle_size() if self.pool else 0,
            }
            
            # Test vector extension
            vector_test = await self.execute(
                "SELECT '[1,2,3]'::vector <=> '[1,2,3]'::vector as similarity",
                fetch_val=True
            )
            
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds() * 1000
            
            return {
                "status": "healthy",
                "response_time_ms": response_time,
                "pool_info": pool_info,
                "vector_extension": "available" if vector_test == 0.0 else "error",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }


# Global database instance
database = DatabaseManager()


# Utility functions for common database operations

async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    return await database.execute(
        "SELECT * FROM users WHERE id = $1 AND is_active = true",
        uuid.UUID(user_id),
        fetch_one=True
    )


async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    return await database.execute(
        "SELECT * FROM users WHERE email = $1 AND is_active = true",
        email,
        fetch_one=True
    )


async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create new user"""
    return await database.upsert(
        "users",
        user_data,
        ["email"],
        ["hashed_password", "full_name", "updated_at"]
    )


async def log_mcp_interaction(
    user_id: str,
    sub_agent_type: str,
    endpoint: str,
    request_payload: Dict[str, Any],
    response_payload: Optional[Dict[str, Any]] = None,
    processing_time_ms: Optional[int] = None,
    status_code: int = 200,
    error_message: Optional[str] = None,
    context_metadata: Optional[Dict[str, Any]] = None
) -> None:
    """Log MCP interaction for future Sub-Agent tracking"""
    await database.execute(
        """
        INSERT INTO mcp_interaction_logs 
        (user_id, sub_agent_type, endpoint_called, request_payload, response_payload,
         processing_time_ms, status_code, error_message, context_metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """,
        uuid.UUID(user_id),
        sub_agent_type,
        endpoint,
        json.dumps(request_payload) if request_payload else None,
        json.dumps(response_payload) if response_payload else None,
        processing_time_ms,
        status_code,
        error_message,
        json.dumps(context_metadata) if context_metadata else None
    )


async def get_user_dashboard_summary(user_id: str) -> Dict[str, Any]:
    """Get comprehensive dashboard summary for user"""
    return await database.execute(
        "SELECT * FROM v_user_dashboard_summary WHERE user_id = $1",
        uuid.UUID(user_id),
        fetch_one=True
    )


async def search_knowledge_entries(
    user_id: str,
    query_embedding: List[float],
    limit: int = 10,
    category: Optional[str] = None,
    entry_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Search knowledge entries using vector similarity"""
    where_clause = "user_id = $1"
    where_params = [uuid.UUID(user_id)]
    
    if category:
        where_clause += " AND category = $2"
        where_params.append(category)
        
    if entry_type:
        param_num = len(where_params) + 1
        where_clause += f" AND entry_type = ${param_num}"
        where_params.append(entry_type)
    
    return await database.vector_search(
        table="knowledge_entries",
        embedding_column="embedding",
        query_embedding=query_embedding,
        where_clause=where_clause,
        where_params=tuple(where_params),
        limit=limit,
        similarity_threshold=0.7
    )