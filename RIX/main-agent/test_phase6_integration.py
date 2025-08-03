#!/usr/bin/env python3
"""
/Users/benediktthomas/RIX Personal Agent/RIX/main-agent/test_phase6_integration.py
Test script for Phase 6 N8N Integration & Workflow Management
Validates workflow discovery, activation, and AI-triggered execution
RELEVANT FILES: n8n_client.py, database.py, workflow_manager.py, ai_workflow_intelligence.py
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from app.core.config import settings
from app.core.logging import get_logger
from app.services.database import database
from app.services.n8n_client import n8n_client
from app.services.workflow_manager import workflow_manager
from app.services.ai_workflow_intelligence import ai_workflow_intelligence
from app.models.chat import WorkflowType

logger = get_logger(__name__)


async def test_database_n8n_workflows_table():
    """Test N8N workflows table creation and operations"""
    print("\\n=== Testing N8N Workflows Database Table ===")
    
    try:
        await database.connect()
        
        # Test table creation
        print("Creating N8N workflows table...")
        await database.create_n8n_workflows_table()
        print("✅ N8N workflows table created successfully")
        
        # Test workflow metadata storage
        print("\\nTesting workflow metadata storage...")
        test_workflow = await database.store_workflow_metadata(
            workflow_id="test-workflow-001",
            name="Test Task Management Workflow",
            active=True,
            description="Test workflow for task management",
            category="productivity",
            workflow_type="task-management",
            tags=["test", "productivity", "tasks"],
            version="1.0.0",
            metadata={"test": True, "created_by": "phase6_test"}
        )
        print(f"✅ Workflow stored: {test_workflow['name']} (ID: {test_workflow['id']})")
        
        # Test workflow retrieval by category
        print("\\nTesting workflow retrieval by category...")
        productivity_workflows = await database.get_workflows_by_category("productivity", active_only=True)
        print(f"✅ Found {len(productivity_workflows)} productivity workflows")
        
        # Test workflow status update
        print("\\nTesting workflow status update...")
        update_success = await database.update_workflow_status("test-workflow-001", False)
        print(f"✅ Workflow status updated: {update_success}")
        
        # Test workflow execution tracking
        print("\\nTesting workflow execution tracking...")
        tracking_result = await database.track_workflow_execution(
            workflow_id="test-workflow-001",
            execution_time=2.5,
            success=True,
            ai_triggered=True
        )
        print(f"✅ Execution tracked: {tracking_result.get('execution_count', 0)} total executions")
        
        # Test workflow analytics
        print("\\nTesting workflow analytics...")
        analytics = await database.get_workflow_analytics(days=7)
        summary = analytics.get("summary", {})
        print(f"✅ Analytics retrieved: {summary.get('total_workflows', 0)} workflows, {summary.get('total_executions', 0)} executions")
        
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {str(e)}")
        return False
    finally:
        if database.connected:
            await database.disconnect()


async def test_n8n_workflow_discovery():
    """Test N8N workflow discovery and categorization"""
    print("\\n=== Testing N8N Workflow Discovery ===")
    
    try:
        # Test workflow discovery
        print("Discovering N8N workflows...")
        workflows = await n8n_client.discover_workflows()
        print(f"✅ Discovered {len(workflows)} workflows")
        
        # Test workflow categorization
        print("\\nTesting workflow categorization...")
        categorized = await n8n_client.categorize_workflows(workflows)
        for category, category_workflows in categorized.items():
            print(f"  - {category}: {len(category_workflows)} workflows")
        
        # Test workflow activation
        if workflows:
            test_workflow = workflows[0]
            print(f"\\nTesting workflow activation for: {test_workflow.name}")
            
            # Test deactivation
            deactivate_result = await n8n_client.activate_workflow(test_workflow.id, False)
            print(f"✅ Deactivation result: {deactivate_result}")
            
            # Test activation
            activate_result = await n8n_client.activate_workflow(test_workflow.id, True)
            print(f"✅ Activation result: {activate_result}")
        
        # Test performance metrics
        print("\\nTesting workflow performance metrics...")
        if workflows:
            metrics = await n8n_client.get_workflow_performance_metrics(workflows[0].id)
            print(f"✅ Performance metrics retrieved: {metrics}")
        
        return True
        
    except Exception as e:
        print(f"❌ N8N discovery test failed: {str(e)}")
        return False


async def test_ai_triggered_workflow_execution():
    """Test AI-triggered workflow execution"""
    print("\\n=== Testing AI-Triggered Workflow Execution ===")
    
    try:
        # Test AI-triggered execution
        print("Testing AI-triggered workflow execution...")
        intelligence_context = {
            "trigger_message": "Execute morning briefing workflow",
            "insights": {"time_of_day": "morning", "user_activity": "high"},
            "confidence": 0.9,
            "trigger_source": "time_pattern"
        }
        
        response = await n8n_client.execute_ai_triggered_workflow(
            workflow_type=WorkflowType.MORNING_BRIEF,
            context=intelligence_context,
            user_id="test-user-123",
            conversation_id="test-conv-456"
        )
        
        print(f"✅ AI-triggered execution completed:")
        print(f"  - Workflow: {response.workflow_type.value}")
        print(f"  - Execution ID: {response.execution_id}")
        print(f"  - Processing time: {response.processing_time}s")
        print(f"  - Response: {response.response[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ AI-triggered execution test failed: {str(e)}")
        return False


async def test_workflow_manager():
    """Test workflow manager functionality"""
    print("\\n=== Testing Workflow Manager ===")
    
    try:
        await database.connect()
        
        # Test workflow discovery and sync
        print("Testing workflow discovery and sync...")
        sync_result = await workflow_manager.discover_and_sync_workflows(force_refresh=True)
        
        print(f"✅ Sync completed:")
        print(f"  - Success: {sync_result.success}")
        print(f"  - Synced: {sync_result.synced_count}")
        print(f"  - New: {sync_result.new_count}")
        print(f"  - Updated: {sync_result.updated_count}")
        print(f"  - Categories: {sync_result.categories}")
        
        # Test getting workflows by category
        print("\\nTesting workflow retrieval by category...")
        productivity_workflows = await workflow_manager.get_workflows_by_category(
            category="productivity", 
            active_only=True
        )
        print(f"✅ Retrieved {len(productivity_workflows)} productivity workflows")
        
        # Test workflow performance metrics
        print("\\nTesting workflow performance metrics...")
        all_metrics = await workflow_manager.get_workflow_performance_metrics()
        print(f"✅ Retrieved metrics for {len(all_metrics)} workflows")
        
        # Test workflow categories
        print("\\nTesting workflow categories...")
        categories = await workflow_manager.get_workflow_categories()
        print(f"✅ Retrieved {len(categories)} categories")
        for category in categories:
            print(f"  - {category.category}: {category.workflow_count} workflows")
        
        # Test sync status
        print("\\nTesting sync status...")
        sync_status = await workflow_manager.get_sync_status()
        print(f"✅ Sync status: {sync_status}")
        
        return True
        
    except Exception as e:
        print(f"❌ Workflow manager test failed: {str(e)}")
        return False
    finally:
        if database.connected:
            await database.disconnect()


async def test_ai_workflow_intelligence():
    """Test AI workflow intelligence"""
    print("\\n=== Testing AI Workflow Intelligence ===")
    
    try:
        # Test user pattern analysis
        print("Testing user pattern analysis...")
        test_user_id = "test-user-123"
        insights = await ai_workflow_intelligence.analyze_user_patterns(test_user_id)
        
        print(f"✅ Generated {len(insights)} insights for user:")
        for insight in insights:
            print(f"  - {insight.insight_type}: {insight.trigger_workflow.value} (confidence: {insight.confidence})")
        
        # Test message trigger processing
        print("\\nTesting message trigger processing...")
        test_messages = [
            "Good morning! How should I start my day?",
            "I have too many tasks and feeling overwhelmed",
            "Can you help me optimize my daily routine?",
            "What's my calendar looking like today?"
        ]
        
        for message in test_messages:
            message_insights = await ai_workflow_intelligence.process_message_for_triggers(
                user_id=test_user_id,
                message=message,
                conversation_id="test-conv-789"
            )
            
            if message_insights:
                print(f"✅ Message: '{message[:50]}...'")
                for insight in message_insights:
                    print(f"   → Trigger: {insight.trigger_workflow.value} (confidence: {insight.confidence})")
        
        # Test intelligence insight execution
        print("\\nTesting intelligence insight execution...")
        if insights:
            high_confidence_insights = [i for i in insights if i.confidence >= 0.7]
            if high_confidence_insights:
                execution_results = await ai_workflow_intelligence.execute_intelligence_insights(
                    high_confidence_insights[:1]  # Execute only one for testing
                )
                print(f"✅ Execution results: {execution_results}")
        
        return True
        
    except Exception as e:
        print(f"❌ AI workflow intelligence test failed: {str(e)}")
        return False


async def test_integration_endpoints():
    """Test integration with API endpoints"""
    print("\\n=== Testing API Integration ===")
    
    try:
        # This would normally test the API endpoints, but since we're in a script context,
        # we'll just validate that the imports and basic functionality work
        
        print("Testing imports and basic functionality...")
        
        # Test that all services can be imported and initialized
        from app.api.endpoints.n8n import router as n8n_router
        from app.api.endpoints.chat import router as chat_router
        
        print("✅ N8N endpoints imported successfully")
        print("✅ Chat endpoints imported successfully")
        
        # Test that all models can be imported
        from app.models.n8n import (
            WorkflowDiscoveryRequest, WorkflowActivationRequest,
            AITriggeredExecutionRequest, WorkflowAnalyticsResponse
        )
        
        print("✅ Phase 6 N8N models imported successfully")
        
        # Test model instantiation
        discovery_request = WorkflowDiscoveryRequest(category="productivity", active_only=True)
        print(f"✅ Discovery request created: {discovery_request}")
        
        activation_request = WorkflowActivationRequest(workflow_id="test-123", active=True)
        print(f"✅ Activation request created: {activation_request}")
        
        return True
        
    except Exception as e:
        print(f"❌ API integration test failed: {str(e)}")
        return False


async def run_comprehensive_test():
    """Run comprehensive Phase 6 integration test"""
    print("🚀 Starting Phase 6 N8N Integration & Workflow Management Tests")
    print(f"⏰ Test started at: {datetime.utcnow().isoformat()}")
    print("=" * 80)
    
    test_results = {}
    
    # Run all tests
    tests = [
        ("Database N8N Workflows Table", test_database_n8n_workflows_table),
        ("N8N Workflow Discovery", test_n8n_workflow_discovery),
        ("AI-Triggered Workflow Execution", test_ai_triggered_workflow_execution),
        ("Workflow Manager", test_workflow_manager),
        ("AI Workflow Intelligence", test_ai_workflow_intelligence),
        ("API Integration", test_integration_endpoints)
    ]
    
    for test_name, test_func in tests:
        try:
            print(f"\\n🧪 Running test: {test_name}")
            result = await test_func()
            test_results[test_name] = result
            if result:
                print(f"✅ {test_name} - PASSED")
            else:
                print(f"❌ {test_name} - FAILED")
        except Exception as e:
            test_results[test_name] = False
            print(f"❌ {test_name} - ERROR: {str(e)}")
    
    # Print summary
    print("\\n" + "=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for result in test_results.values() if result)
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<40} {status}")
    
    print(f"\\n📈 Overall: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 All Phase 6 N8N Integration tests PASSED!")
        print("✅ Phase 6 implementation is ready for DevOps-Automator handoff")
    else:
        print("⚠️  Some tests FAILED - review implementation before handoff")
    
    print(f"⏰ Test completed at: {datetime.utcnow().isoformat()}")
    
    return passed == total


if __name__ == "__main__":
    # Set up test environment
    import os
    os.environ["DEBUG"] = "true"
    os.environ["JWT_SECRET"] = "test-secret-key"
    os.environ["DB_USER"] = "test"
    os.environ["DB_PASSWORD"] = "test"
    os.environ["DB_HOST"] = "localhost"
    os.environ["DB_PORT"] = "5432"
    os.environ["DB_NAME"] = "test_rix"
    os.environ["N8N_BASE_URL"] = "https://n8n.example.com"
    
    try:
        result = asyncio.run(run_comprehensive_test())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\\n❌ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\\n❌ Test framework error: {str(e)}")
        sys.exit(1)