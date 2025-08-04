# /03-implementation/backend-improvements/database-optimization.py
# Connection management improvements and performance optimizations for RIX Main Agent
# Enhances existing database.py with advanced connection pooling and query optimization
# RELEVANT FILES: app/services/database.py, app/core/config.py, app/main.py

import asyncio
import hashlib
import json
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Union
from uuid import uuid4

import asyncpg
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class ConnectionState(str, Enum):
    """Database connection states"""

    INITIALIZING = "initializing"
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    MAINTENANCE = "maintenance"


@dataclass
class ConnectionMetrics:
    """Connection pool metrics"""

    total_connections: int = 0
    active_connections: int = 0
    idle_connections: int = 0
    max_connections: int = 0
    min_connections: int = 0
    connection_waits: int = 0
    connection_timeouts: int = 0
    queries_executed: int = 0
    average_query_time: float = 0.0
    cache_hits: int = 0
    cache_misses: int = 0
    last_health_check: Optional[datetime] = None
    uptime_seconds: float = 0.0


@dataclass
class QueryStats:
    """Individual query statistics"""

    query_hash: str
    execution_count: int = 0
    total_time: float = 0.0
    average_time: float = 0.0
    min_time: float = float("inf")
    max_time: float = 0.0
    error_count: int = 0
    last_executed: Optional[datetime] = None
    cache_enabled: bool = False
    cache_hit_rate: float = 0.0


class QueryCache:
    """Simple in-memory query result cache"""

    def __init__(self, max_size: int = 1000, ttl_seconds: int = 300):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._access_times: Dict[str, datetime] = {}

    def _generate_key(self, query: str, params: tuple = ()) -> str:
        """Generate cache key from query and parameters using secure hash"""
        key_data = f"{query}:{params}"
        # Use SHA-256 instead of MD5 for better security practices
        return hashlib.sha256(key_data.encode()).hexdigest()[:16]  # Truncate for shorter keys

    def get(self, query: str, params: tuple = ()) -> Optional[Any]:
        """Get cached result"""
        key = self._generate_key(query, params)

        if key not in self._cache:
            return None

        # Check TTL
        if key in self._access_times:
            age = datetime.utcnow() - self._access_times[key]
            if age.total_seconds() > self.ttl_seconds:
                self._evict(key)
                return None

        # Update access time
        self._access_times[key] = datetime.utcnow()
        return self._cache[key]["result"]

    def set(self, query: str, params: tuple, result: Any) -> None:
        """Cache query result"""
        key = self._generate_key(query, params)

        # Evict oldest entries if cache is full
        if len(self._cache) >= self.max_size:
            self._evict_oldest()

        self._cache[key] = {"result": result, "timestamp": datetime.utcnow()}
        self._access_times[key] = datetime.utcnow()

    def _evict(self, key: str) -> None:
        """Evict specific cache entry"""
        self._cache.pop(key, None)
        self._access_times.pop(key, None)

    def _evict_oldest(self) -> None:
        """Evict oldest cache entry"""
        if not self._access_times:
            return

        oldest_key = min(self._access_times, key=self._access_times.get)
        self._evict(oldest_key)

    def clear(self) -> None:
        """Clear all cache entries"""
        self._cache.clear()
        self._access_times.clear()

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        now = datetime.utcnow()
        expired_count = 0

        for key, access_time in self._access_times.items():
            age = now - access_time
            if age.total_seconds() > self.ttl_seconds:
                expired_count += 1

        return {
            "size": len(self._cache),
            "max_size": self.max_size,
            "expired_entries": expired_count,
            "hit_rate": 0.0,  # Would need to track hits/misses
            "ttl_seconds": self.ttl_seconds,
        }


