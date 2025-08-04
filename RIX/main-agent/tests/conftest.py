# /main-agent/tests/conftest.py
# Common pytest configuration for main-agent test suite
# Handles Python path setup and common fixtures for intelligence features testing
# RELEVANT FILES: pytest configuration, all test files in tests/ directory

import os
import sys

import pytest

# Ensure the app module can be imported by adding main-agent directory to Python path
# This handles cases where pytest is run from different working directories
main_agent_dir = os.path.join(os.path.dirname(__file__), "..")
if main_agent_dir not in sys.path:
    sys.path.insert(0, main_agent_dir)

# Set up test environment variables to avoid pydantic validation errors
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-key")
os.environ.setdefault("DB_USER", "test_user")
os.environ.setdefault("DB_PASSWORD", "test_password")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("DB_NAME", "test_database")
os.environ.setdefault("N8N_BASE_URL", "http://localhost:5678")
os.environ.setdefault("N8N_API_KEY", "test-api-key")
os.environ.setdefault("DEBUG", "true")

# Set up async test configuration
pytest_plugins = ("pytest_asyncio",)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    import asyncio

    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_database():
    """Mock database for testing"""
    from unittest.mock import AsyncMock

    mock_db = AsyncMock()
    return mock_db


@pytest.fixture
def mock_n8n_client():
    """Mock N8N client for testing"""
    from unittest.mock import AsyncMock

    mock_client = AsyncMock()
    return mock_client


# Common test data fixtures
@pytest.fixture
def sample_user_id():
    """Standard test user ID"""
    return "test-user-123"


@pytest.fixture
def sample_routine_data():
    """Sample routine data for testing"""
    return {
        "routines": [
            {
                "id": "routine-1",
                "name": "Morning Routine",
                "frequency": "daily",
                "habits": [
                    {"id": "habit-1", "name": "Meditation", "duration": 10},
                    {"id": "habit-2", "name": "Exercise", "duration": 30},
                ],
            }
        ]
    }


@pytest.fixture
def sample_project_data():
    """Sample project data for testing"""
    return {
        "projects": [
            {
                "id": "project-1",
                "name": "RIX Development",
                "status": "active",
                "priority": "high",
                "aiHealthScore": 87,
                "progress": 65,
            },
            {
                "id": "project-2",
                "name": "Personal Website",
                "status": "active",
                "priority": "medium",
                "aiHealthScore": 73,
                "progress": 40,
            },
        ]
    }


@pytest.fixture
def sample_calendar_data():
    """Sample calendar data for testing"""
    from datetime import datetime, timedelta

    return {
        "events": [
            {
                "id": "event-1",
                "title": "Team Meeting",
                "startTime": (datetime.now() + timedelta(hours=2)).isoformat(),
                "endTime": (datetime.now() + timedelta(hours=3)).isoformat(),
                "priority": "high",
            }
        ],
        "timeBlocks": [
            {"id": "block-1", "title": "Focus Time", "startTime": "09:00", "endTime": "11:00", "type": "deep_work"}
        ],
    }
