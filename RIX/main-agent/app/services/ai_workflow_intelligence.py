"""
/Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/services/ai_workflow_intelligence.py
AI-powered workflow intelligence service for RIX Main Agent
Analyzes user patterns and automatically triggers appropriate N8N workflows
RELEVANT FILES: n8n_client.py, database.py, message_router.py, chat.py
"""

import asyncio
import time
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass

from app.core.logging import get_logger
from app.models.chat import WorkflowType, MessageType
from app.services.n8n_client import n8n_client
from app.services.database import database

logger = get_logger(__name__)


@dataclass
class IntelligenceInsight:
    """AI-generated insight that can trigger workflows"""
    insight_type: str
    confidence: float
    trigger_workflow: WorkflowType
    context: Dict[str, Any]
    user_id: str
    priority: str = "normal"
    reasoning: str = ""


class AIWorkflowIntelligence:
    """AI-powered workflow intelligence engine"""
    
    def __init__(self):
        self.insights_cache: Dict[str, List[IntelligenceInsight]] = {}
        self.pattern_analysis_interval = 3600  # 1 hour
        self.min_confidence_threshold = 0.7
        
        # Pattern-based triggers (no LLM calls - RIX compliant)
        self.routine_patterns = {
            "morning_routine": {
                "time_range": (6, 10),  # 6 AM to 10 AM
                "keywords": ["good morning", "start day", "coffee", "breakfast"],
                "workflow": WorkflowType.MORNING_BRIEF,
                "confidence": 0.8
            },
            "calendar_heavy": {
                "keywords": ["meeting", "appointment", "schedule", "calendar", "busy"],
                "workflow": WorkflowType.CALENDAR_OPTIMIZATION,
                "confidence": 0.75
            },
            "project_status": {
                "keywords": ["project", "progress", "status", "deadline", "milestone"],
                "workflow": WorkflowType.PROJECT_INTELLIGENCE,
                "confidence": 0.7
            },
            "routine_optimization": {
                "keywords": ["routine", "habit", "daily", "improve", "optimize"],
                "workflow": WorkflowType.ROUTINE_COACHING,
                "confidence": 0.8
            },
            "task_overwhelm": {
                "keywords": ["overwhelmed", "too much", "busy", "stressed", "tasks"],
                "workflow": WorkflowType.TASK_MANAGEMENT,
                "confidence": 0.85
            }
        }
    
    async def analyze_user_patterns(self, user_id: str) -> List[IntelligenceInsight]:
        """Analyze user patterns and generate intelligence insights"""
        logger.info("Analyzing user patterns for workflow triggers", user_id=user_id)
        
        try:
            insights = []
            
            # Get recent user messages and activity
            recent_activity = await self._get_recent_user_activity(user_id)
            
            # Analyze time-based patterns
            time_insights = await self._analyze_time_patterns(user_id, recent_activity)
            insights.extend(time_insights)
            
            # Analyze conversation patterns
            conversation_insights = await self._analyze_conversation_patterns(user_id, recent_activity)
            insights.extend(conversation_insights)
            
            # Filter by confidence threshold
            high_confidence_insights = [
                insight for insight in insights 
                if insight.confidence >= self.min_confidence_threshold
            ]
            
            # Store insights in cache
            self.insights_cache[user_id] = high_confidence_insights
            
            logger.info(
                "Pattern analysis completed",
                user_id=user_id,
                total_insights=len(insights),
                high_confidence=len(high_confidence_insights)
            )
            
            return high_confidence_insights
            
        except Exception as e:
            logger.error("Failed to analyze user patterns", user_id=user_id, error=str(e))
            return []
    
    async def _get_recent_user_activity(self, user_id: str) -> Dict[str, Any]:
        """Get recent user activity data"""
        try:
            # Get recent conversations (last 7 days)
            conversations = await database.get_user_conversations(user_id, limit=50)
            
            # Calculate activity metrics
            current_time = datetime.utcnow()
            recent_conversations = [
                conv for conv in conversations 
                if (current_time - conv["updated_at"]).days <= 7
            ]
            
            return {
                "conversations": recent_conversations,
                "conversation_count": len(recent_conversations),
                "activity_period": 7
            }
            
        except Exception as e:
            logger.error("Failed to get recent user activity", user_id=user_id, error=str(e))
            return {}
    
    async def _analyze_time_patterns(self, user_id: str, activity: Dict[str, Any]) -> List[IntelligenceInsight]:
        """Analyze time-based usage patterns"""
        insights = []
        current_hour = datetime.utcnow().hour
        
        try:
            # Morning routine trigger
            if 6 <= current_hour <= 10:
                insights.append(IntelligenceInsight(
                    insight_type="morning_routine",
                    confidence=0.85,
                    trigger_workflow=WorkflowType.MORNING_BRIEF,
                    context={
                        "time": current_hour,
                        "reasoning": "Morning hours detected",
                        "trigger_message": "Generate morning brief for user"
                    },
                    user_id=user_id,
                    priority="high",
                    reasoning="User typically benefits from morning briefings during morning hours"
                ))
            
            # Calendar optimization trigger (during business hours)
            if 9 <= current_hour <= 17:
                conversation_count = activity.get("conversation_count", 0)
                if conversation_count > 5:  # High activity indicator
                    insights.append(IntelligenceInsight(
                        insight_type="calendar_optimization",
                        confidence=0.75,
                        trigger_workflow=WorkflowType.CALENDAR_OPTIMIZATION,
                        context={
                            "time": current_hour,
                            "activity_level": "high",
                            "conversation_count": conversation_count,
                            "trigger_message": "Optimize calendar based on high activity"
                        },
                        user_id=user_id,
                        priority="normal",
                        reasoning="High activity during business hours suggests calendar optimization needed"
                    ))
            
        except Exception as e:
            logger.error("Failed to analyze time patterns", user_id=user_id, error=str(e))
        
        return insights
    
    async def _analyze_conversation_patterns(self, user_id: str, activity: Dict[str, Any]) -> List[IntelligenceInsight]:
        """Analyze conversation content patterns"""
        insights = []
        
        try:
            conversations = activity.get("conversations", [])
            if not conversations:
                return insights
            
            # Analyze conversation titles for patterns
            all_titles = " ".join([conv.get("title", "").lower() for conv in conversations])
            
            # Check for routine-related discussions
            routine_keywords = ["routine", "habit", "daily", "morning", "schedule", "optimize"]
            routine_mentions = sum(1 for keyword in routine_keywords if keyword in all_titles)
            
            if routine_mentions >= 2:  # Multiple routine-related conversations
                insights.append(IntelligenceInsight(
                    insight_type="routine_interest",
                    confidence=0.8,
                    trigger_workflow=WorkflowType.ROUTINE_COACHING,
                    context={
                        "keyword_matches": routine_mentions,
                        "pattern": "routine_discussion",
                        "trigger_message": "Provide routine coaching based on user interest"
                    },
                    user_id=user_id,
                    priority="normal",
                    reasoning="User has shown interest in routine optimization through conversations"
                ))
            
        except Exception as e:
            logger.error("Failed to analyze conversation patterns", user_id=user_id, error=str(e))
        
        return insights
    
    async def process_message_for_triggers(self, user_id: str, message: str, 
                                         conversation_id: str) -> List[IntelligenceInsight]:
        """Process individual message for immediate workflow triggers"""
        logger.info("Processing message for workflow triggers", user_id=user_id)
        
        insights = []
        message_lower = message.lower()
        
        try:
            # Check for pattern-based triggers
            for pattern_name, pattern_config in self.routine_patterns.items():
                keywords = pattern_config.get("keywords", [])
                
                # Check if message contains pattern keywords
                keyword_matches = sum(1 for keyword in keywords if keyword in message_lower)
                
                if keyword_matches >= 2:  # At least 2 keyword matches
                    confidence = pattern_config.get("confidence", 0.7)
                    confidence += min(0.2, keyword_matches * 0.05)
                    
                    insights.append(IntelligenceInsight(
                        insight_type=f"message_trigger_{pattern_name}",
                        confidence=confidence,
                        trigger_workflow=pattern_config["workflow"],
                        context={
                            "message_content": message[:200],  # First 200 chars
                            "keyword_matches": keyword_matches,
                            "matched_keywords": [kw for kw in keywords if kw in message_lower],
                            "pattern": pattern_name,
                            "trigger_message": f"Execute {pattern_config['workflow'].value} based on message content",
                            "conversation_id": conversation_id
                        },
                        user_id=user_id,
                        priority="high" if confidence > 0.8 else "normal",
                        reasoning=f"Message content matches {pattern_name} pattern with {keyword_matches} keywords"
                    ))
            
            logger.info(
                "Message processing completed",
                user_id=user_id,
                insights_found=len(insights)
            )
            
        except Exception as e:
            logger.error("Failed to process message for triggers", user_id=user_id, error=str(e))
        
        return insights
    
    async def execute_intelligence_insights(self, insights: List[IntelligenceInsight]) -> Dict[str, Any]:
        """Execute workflows based on intelligence insights"""
        logger.info(f"Executing {len(insights)} intelligence insights")
        
        results = {
            "executed": 0,
            "failed": 0,
            "skipped": 0,
            "executions": []
        }
        
        for insight in insights:
            try:
                logger.info(
                    "Executing intelligence insight",
                    insight_type=insight.insight_type,
                    workflow=insight.trigger_workflow.value,
                    confidence=insight.confidence
                )
                
                # Execute AI-triggered workflow
                response = await n8n_client.execute_ai_triggered_workflow(
                    workflow_type=insight.trigger_workflow,
                    context=insight.context,
                    user_id=insight.user_id,
                    conversation_id=insight.context.get("conversation_id")
                )
                
                results["executed"] += 1
                results["executions"].append({
                    "insight_type": insight.insight_type,
                    "workflow": insight.trigger_workflow.value,
                    "execution_id": response.execution_id,
                    "status": "success",
                    "processing_time": response.processing_time
                })
                
                logger.info(
                    "Intelligence insight executed successfully",
                    insight_type=insight.insight_type,
                    execution_id=response.execution_id
                )
                
            except Exception as e:
                results["failed"] += 1
                results["executions"].append({
                    "insight_type": insight.insight_type,
                    "workflow": insight.trigger_workflow.value,
                    "status": "failed",
                    "error": str(e)
                })
                
                logger.error(
                    "Failed to execute intelligence insight",
                    insight_type=insight.insight_type,
                    error=str(e)
                )
        
        logger.info(
            "Intelligence insights execution completed",
            executed=results["executed"],
            failed=results["failed"]
        )
        
        return results
    
    async def schedule_intelligence_analysis(self, user_id: str) -> None:
        """Schedule periodic intelligence analysis for user"""
        logger.info("Scheduling intelligence analysis", user_id=user_id)
        
        try:
            # Run pattern analysis
            insights = await self.analyze_user_patterns(user_id)
            
            # Execute high-priority insights automatically
            high_priority_insights = [
                insight for insight in insights 
                if insight.priority == "high" and insight.confidence >= 0.8
            ]
            
            if high_priority_insights:
                results = await self.execute_intelligence_insights(high_priority_insights)
                logger.info(
                    "Scheduled intelligence analysis completed",
                    user_id=user_id,
                    executed=results["executed"]
                )
            
        except Exception as e:
            logger.error("Scheduled intelligence analysis failed", user_id=user_id, error=str(e))


# Global intelligence service instance
ai_workflow_intelligence = AIWorkflowIntelligence()