class OptimizedDatabaseService:
    """Enhanced database service with optimization features"""

    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.connection_state = ConnectionState.INITIALIZING
        self.metrics = ConnectionMetrics()
        self.query_stats: Dict[str, QueryStats] = {}
        self.query_cache = QueryCache()
        self.start_time = time.time()

        # Configuration
        self.max_retries = 3
        self.retry_delay = 1.0
        self.health_check_interval = 30
        self.connection_timeout = 30
        self.query_timeout = 60
        self.enable_query_cache = True
        self.enable_query_stats = True

        # Circuit breaker state
        self.circuit_breaker_failures = 0
        self.circuit_breaker_threshold = 5
        self.circuit_breaker_timeout = 60
        self.circuit_breaker_last_failure = None

    async def connect(self) -> None:
        """Establish optimized database connection pool"""
        try:
            self.connection_state = ConnectionState.INITIALIZING
            logger.info("Initializing optimized database connection pool")

            # Enhanced connection pool configuration
            self.pool = await asyncpg.create_pool(
                settings.database_url,
                min_size=2,  # Minimum connections
                max_size=20,  # Maximum connections
                max_queries=50000,  # Max queries per connection
                max_inactive_connection_lifetime=300,  # 5 minutes
                command_timeout=self.query_timeout,
                server_settings={
                    "jit": "off",  # Disable JIT for predictable performance
                    "application_name": "rix_main_agent",
                    "timezone": "UTC",
                },
                init=self._init_connection,
                setup=self._setup_connection,
            )

            # Update metrics
            self.metrics.total_connections = self.pool.get_size()
            self.metrics.max_connections = self.pool.get_max_size()
            self.metrics.min_connections = self.pool.get_min_size()

            # Test connection
            await self._health_check()

            if self.connection_state == ConnectionState.HEALTHY:
                logger.info("Database connection pool established successfully")

                # Start background tasks
                asyncio.create_task(self._periodic_health_check())
                asyncio.create_task(self._periodic_metrics_update())
                asyncio.create_task(self._periodic_cache_cleanup())

        except Exception as e:
            self.connection_state = ConnectionState.UNHEALTHY
            logger.error("Failed to establish database connection pool", error=str(e))
            raise

    async def _init_connection(self, conn: asyncpg.Connection) -> None:
        """Initialize individual database connection"""
        # Set connection-specific settings
        await conn.execute("SET timezone = 'UTC'")
        await conn.execute("SET statement_timeout = '60s'")
        await conn.execute("SET lock_timeout = '30s'")

        # Enable performance features
        await conn.execute("SET track_activities = on")
        await conn.execute("SET track_counts = on")

    async def _setup_connection(self, conn: asyncpg.Connection) -> None:
        """Setup connection for RIX-specific needs"""
        # Create custom types if needed
        try:
            await conn.execute(
                """
                DO $$ BEGIN
                    CREATE TYPE workflow_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """
            )
        except Exception as e:
            logger.debug("Custom types already exist or setup failed", error=str(e))

    async def disconnect(self) -> None:
        """Gracefully close database connections"""
        if self.pool:
            logger.info("Closing database connection pool")
            await self.pool.close()
            self.connection_state = ConnectionState.UNHEALTHY
            self.pool = None
            logger.info("Database connection pool closed")

    @asynccontextmanager
    async def get_connection(self):
        """Get database connection with automatic retry and circuit breaker"""
        if not self._circuit_breaker_allows():
            raise Exception("Circuit breaker is open - database unavailable")

        connection = None
        retry_count = 0

        while retry_count < self.max_retries:
            try:
                if not self.pool:
                    raise Exception("Database pool not initialized")

                # Acquire connection with timeout
                connection = await asyncio.wait_for(self.pool.acquire(), timeout=self.connection_timeout)

                # Update metrics
                self.metrics.active_connections += 1

                # Reset circuit breaker on successful connection
                self.circuit_breaker_failures = 0

                yield connection
                break

            except asyncio.TimeoutError:
                self.metrics.connection_timeouts += 1
                retry_count += 1
                if retry_count < self.max_retries:
                    await asyncio.sleep(self.retry_delay * retry_count)
                else:
                    self._record_circuit_breaker_failure()
                    raise Exception("Database connection timeout")

            except Exception as e:
                self._record_circuit_breaker_failure()
                if retry_count < self.max_retries:
                    retry_count += 1
                    await asyncio.sleep(self.retry_delay * retry_count)
                else:
                    raise e

            finally:
                if connection:
                    await self.pool.release(connection)
                    self.metrics.active_connections -= 1

    async def execute_query(self, query: str, *params, use_cache: bool = None, cache_ttl: int = None) -> Any:
        """Execute query with optimization features"""

        # Use cache if enabled and appropriate
        if use_cache is None:
            use_cache = self.enable_query_cache and self._is_cacheable_query(query)

        # Check cache first
        if use_cache:
            cached_result = self.query_cache.get(query, params)
            if cached_result is not None:
                self.metrics.cache_hits += 1
                return cached_result
            else:
                self.metrics.cache_misses += 1

        # Execute query
        start_time = time.time()
        result = None
        error = None

        try:
            async with self.get_connection() as conn:
                result = await conn.fetch(query, *params)

                # Cache result if appropriate
                if use_cache and result is not None:
                    self.query_cache.set(query, params, result)

        except Exception as e:
            error = e
            raise

        finally:
            # Update query statistics
            execution_time = time.time() - start_time
            if self.enable_query_stats:
                self._update_query_stats(query, execution_time, error is None)

            # Update global metrics
            self.metrics.queries_executed += 1
            self._update_average_query_time(execution_time)

        return result

    async def execute_query_one(self, query: str, *params, use_cache: bool = None) -> Optional[Dict[str, Any]]:
        """Execute query expecting single result"""
        result = await self.execute_query(query, *params, use_cache=use_cache)
        return dict(result[0]) if result else None

    async def execute_query_value(self, query: str, *params, use_cache: bool = None) -> Any:
        """Execute query expecting single value"""
        async with self.get_connection() as conn:
            start_time = time.time()
            try:
                result = await conn.fetchval(query, *params)
                execution_time = time.time() - start_time

                if self.enable_query_stats:
                    self._update_query_stats(query, execution_time, True)

                return result

            except Exception as e:
                execution_time = time.time() - start_time
                if self.enable_query_stats:
                    self._update_query_stats(query, execution_time, False)
                raise

    async def execute_transaction(self, operations: List[Callable]) -> List[Any]:
        """Execute multiple operations in a transaction"""
        async with self.get_connection() as conn:
            async with conn.transaction():
                results = []
                for operation in operations:
                    result = await operation(conn)
                    results.append(result)
                return results

    async def bulk_insert(
        self, table: str, columns: List[str], data: List[List[Any]], conflict_resolution: str = "ON CONFLICT DO NOTHING"
    ) -> int:
        """Optimized bulk insert operation"""
        if not data:
            return 0

        # Build query
        placeholders = ", ".join([f"${i}" for i in range(1, len(columns) + 1)])
        query = f"""
            INSERT INTO {table} ({", ".join(columns)})
            VALUES ({placeholders})
            {conflict_resolution}
        """

        async with self.get_connection() as conn:
            start_time = time.time()
            try:
                # Use executemany for bulk operations
                result = await conn.executemany(query, data)
                execution_time = time.time() - start_time

                logger.info("Bulk insert completed", table=table, rows=len(data), execution_time=execution_time)

                return len(data)

            except Exception as e:
                logger.error("Bulk insert failed", table=table, rows=len(data), error=str(e))
                raise

    async def _health_check(self) -> Dict[str, Any]:
        """Comprehensive database health check"""
        health_data = {
            "status": "unhealthy",
            "response_time": 0.0,
            "pool_stats": {},
            "query_performance": {},
            "cache_stats": {},
            "errors": [],
        }

        try:
            start_time = time.time()

            async with self.get_connection() as conn:
                # Basic connectivity test
                await conn.fetchval("SELECT 1")

                # Performance test
                await conn.fetchval("SELECT COUNT(*) FROM pg_stat_activity")

                # Get pool statistics
                health_data["pool_stats"] = {
                    "size": self.pool.get_size(),
                    "min_size": self.pool.get_min_size(),
                    "max_size": self.pool.get_max_size(),
                    "idle_size": self.pool.get_idle_size(),
                }

                # Update metrics
                self.metrics.idle_connections = self.pool.get_idle_size()
                self.metrics.last_health_check = datetime.utcnow()
                self.metrics.uptime_seconds = time.time() - self.start_time

            response_time = time.time() - start_time
            health_data["response_time"] = response_time

            # Determine health status
            if response_time < 0.1:
                self.connection_state = ConnectionState.HEALTHY
                health_data["status"] = "healthy"
            elif response_time < 1.0:
                self.connection_state = ConnectionState.DEGRADED
                health_data["status"] = "degraded"
            else:
                self.connection_state = ConnectionState.UNHEALTHY
                health_data["status"] = "unhealthy"
                health_data["errors"].append("High response time")

            # Add performance and cache stats
            health_data["query_performance"] = self._get_query_performance_summary()
            health_data["cache_stats"] = self.query_cache.get_stats()

        except Exception as e:
            self.connection_state = ConnectionState.UNHEALTHY
            health_data["errors"].append(str(e))
            logger.error("Database health check failed", error=str(e))

        return health_data

    async def _periodic_health_check(self) -> None:
        """Periodic health check background task"""
        while True:
            try:
                await asyncio.sleep(self.health_check_interval)
                await self._health_check()
            except Exception as e:
                logger.error("Periodic health check failed", error=str(e))

    async def _periodic_metrics_update(self) -> None:
        """Update metrics periodically"""
        while True:
            try:
                await asyncio.sleep(10)  # Update every 10 seconds

                if self.pool:
                    self.metrics.total_connections = self.pool.get_size()
                    self.metrics.idle_connections = self.pool.get_idle_size()

            except Exception as e:
                logger.error("Metrics update failed", error=str(e))

    async def _periodic_cache_cleanup(self) -> None:
        """Clean up expired cache entries"""
        while True:
            try:
                await asyncio.sleep(300)  # Cleanup every 5 minutes

                # Get cache stats before cleanup
                stats_before = self.query_cache.get_stats()

                # This would require implementing cleanup in QueryCache
                # For now, just log stats
                logger.info("Cache stats", **stats_before)

            except Exception as e:
                logger.error("Cache cleanup failed", error=str(e))

    def _circuit_breaker_allows(self) -> bool:
        """Check if circuit breaker allows requests"""
        if self.circuit_breaker_failures < self.circuit_breaker_threshold:
            return True

        if self.circuit_breaker_last_failure:
            time_since_failure = time.time() - self.circuit_breaker_last_failure
            if time_since_failure > self.circuit_breaker_timeout:
                # Reset circuit breaker
                self.circuit_breaker_failures = 0
                self.circuit_breaker_last_failure = None
                return True

        return False

    def _record_circuit_breaker_failure(self) -> None:
        """Record circuit breaker failure"""
        self.circuit_breaker_failures += 1
        self.circuit_breaker_last_failure = time.time()

        if self.circuit_breaker_failures >= self.circuit_breaker_threshold:
            logger.warning(
                "Circuit breaker opened due to failures",
                failures=self.circuit_breaker_failures,
                threshold=self.circuit_breaker_threshold,
            )

    def _is_cacheable_query(self, query: str) -> bool:
        """Determine if query is suitable for caching"""
        query_lower = query.lower().strip()

        # Cache read-only queries
        if query_lower.startswith("select"):
            # Don't cache queries with current timestamp functions
            time_functions = ["now()", "current_timestamp", "current_time", "current_date"]
            if not any(func in query_lower for func in time_functions):
                return True

        return False

    def _update_query_stats(self, query: str, execution_time: float, success: bool) -> None:
        """Update query execution statistics"""
        # Use SHA-256 instead of MD5 for better security practices
        query_hash = hashlib.sha256(query.encode()).hexdigest()[:16]  # Truncate for shorter keys

        if query_hash not in self.query_stats:
            self.query_stats[query_hash] = QueryStats(query_hash=query_hash)

        stats = self.query_stats[query_hash]
        stats.execution_count += 1
        stats.total_time += execution_time
        stats.average_time = stats.total_time / stats.execution_count
        stats.min_time = min(stats.min_time, execution_time)
        stats.max_time = max(stats.max_time, execution_time)
        stats.last_executed = datetime.utcnow()

        if not success:
            stats.error_count += 1

    def _update_average_query_time(self, execution_time: float) -> None:
        """Update global average query time"""
        if self.metrics.queries_executed == 1:
            self.metrics.average_query_time = execution_time
        else:
            # Calculate rolling average
            total_time = self.metrics.average_query_time * (self.metrics.queries_executed - 1)
            self.metrics.average_query_time = (total_time + execution_time) / self.metrics.queries_executed

    def _get_query_performance_summary(self) -> Dict[str, Any]:
        """Get summary of query performance"""
        if not self.query_stats:
            return {}

        # Find slowest queries
        slowest_queries = sorted(self.query_stats.values(), key=lambda x: x.average_time, reverse=True)[:5]

        # Find most frequent queries
        frequent_queries = sorted(self.query_stats.values(), key=lambda x: x.execution_count, reverse=True)[:5]

        return {
            "total_unique_queries": len(self.query_stats),
            "slowest_queries": [
                {
                    "hash": q.query_hash,
                    "avg_time": q.average_time,
                    "execution_count": q.execution_count,
                    "error_rate": q.error_count / q.execution_count if q.execution_count > 0 else 0,
                }
                for q in slowest_queries
            ],
            "most_frequent_queries": [
                {
                    "hash": q.query_hash,
                    "execution_count": q.execution_count,
                    "avg_time": q.average_time,
                    "total_time": q.total_time,
                }
                for q in frequent_queries
            ],
        }

    def get_metrics(self) -> Dict[str, Any]:
        """Get comprehensive database metrics"""
        return {
            "connection_state": self.connection_state.value,
            "metrics": {
                "total_connections": self.metrics.total_connections,
                "active_connections": self.metrics.active_connections,
                "idle_connections": self.metrics.idle_connections,
                "max_connections": self.metrics.max_connections,
                "min_connections": self.metrics.min_connections,
                "connection_waits": self.metrics.connection_waits,
                "connection_timeouts": self.metrics.connection_timeouts,
                "queries_executed": self.metrics.queries_executed,
                "average_query_time": self.metrics.average_query_time,
                "cache_hits": self.metrics.cache_hits,
                "cache_misses": self.metrics.cache_misses,
                "cache_hit_rate": (
                    self.metrics.cache_hits / (self.metrics.cache_hits + self.metrics.cache_misses)
                    if (self.metrics.cache_hits + self.metrics.cache_misses) > 0
                    else 0
                ),
                "uptime_seconds": self.metrics.uptime_seconds,
                "last_health_check": self.metrics.last_health_check.isoformat() if self.metrics.last_health_check else None,
            },
            "circuit_breaker": {
                "failures": self.circuit_breaker_failures,
                "threshold": self.circuit_breaker_threshold,
                "is_open": not self._circuit_breaker_allows(),
                "last_failure": self.circuit_breaker_last_failure,
            },
            "cache": self.query_cache.get_stats(),
            "performance": self._get_query_performance_summary(),
        }

    async def optimize_database(self) -> Dict[str, Any]:
        """Run database optimization operations"""
        optimization_results = {
            "vacuum_analyze": False,
            "index_maintenance": False,
            "statistics_update": False,
            "cache_clear": False,
            "errors": [],
        }

        try:
            async with self.get_connection() as conn:
                # Run VACUUM ANALYZE on key tables
                tables = ["conversations", "messages", "users", "projects", "tasks", "n8n_executions", "n8n_workflows"]

                for table in tables:
                    try:
                        await conn.execute(f"VACUUM ANALYZE {table}")
                        logger.info(f"Vacuumed and analyzed table: {table}")
                    except Exception as e:
                        optimization_results["errors"].append(f"Failed to vacuum {table}: {str(e)}")

                optimization_results["vacuum_analyze"] = True

                # Update table statistics
                await conn.execute("ANALYZE")
                optimization_results["statistics_update"] = True

        except Exception as e:
            optimization_results["errors"].append(f"Database optimization failed: {str(e)}")

        # Clear query cache
        try:
            self.query_cache.clear()
            optimization_results["cache_clear"] = True
        except Exception as e:
            optimization_results["errors"].append(f"Cache clear failed: {str(e)}")

        return optimization_results

    async def store_voice_interaction(
        self, user_id: str, audio_data: Dict[str, Any], transcription: str, intent_result: Dict[str, Any]
    ) -> str:
        """Store voice interaction data with optimized indexing"""
        voice_id = str(uuid4())

        try:
            async with self.connection_pool.acquire() as conn:
                # Store in voice_interactions table (new table for voice data)
                query = """
                    INSERT INTO voice_interactions (
                        id, user_id, audio_file_path, transcription, 
                        confidence_score, intent_detected, workflow_triggered,
                        processing_time, created_at, metadata
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                """

                await conn.execute(
                    query,
                    voice_id,
                    user_id,
                    audio_data.get("file_path"),
                    transcription,
                    intent_result.get("confidence", 0.0),
                    intent_result.get("primary_intent"),
                    intent_result.get("workflow_recommendation"),
                    audio_data.get("processing_time", 0.0),
                    datetime.utcnow(),
                    json.dumps(
                        {
                            "audio_format": audio_data.get("format"),
                            "duration": audio_data.get("duration"),
                            "entities": intent_result.get("entities", []),
                            "sentiment": intent_result.get("sentiment"),
                        }
                    ),
                )

                return voice_id

        except Exception as e:
            logger.error(f"Failed to store voice interaction: {e}")
            raise

    async def get_user_voice_patterns(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Analyze user voice interaction patterns for intelligence features"""
        try:
            async with self.connection_pool.acquire() as conn:
                # Get voice usage patterns
                query = """
                    SELECT 
                        intent_detected,
                        COUNT(*) as usage_count,
                        AVG(confidence_score) as avg_confidence,
                        AVG(processing_time) as avg_processing_time
                    FROM voice_interactions 
                    WHERE user_id = $1 
                    AND created_at >= NOW() - INTERVAL '%s days'
                    GROUP BY intent_detected
                    ORDER BY usage_count DESC
                """

                results = await conn.fetch(query, user_id, days)

                patterns = {
                    "most_used_intents": [dict(row) for row in results],
                    "total_voice_interactions": sum(row["usage_count"] for row in results),
                    "average_confidence": sum(row["avg_confidence"] * row["usage_count"] for row in results)
                    / max(sum(row["usage_count"] for row in results), 1),
                    "voice_adoption_trend": await self._get_voice_adoption_trend(conn, user_id, days),
                }

                return patterns

        except Exception as e:
            logger.error(f"Failed to get voice patterns: {e}")
            return {}

    async def _get_voice_adoption_trend(self, conn, user_id: str, days: int) -> List[Dict[str, Any]]:
        """Get voice usage trend over time"""
        query = """
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as interactions
            FROM voice_interactions 
            WHERE user_id = $1 
            AND created_at >= NOW() - INTERVAL '%s days'
            GROUP BY DATE(created_at)
            ORDER BY date
        """

        results = await conn.fetch(query, user_id, days)
        return [dict(row) for row in results]

    async def store_mobile_session(self, user_id: str, session_data: Dict[str, Any]) -> str:
        """Store mobile session data for analytics"""
        session_id = str(uuid4())

        try:
            async with self.connection_pool.acquire() as conn:
                query = """
                    INSERT INTO mobile_sessions (
                        id, user_id, device_type, browser, screen_size,
                        touch_interactions, gestures_used, session_duration,
                        performance_metrics, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                """

                await conn.execute(
                    query,
                    session_id,
                    user_id,
                    session_data.get("device_type"),
                    session_data.get("browser"),
                    session_data.get("screen_size"),
                    session_data.get("touch_count", 0),
                    json.dumps(session_data.get("gestures", [])),
                    session_data.get("duration", 0),
                    json.dumps(session_data.get("performance", {})),
                    datetime.utcnow(),
                )

                return session_id

        except Exception as e:
            logger.error(f"Failed to store mobile session: {e}")
            raise

    async def get_intelligence_insights(self, user_id: str, insight_type: str) -> List[Dict[str, Any]]:
        """Get AI intelligence insights for user"""
        try:
            async with self.connection_pool.acquire() as conn:
                if insight_type == "routine_coaching":
                    return await self._get_routine_insights(conn, user_id)
                elif insight_type == "project_intelligence":
                    return await self._get_project_insights(conn, user_id)
                elif insight_type == "calendar_optimization":
                    return await self._get_calendar_insights(conn, user_id)
                else:
                    return []

        except Exception as e:
            logger.error(f"Failed to get intelligence insights: {e}")
            return []

    async def _get_routine_insights(self, conn, user_id: str) -> List[Dict[str, Any]]:
        """Get routine coaching insights"""
        query = """
            SELECT 
                r.name as routine_name,
                COUNT(rc.id) as completions,
                AVG(rc.completion_percentage) as avg_completion,
                MAX(rc.completed_at) as last_completion
            FROM routines r
            LEFT JOIN daily_routine_completions rc ON r.id = rc.routine_id
            WHERE r.user_id = $1
            AND rc.completed_at >= NOW() - INTERVAL '30 days'
            GROUP BY r.id, r.name
            ORDER BY avg_completion DESC
        """

        results = await conn.fetch(query, user_id)
        return [dict(row) for row in results]

    async def _get_project_insights(self, conn, user_id: str) -> List[Dict[str, Any]]:
        """Get project intelligence insights"""
        query = """
            SELECT 
                p.name,
                p.health_score,
                p.progress,
                COUNT(t.id) as total_tasks,
                COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
                AVG(CASE WHEN t.status = 'completed' AND t.updated_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as recent_velocity
            FROM projects p
            LEFT JOIN tasks t ON p.id = t.project_id
            WHERE p.user_id = $1
            GROUP BY p.id, p.name, p.health_score, p.progress
            ORDER BY p.health_score DESC
        """

        results = await conn.fetch(query, user_id)
        return [dict(row) for row in results]

    async def _get_calendar_insights(self, conn, user_id: str) -> List[Dict[str, Any]]:
        """Get calendar optimization insights"""
        query = """
            SELECT 
                EXTRACT(HOUR FROM start_time) as hour,
                COUNT(*) as event_count,
                AVG(EXTRACT(EPOCH FROM (end_time - start_time))/3600) as avg_duration
            FROM calendar_events
            WHERE user_id = $1
            AND start_time >= NOW() - INTERVAL '30 days'
            GROUP BY EXTRACT(HOUR FROM start_time)
            ORDER BY hour
        """

        results = await conn.fetch(query, user_id)
        return [dict(row) for row in results]

    async def optimize_for_mobile(self) -> Dict[str, Any]:
        """Optimize database queries specifically for mobile performance"""
        optimization_results = {"mobile_optimizations": [], "errors": []}

        try:
            async with self.connection_pool.acquire() as conn:
                # Create mobile-specific indexes
                mobile_indexes = [
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_interactions_user_created ON voice_interactions(user_id, created_at DESC)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mobile_sessions_user_device ON mobile_sessions(user_id, device_type)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_mobile_priority ON tasks(user_id, status, priority) WHERE status != 'completed'",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_mobile_recent ON messages(conversation_id, created_at DESC) WHERE created_at >= NOW() - INTERVAL '7 days'",
                ]

                for index_sql in mobile_indexes:
                    try:
                        await conn.execute(index_sql)
                        optimization_results["mobile_optimizations"].append(
                            f"Created mobile index: {index_sql.split()[-1] if 'idx_' in index_sql else 'unknown'}"
                        )
                    except Exception as e:
                        optimization_results["errors"].append(f"Failed to create mobile index: {str(e)}")

                # Optimize mobile query performance
                await conn.execute("ANALYZE voice_interactions, mobile_sessions, tasks, messages")
                optimization_results["mobile_optimizations"].append("Updated mobile table statistics")

        except Exception as e:
            optimization_results["errors"].append(f"Mobile optimization failed: {str(e)}")

        return optimization_results

    async def create_mobile_tables(self) -> Dict[str, Any]:
        """Create tables specific to mobile and voice features"""
        table_results = {"created_tables": [], "errors": []}

        try:
            async with self.connection_pool.acquire() as conn:
                # Voice interactions table
                voice_table_sql = """
                    CREATE TABLE IF NOT EXISTS voice_interactions (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        audio_file_path TEXT,
                        transcription TEXT NOT NULL,
                        confidence_score FLOAT DEFAULT 0.0,
                        intent_detected TEXT,
                        workflow_triggered TEXT,
                        processing_time FLOAT DEFAULT 0.0,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        metadata JSONB DEFAULT '{}'
                    )
                """

                await conn.execute(voice_table_sql)
                table_results["created_tables"].append("voice_interactions")

                # Mobile sessions table
                mobile_table_sql = """
                    CREATE TABLE IF NOT EXISTS mobile_sessions (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        device_type TEXT,
                        browser TEXT,
                        screen_size TEXT,
                        touch_interactions INTEGER DEFAULT 0,
                        gestures_used JSONB DEFAULT '[]',
                        session_duration INTEGER DEFAULT 0,
                        performance_metrics JSONB DEFAULT '{}',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                """

                await conn.execute(mobile_table_sql)
                table_results["created_tables"].append("mobile_sessions")

                # Intelligence cache table
                intelligence_table_sql = """
                    CREATE TABLE IF NOT EXISTS intelligence_cache (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        cache_type TEXT NOT NULL,
                        cache_key TEXT NOT NULL,
                        cache_data JSONB NOT NULL,
                        expires_at TIMESTAMP WITH TIME ZONE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        UNIQUE(user_id, cache_type, cache_key)
                    )
                """

                await conn.execute(intelligence_table_sql)
                table_results["created_tables"].append("intelligence_cache")

        except Exception as e:
            table_results["errors"].append(f"Table creation failed: {str(e)}")

        return table_results


# Global optimized database service instance
optimized_database = OptimizedDatabaseService()
