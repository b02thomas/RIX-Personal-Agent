# /03-implementation/backend-improvements/enhanced-mock-responses.py
# Enhanced mock response system for RIX Main Agent
# Provides realistic data for chat, tasks, projects, voice commands
# RELEVANT FILES: app/services/message_router.py, app/models/chat.py, app/api/endpoints/chat.py

# SECURITY NOTE: This file uses Python's random module for generating mock test data only.
# The random module is NOT used for any cryptographic or security purposes.
# For production security features, use the secrets module or cryptographically secure alternatives.

import json
import random  # Used only for mock data generation, not for security purposes
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

from app.models.chat import MessageType, WorkflowType


class MockDataGenerator:
    """Enhanced mock data generator for realistic API responses"""

    def __init__(self):
        self.projects = self._generate_projects()
        self.tasks = self._generate_tasks()
        self.users = self._generate_users()
        self.conversations = self._generate_conversations()

    def _generate_projects(self) -> List[Dict[str, Any]]:
        """Generate realistic project data"""
        projects = [
            {
                "id": str(uuid.uuid4()),
                "name": "RIX Personal Agent",
                "description": "AI-powered personal productivity assistant",
                "status": "active",
                "priority": "high",
                "health_score": 85,
                "progress": 75,
                "created_at": datetime.utcnow() - timedelta(days=45),
                "updated_at": datetime.utcnow() - timedelta(hours=2),
                "tags": ["ai", "productivity", "web-app"],
                "team_size": 3,
                "color": "#0066FF",
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Mobile App Development",
                "description": "Cross-platform mobile companion app",
                "status": "planning",
                "priority": "medium",
                "health_score": 62,
                "progress": 15,
                "created_at": datetime.utcnow() - timedelta(days=12),
                "updated_at": datetime.utcnow() - timedelta(hours=8),
                "tags": ["mobile", "react-native", "ios", "android"],
                "team_size": 2,
                "color": "#00CC88",
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Documentation Website",
                "description": "Comprehensive user and developer documentation",
                "status": "active",
                "priority": "medium",
                "health_score": 78,
                "progress": 40,
                "created_at": datetime.utcnow() - timedelta(days=20),
                "updated_at": datetime.utcnow() - timedelta(days=1),
                "tags": ["documentation", "website", "user-guide"],
                "team_size": 1,
                "color": "#FF6B35",
            },
            {
                "id": str(uuid.uuid4()),
                "name": "API Integration Platform",
                "description": "Third-party API integration and workflow automation",
                "status": "completed",
                "priority": "high",
                "health_score": 95,
                "progress": 100,
                "created_at": datetime.utcnow() - timedelta(days=90),
                "updated_at": datetime.utcnow() - timedelta(days=7),
                "tags": ["api", "integration", "automation"],
                "team_size": 4,
                "color": "#8B5CF6",
            },
        ]
        return projects

    def _generate_tasks(self) -> List[Dict[str, Any]]:
        """Generate realistic task data"""
        task_templates = [
            ("Implement voice command recognition", "high", "todo"),
            ("Design mobile chat interface", "medium", "in_progress"),
            ("Fix sidebar navigation bug", "high", "completed"),
            ("Create API documentation", "medium", "todo"),
            ("Setup CI/CD pipeline", "high", "in_progress"),
            ("User testing session", "low", "todo"),
            ("Performance optimization", "medium", "blocked"),
            ("Database migration script", "high", "todo"),
            ("Security audit review", "high", "in_progress"),
            ("Update design system", "low", "completed"),
            ("Implement real-time notifications", "medium", "todo"),
            ("Write unit tests for chat service", "medium", "in_progress"),
            ("Deploy to production environment", "high", "todo"),
            ("Code review for PR #47", "medium", "todo"),
            ("Setup monitoring and alerts", "high", "blocked"),
        ]

        tasks = []
        for i, (title, priority, status) in enumerate(task_templates):
            task = {
                "id": str(uuid.uuid4()),
                "title": title,
                "description": f"Detailed description for {title.lower()}",
                "status": status,
                "priority": priority,
                "project_id": random.choice(self.projects)["id"] if random.random() > 0.2 else None,
                "assigned_to": "current_user",
                "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                "updated_at": datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
                "due_date": datetime.utcnow() + timedelta(days=random.randint(-5, 20)) if random.random() > 0.3 else None,
                "estimated_hours": random.choice([1, 2, 4, 8, 16]),
                "tags": random.sample(
                    ["frontend", "backend", "design", "testing", "documentation", "bug", "feature"], k=random.randint(1, 3)
                ),
                "completion_percentage": random.randint(0, 100) if status in ["in_progress", "completed"] else 0,
            }
            tasks.append(task)

        return tasks

    def _generate_users(self) -> Dict[str, Any]:
        """Generate realistic user data"""
        return {
            "id": str(uuid.uuid4()),
            "email": "user@rix.com",
            "name": "Alex Chen",
            "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
            "created_at": datetime.utcnow() - timedelta(days=60),
            "preferences": {
                "theme": "dark",
                "language": "en",
                "timezone": "UTC",
                "notifications": {"email": True, "push": True, "in_app": True},
            },
            "stats": {"tasks_completed": 127, "projects_active": 3, "productivity_score": 78, "streak_days": 12},
        }

    def _generate_conversations(self) -> List[Dict[str, Any]]:
        """Generate realistic conversation data"""
        conversations = []
        for i in range(5):
            conv = {
                "id": str(uuid.uuid4()),
                "title": f"Chat Session {i + 1}",
                "created_at": datetime.utcnow() - timedelta(days=random.randint(0, 10)),
                "updated_at": datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
                "message_count": random.randint(5, 25),
                "last_message": self._generate_sample_message(),
            }
            conversations.append(conv)
        return conversations

    def _generate_sample_message(self) -> str:
        """Generate sample conversation messages"""
        messages = [
            "Can you help me organize my tasks for today?",
            "What's the status of the RIX project?",
            "Schedule a meeting with the team for tomorrow",
            "Show me my productivity analytics",
            "Create a new task for the documentation update",
            "What are my upcoming deadlines?",
            "Help me prioritize my work this week",
            "Generate a daily briefing for me",
        ]
        return random.choice(messages)


class EnhancedMockResponses:
    """Enhanced mock response system with realistic data"""

    def __init__(self):
        self.data_generator = MockDataGenerator()
        self.response_templates = self._initialize_response_templates()

    def _initialize_response_templates(self) -> Dict[WorkflowType, Dict[str, Any]]:
        """Initialize response templates for each workflow type"""
        return {
            WorkflowType.TASK_MANAGEMENT: {
                "create_task": {
                    "response": "I've created a new task '{task_title}' with {priority} priority. It's been added to your task list and is due {due_date}.",
                    "metadata": {
                        "task_created": True,
                        "task_id": None,  # Will be generated
                        "action": "create",
                        "suggestions": ["Add more details", "Set reminder", "Assign to project"],
                    },
                },
                "list_tasks": {
                    "response": "Here are your current tasks:\n\n{task_list}\n\nYou have {total_tasks} total tasks, with {high_priority} high priority items.",
                    "metadata": {
                        "tasks": [],  # Will be populated
                        "summary": {"total": 0, "completed": 0, "in_progress": 0, "high_priority": 0},
                    },
                },
                "update_task": {
                    "response": "Task '{task_title}' has been updated. Status changed to {new_status}.",
                    "metadata": {"task_updated": True, "changes": {}, "action": "update"},
                },
            },
            WorkflowType.PROJECT_CHATBOT: {
                "project_status": {
                    "response": "The {project_name} project is currently {status} with a health score of {health_score}/100. Progress: {progress}%. Key areas that need attention: {focus_areas}.",
                    "metadata": {"project_data": {}, "health_analysis": {}, "recommendations": []},
                },
                "project_insights": {
                    "response": "Based on recent activity, here are insights for {project_name}:\n\n• Progress velocity: {velocity}\n• Risk level: {risk_level}\n• Recommended actions: {actions}",
                    "metadata": {"insights": {}, "metrics": {}, "action_items": []},
                },
            },
            WorkflowType.CALENDAR_INTELLIGENCE: {
                "schedule_meeting": {
                    "response": "I've scheduled '{meeting_title}' for {date_time}. The meeting has been added to your calendar and participants will be notified.",
                    "metadata": {
                        "event_created": True,
                        "event_id": None,
                        "participants": [],
                        "calendar_link": "https://calendar.example.com/event/123",
                    },
                },
                "availability_check": {
                    "response": "Your availability for {date_range}:\n\n{time_slots}\n\nI recommend scheduling important meetings during your most productive hours: 9-11 AM.",
                    "metadata": {"available_slots": [], "busy_periods": [], "productivity_insights": {}},
                },
                "daily_schedule": {
                    "response": "Here's your schedule for today:\n\n{schedule_items}\n\nYou have {free_time} of free time available.",
                    "metadata": {"events": [], "time_blocks": [], "optimization_suggestions": []},
                },
            },
            WorkflowType.VOICE_PROCESSING: {
                "voice_command": {
                    "response": "I heard: '{transcription}'. I've processed your voice command and {action_taken}.",
                    "metadata": {
                        "transcription": "",
                        "confidence": 0.95,
                        "action_performed": "",
                        "voice_data": {"duration": "3.2s", "quality": "high"},
                    },
                },
                "voice_note": {
                    "response": "Voice note captured and transcribed. I've saved it as: '{note_content}'. Would you like me to create a task or reminder from this?",
                    "metadata": {
                        "transcription": "",
                        "audio_file": "voice_note_123.wav",
                        "suggestions": ["Create task", "Set reminder", "Add to notes"],
                    },
                },
            },
            WorkflowType.ROUTINE_COACHING: {
                "routine_analysis": {
                    "response": "Your routine analysis for this week:\n\n• Completion rate: {completion_rate}%\n• Strongest habit: {best_habit}\n• Needs improvement: {improvement_area}\n\nRecommendation: {coaching_advice}",
                    "metadata": {
                        "routine_data": {},
                        "completion_stats": {},
                        "coaching_insights": [],
                        "suggested_adjustments": [],
                    },
                },
                "habit_coaching": {
                    "response": "Great question about habit optimization! Based on your patterns, I suggest: {suggestions}. Your current streak for {habit_name} is {streak_days} days. Keep it up!",
                    "metadata": {"habit_insights": {}, "optimization_tips": [], "motivational_data": {}},
                },
            },
            WorkflowType.NEWS_INTELLIGENCE: {
                "news_summary": {
                    "response": "Here's your personalized news briefing:\n\n{news_items}\n\nKey themes today: {themes}. Articles relevant to your interests: {relevant_count}",
                    "metadata": {"articles": [], "sources": [], "personalization_score": 0.8, "reading_time": "5 min"},
                }
            },
            WorkflowType.MASTER_BRAIN: {
                "general_help": {
                    "response": "I'm here to help! I can assist you with tasks, projects, scheduling, routines, and much more. What would you like to work on?",
                    "metadata": {
                        "capabilities": [
                            "Task management",
                            "Project tracking",
                            "Calendar scheduling",
                            "Routine coaching",
                            "Voice commands",
                            "Analytics and insights",
                        ],
                        "suggestions": [
                            "Ask about your tasks",
                            "Check project status",
                            "Review your schedule",
                            "Get routine coaching",
                        ],
                    },
                },
                "clarification": {
                    "response": "I want to make sure I understand correctly. Are you asking about {clarification_topic}? I can help with that specifically.",
                    "metadata": {"clarification_needed": True, "possible_intents": [], "suggested_rephrasing": []},
                },
            },
        }

    def generate_chat_response(
        self, workflow_type: WorkflowType, user_message: str, context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate enhanced chat response based on workflow type and context"""

        # Determine specific action within workflow
        action = self._detect_action(workflow_type, user_message)

        # Get appropriate template
        templates = self.response_templates.get(workflow_type, {})
        template = templates.get(action, templates.get("general", {}))

        # Generate response based on workflow type
        if workflow_type == WorkflowType.TASK_MANAGEMENT:
            return self._generate_task_response(action, user_message, template, context)
        elif workflow_type == WorkflowType.PROJECT_CHATBOT:
            return self._generate_project_response(action, user_message, template, context)
        elif workflow_type == WorkflowType.CALENDAR_INTELLIGENCE:
            return self._generate_calendar_response(action, user_message, template, context)
        elif workflow_type == WorkflowType.VOICE_PROCESSING:
            return self._generate_voice_response(action, user_message, template, context)
        elif workflow_type == WorkflowType.ROUTINE_COACHING:
            return self._generate_routine_response(action, user_message, template, context)
        elif workflow_type == WorkflowType.NEWS_INTELLIGENCE:
            return self._generate_news_response(action, user_message, template, context)
        else:
            return self._generate_general_response(action, user_message, template, context)

    def _detect_action(self, workflow_type: WorkflowType, message: str) -> str:
        """Detect specific action within workflow based on message content"""
        message_lower = message.lower()

        if workflow_type == WorkflowType.TASK_MANAGEMENT:
            if any(word in message_lower for word in ["create", "add", "new"]):
                return "create_task"
            elif any(word in message_lower for word in ["list", "show", "my tasks"]):
                return "list_tasks"
            elif any(word in message_lower for word in ["update", "complete", "finish"]):
                return "update_task"

        elif workflow_type == WorkflowType.PROJECT_CHATBOT:
            if any(word in message_lower for word in ["status", "progress", "how is"]):
                return "project_status"
            elif any(word in message_lower for word in ["insights", "analysis", "health"]):
                return "project_insights"

        elif workflow_type == WorkflowType.CALENDAR_INTELLIGENCE:
            if any(word in message_lower for word in ["schedule", "meeting", "appointment"]):
                return "schedule_meeting"
            elif any(word in message_lower for word in ["free", "available", "availability"]):
                return "availability_check"
            elif any(word in message_lower for word in ["today", "schedule", "agenda"]):
                return "daily_schedule"

        elif workflow_type == WorkflowType.VOICE_PROCESSING:
            if "note" in message_lower:
                return "voice_note"
            else:
                return "voice_command"

        elif workflow_type == WorkflowType.ROUTINE_COACHING:
            if any(word in message_lower for word in ["analysis", "how am i", "progress"]):
                return "routine_analysis"
            else:
                return "habit_coaching"

        return "general"

    def _generate_task_response(
        self, action: str, message: str, template: Dict[str, Any], context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate task management response"""

        if action == "create_task":
            # Extract task details from message
            task_title = self._extract_task_title(message)
            priority = self._extract_priority(message)
            due_date = self._extract_due_date(message)

            # Create mock task
            new_task = {
                "id": str(uuid.uuid4()),
                "title": task_title,
                "priority": priority,
                "due_date": due_date,
                "status": "todo",
                "created_at": datetime.utcnow(),
            }

            response = template["response"].format(
                task_title=task_title, priority=priority, due_date=due_date or "no specific date"
            )

            metadata = template["metadata"].copy()
            metadata["task_id"] = new_task["id"]
            metadata["task_data"] = new_task

        elif action == "list_tasks":
            # Get mock tasks
            tasks = self.data_generator.tasks[:10]  # Limit to 10 for display

            task_list = "\n".join([f"• {task['title']} ({task['priority']} priority) - {task['status']}" for task in tasks])

            summary = {
                "total": len(tasks),
                "completed": len([t for t in tasks if t["status"] == "completed"]),
                "in_progress": len([t for t in tasks if t["status"] == "in_progress"]),
                "high_priority": len([t for t in tasks if t["priority"] == "high"]),
            }

            response = template["response"].format(
                task_list=task_list, total_tasks=summary["total"], high_priority=summary["high_priority"]
            )

            metadata = template["metadata"].copy()
            metadata["tasks"] = tasks
            metadata["summary"] = summary

        else:  # update_task
            task_title = "Sample Task"
            new_status = "completed"

            response = template["response"].format(task_title=task_title, new_status=new_status)

            metadata = template["metadata"].copy()
            metadata["changes"] = {"status": new_status}

        return {
            "response": response,
            "message_type": MessageType.TEXT,
            "workflow_type": WorkflowType.TASK_MANAGEMENT,
            "metadata": metadata,
            "execution_id": str(uuid.uuid4()),
            "processing_time": random.uniform(0.5, 2.0),
        }

    def _generate_project_response(
        self, action: str, message: str, template: Dict[str, Any], context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate project management response"""

        # Get sample project
        project = random.choice(self.data_generator.projects)

        if action == "project_status":
            focus_areas = ["Frontend optimization", "API documentation", "Testing coverage"]

            response = template["response"].format(
                project_name=project["name"],
                status=project["status"],
                health_score=project["health_score"],
                progress=project["progress"],
                focus_areas=", ".join(focus_areas),
            )

            metadata = template["metadata"].copy()
            metadata["project_data"] = project
            metadata["health_analysis"] = {
                "score": project["health_score"],
                "factors": ["code_quality", "team_velocity", "deadline_adherence"],
                "trends": "improving",
            }

        else:  # project_insights
            velocity = "25% above average"
            risk_level = "Low"
            actions = ["Focus on testing", "Update documentation"]

            response = template["response"].format(
                project_name=project["name"], velocity=velocity, risk_level=risk_level, actions=", ".join(actions)
            )

            metadata = template["metadata"].copy()
            metadata["insights"] = {"velocity": velocity, "risk_assessment": risk_level, "team_performance": "high"}
            metadata["action_items"] = actions

        return {
            "response": response,
            "message_type": MessageType.TEXT,
            "workflow_type": WorkflowType.PROJECT_CHATBOT,
            "metadata": metadata,
            "execution_id": str(uuid.uuid4()),
            "processing_time": random.uniform(0.8, 2.5),
        }

    def _generate_calendar_response(
        self, action: str, message: str, template: Dict[str, Any], context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate calendar management response"""

        if action == "schedule_meeting":
            meeting_title = self._extract_meeting_title(message)
            date_time = self._extract_datetime(message)

            response = template["response"].format(meeting_title=meeting_title, date_time=date_time)

            metadata = template["metadata"].copy()
            metadata["event_id"] = str(uuid.uuid4())
            metadata["participants"] = ["user@example.com", "team@example.com"]

        elif action == "availability_check":
            date_range = "this week"
            time_slots = "• 9:00-10:00 AM (Available)\n• 2:00-3:00 PM (Available)\n• 4:00-5:00 PM (Available)"

            response = template["response"].format(date_range=date_range, time_slots=time_slots)

            metadata = template["metadata"].copy()
            metadata["available_slots"] = [
                {"start": "09:00", "end": "10:00", "date": "today"},
                {"start": "14:00", "end": "15:00", "date": "today"},
            ]

        else:  # daily_schedule
            schedule_items = "• 9:00 AM - Team Standup\n• 11:00 AM - Project Review\n• 2:00 PM - Client Call"
            free_time = "3 hours"

            response = template["response"].format(schedule_items=schedule_items, free_time=free_time)

            metadata = template["metadata"].copy()
            metadata["events"] = [
                {"title": "Team Standup", "time": "09:00", "duration": "30min"},
                {"title": "Project Review", "time": "11:00", "duration": "60min"},
            ]

        return {
            "response": response,
            "message_type": MessageType.TEXT,
            "workflow_type": WorkflowType.CALENDAR_INTELLIGENCE,
            "metadata": metadata,
            "execution_id": str(uuid.uuid4()),
            "processing_time": random.uniform(0.6, 1.8),
        }

    def _generate_voice_response(
        self, action: str, message: str, template: Dict[str, Any], context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate voice processing response"""

        transcription = message  # Simulate transcription

        if action == "voice_note":
            response = template["response"].format(note_content=transcription)

            metadata = template["metadata"].copy()
            metadata["transcription"] = transcription
            metadata["audio_file"] = f"voice_note_{uuid.uuid4().hex[:8]}.wav"

        else:  # voice_command
            action_taken = "created a new task"

            response = template["response"].format(transcription=transcription, action_taken=action_taken)

            metadata = template["metadata"].copy()
            metadata["transcription"] = transcription
            metadata["action_performed"] = action_taken

        return {
            "response": response,
            "message_type": MessageType.TEXT,
            "workflow_type": WorkflowType.VOICE_PROCESSING,
            "metadata": metadata,
            "execution_id": str(uuid.uuid4()),
            "processing_time": random.uniform(1.0, 3.0),
        }

    def _generate_routine_response(
        self, action: str, message: str, template: Dict[str, Any], context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate routine coaching response"""

        if action == "routine_analysis":
            completion_rate = random.randint(70, 95)
            best_habit = "Morning Exercise"
            improvement_area = "Evening Reading"
            coaching_advice = "Try setting a specific time for reading to build consistency"

            response = template["response"].format(
                completion_rate=completion_rate,
                best_habit=best_habit,
                improvement_area=improvement_area,
                coaching_advice=coaching_advice,
            )

            metadata = template["metadata"].copy()
            metadata["routine_data"] = {
                "completion_rate": completion_rate,
                "habits_tracked": 5,
                "streaks": {"exercise": 12, "meditation": 8},
            }

        else:  # habit_coaching
            suggestions = "Start with a 5-minute version of your target habit to build momentum"
            habit_name = "meditation"
            streak_days = random.randint(1, 30)

            response = template["response"].format(suggestions=suggestions, habit_name=habit_name, streak_days=streak_days)

            metadata = template["metadata"].copy()
            metadata["habit_insights"] = {"habit": habit_name, "streak": streak_days, "difficulty": "medium"}

        return {
            "response": response,
            "message_type": MessageType.TEXT,
            "workflow_type": WorkflowType.ROUTINE_COACHING,
            "metadata": metadata,
            "execution_id": str(uuid.uuid4()),
            "processing_time": random.uniform(0.7, 2.2),
        }

    def _generate_news_response(
        self, action: str, message: str, template: Dict[str, Any], context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate news intelligence response"""

        news_items = [
            "• Tech: AI advances in productivity tools",
            "• Business: Remote work trends continue to evolve",
            "• Science: New study on habit formation",
        ]
        themes = ["AI development", "Remote work", "Productivity"]
        relevant_count = 3

        response = template["response"].format(
            news_items="\n".join(news_items), themes=", ".join(themes), relevant_count=relevant_count
        )

        metadata = template["metadata"].copy()
        metadata["articles"] = [
            {"title": "AI in Productivity", "source": "TechNews", "relevance": 0.9},
            {"title": "Remote Work Trends", "source": "BusinessDaily", "relevance": 0.7},
        ]

        return {
            "response": response,
            "message_type": MessageType.TEXT,
            "workflow_type": WorkflowType.NEWS_INTELLIGENCE,
            "metadata": metadata,
            "execution_id": str(uuid.uuid4()),
            "processing_time": random.uniform(1.2, 3.5),
        }

    def _generate_general_response(
        self, action: str, message: str, template: Dict[str, Any], context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate general assistant response"""

        if action == "clarification":
            clarification_topic = "task management or project status"

            response = template["response"].format(clarification_topic=clarification_topic)

            metadata = template["metadata"].copy()
            metadata["possible_intents"] = ["task_management", "project_status", "calendar"]

        else:  # general_help
            response = template["response"]
            metadata = template["metadata"].copy()

        return {
            "response": response,
            "message_type": MessageType.TEXT,
            "workflow_type": WorkflowType.MASTER_BRAIN,
            "metadata": metadata,
            "execution_id": str(uuid.uuid4()),
            "processing_time": random.uniform(0.3, 1.0),
        }

    # Helper methods for extracting information from messages
    def _extract_task_title(self, message: str) -> str:
        """Extract task title from message"""
        # Simple extraction - in real implementation, use NLP
        if "create" in message.lower():
            parts = message.lower().split("create")
            if len(parts) > 1:
                title = parts[1].strip().replace("task", "").replace("a", "").strip()
                return title.capitalize() if title else "New Task"
        return "New Task from Voice Command"

    def _extract_priority(self, message: str) -> str:
        """Extract priority from message"""
        message_lower = message.lower()
        if any(word in message_lower for word in ["urgent", "high", "important"]):
            return "high"
        elif any(word in message_lower for word in ["low", "minor", "later"]):
            return "low"
        return "medium"

    def _extract_due_date(self, message: str) -> Optional[str]:
        """Extract due date from message"""
        message_lower = message.lower()
        if "today" in message_lower:
            return "today"
        elif "tomorrow" in message_lower:
            return "tomorrow"
        elif "week" in message_lower:
            return "next week"
        return None

    def _extract_meeting_title(self, message: str) -> str:
        """Extract meeting title from message"""
        return "Team Meeting"  # Simplified for mock

    def _extract_datetime(self, message: str) -> str:
        """Extract datetime from message"""
        return "tomorrow at 2:00 PM"  # Simplified for mock

    def get_project_data(self) -> List[Dict[str, Any]]:
        """Get mock project data"""
        return self.data_generator.projects

    def get_task_data(self, status: Optional[str] = None, priority: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get filtered mock task data"""
        tasks = self.data_generator.tasks

        if status:
            tasks = [t for t in tasks if t["status"] == status]

        if priority:
            tasks = [t for t in tasks if t["priority"] == priority]

        return tasks

    def get_user_data(self) -> Dict[str, Any]:
        """Get mock user data"""
        return self.data_generator.users

    def get_conversation_data(self) -> List[Dict[str, Any]]:
        """Get mock conversation data"""
        return self.data_generator.conversations

    def generate_voice_response(
        self, audio_data: str, format: str = "webm", context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate mock voice processing response"""

        # Simulate voice transcription
        sample_transcriptions = [
            "Create a task for tomorrow",
            "Show me my project status",
            "Schedule a meeting with the team",
            "What are my high priority tasks",
            "Add workout to my routine",
            "Open the calendar view",
            "Generate a daily briefing",
        ]

        transcription = random.choice(sample_transcriptions)
        confidence = random.uniform(0.85, 0.98)

        # Determine intent from transcription
        intent = self._detect_voice_intent(transcription)

        return {
            "transcription": transcription,
            "confidence": confidence,
            "intent": intent,
            "audioFile": f"voice_note_{uuid.uuid4().hex[:8]}.wav",
            "processingTime": random.uniform(1.0, 3.0),
            "command": {"action": intent, "parameters": self._extract_voice_parameters(transcription, intent)},
            "metadata": {"format": format, "duration": random.uniform(1.0, 5.0), "quality": "high", "language": "en-US"},
        }

    def _detect_voice_intent(self, transcription: str) -> str:
        """Detect intent from voice transcription"""
        text_lower = transcription.lower()

        if any(word in text_lower for word in ["create", "add", "new"]):
            if "task" in text_lower:
                return "create_task"
            elif "meeting" in text_lower or "schedule" in text_lower:
                return "schedule_meeting"
            elif "routine" in text_lower:
                return "add_routine"
        elif any(word in text_lower for word in ["show", "display", "what"]):
            if "project" in text_lower:
                return "show_projects"
            elif "task" in text_lower:
                return "show_tasks"
            elif "calendar" in text_lower:
                return "show_calendar"
        elif any(word in text_lower for word in ["open", "go to", "navigate"]):
            return "navigate"
        elif "briefing" in text_lower:
            return "generate_briefing"

        return "general_query"

    def _extract_voice_parameters(self, transcription: str, intent: str) -> Dict[str, Any]:
        """Extract parameters from voice transcription"""
        params = {}
        text_lower = transcription.lower()

        if intent == "create_task":
            # Extract task title
            if "create" in text_lower:
                title_start = text_lower.find("create") + 6
                title = transcription[title_start:].strip()
                params["title"] = title or "Voice Task"

            # Extract due date
            if "tomorrow" in text_lower:
                params["dueDate"] = (datetime.utcnow() + timedelta(days=1)).isoformat()
            elif "today" in text_lower:
                params["dueDate"] = datetime.utcnow().isoformat()

            # Extract priority
            if any(word in text_lower for word in ["urgent", "important", "high"]):
                params["priority"] = "high"
            elif "low" in text_lower:
                params["priority"] = "low"
            else:
                params["priority"] = "medium"

        elif intent == "schedule_meeting":
            params["title"] = "Team Meeting"
            params["duration"] = "60"
            if "tomorrow" in text_lower:
                params["date"] = (datetime.utcnow() + timedelta(days=1)).isoformat()

        return params

    def generate_mobile_config(self) -> Dict[str, Any]:
        """Generate mobile-specific configuration"""
        return {
            "config": {
                "touchTargetSize": 44,
                "gesturesEnabled": True,
                "hapticFeedback": True,
                "voiceInputEnabled": True,
                "offlineMode": False,
                "animations": {"enabled": True, "duration": 200, "easing": "ease-out"},
                "breakpoints": {"mobile": 768, "tablet": 1024, "desktop": 1200},
                "navigation": {"bottomNavHeight": 64, "drawerWidth": 280, "swipeThreshold": 50},
            }
        }

    def generate_haptic_response(self, event_type: str) -> Dict[str, Any]:
        """Generate haptic feedback response"""
        haptic_patterns = {
            "tap": {"pattern": "light", "duration": 10},
            "success": {"pattern": "medium", "duration": 30},
            "error": {"pattern": "heavy", "duration": 50},
            "notification": {"pattern": "light", "duration": 20},
            "swipe": {"pattern": "light", "duration": 15},
        }

        pattern = haptic_patterns.get(event_type, haptic_patterns["tap"])

        return {
            "triggered": True,
            "eventType": event_type,
            "pattern": pattern["pattern"],
            "duration": pattern["duration"],
            "timestamp": datetime.utcnow().isoformat(),
        }

    def generate_performance_metrics(self) -> Dict[str, Any]:
        """Generate mobile performance metrics"""
        return {
            "performance": {
                "loadTime": random.uniform(0.8, 1.5),
                "renderTime": random.uniform(0.1, 0.3),
                "memoryUsage": random.uniform(50, 120),
                "batteryImpact": random.uniform(0.1, 0.5),
                "networkRequests": random.randint(3, 8),
                "cacheHitRate": random.uniform(0.7, 0.95),
            },
            "vitals": {
                "FCP": random.uniform(0.8, 1.2),  # First Contentful Paint
                "LCP": random.uniform(1.2, 2.5),  # Largest Contentful Paint
                "FID": random.uniform(10, 50),  # First Input Delay
                "CLS": random.uniform(0.05, 0.1),  # Cumulative Layout Shift
            },
            "optimizations": [
                "Image compression active",
                "Code splitting enabled",
                "Service worker caching",
                "Hardware acceleration",
            ],
        }

    def generate_analytics_data(self, days: int = 7) -> Dict[str, Any]:
        """Generate analytics and usage data"""

        # Generate daily data points
        daily_data = []
        for i in range(days):
            date = datetime.utcnow() - timedelta(days=i)
            daily_data.append(
                {
                    "date": date.isoformat()[:10],
                    "messages": random.randint(5, 25),
                    "tasks_created": random.randint(0, 5),
                    "tasks_completed": random.randint(0, 8),
                    "voice_commands": random.randint(0, 10),
                    "session_duration": random.randint(300, 3600),  # seconds
                }
            )

        return {
            "analytics": {
                "period": f"{days} days",
                "dailyData": daily_data,
                "totals": {
                    "totalMessages": sum(d["messages"] for d in daily_data),
                    "totalTasks": sum(d["tasks_created"] for d in daily_data),
                    "totalCompletions": sum(d["tasks_completed"] for d in daily_data),
                    "totalVoiceCommands": sum(d["voice_commands"] for d in daily_data),
                    "avgSessionDuration": sum(d["session_duration"] for d in daily_data) / len(daily_data),
                },
                "insights": {
                    "mostActiveDay": max(daily_data, key=lambda x: x["messages"])["date"],
                    "productivityTrend": "increasing",
                    "voiceUsageGrowth": "+15%",
                    "taskCompletionRate": "78%",
                },
            }
        }

    def generate_intelligent_suggestions(self, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate AI-powered suggestions based on usage patterns"""

        suggestions = [
            {
                "type": "productivity",
                "title": "Optimize Your Morning Routine",
                "description": "Based on your patterns, try scheduling important tasks between 9-11 AM",
                "priority": "medium",
                "action": "Schedule focused work blocks",
                "confidence": 0.82,
            },
            {
                "type": "task_management",
                "title": "Break Down Large Tasks",
                "description": "Tasks over 8 hours could be broken into smaller, manageable pieces",
                "priority": "high",
                "action": "Review and split large tasks",
                "confidence": 0.91,
            },
            {
                "type": "voice_usage",
                "title": "Voice Commands for Efficiency",
                "description": "You could save time using voice commands for routine task creation",
                "priority": "low",
                "action": "Try voice task creation",
                "confidence": 0.67,
            },
        ]

        # Filter by context if provided
        if context and "page" in context:
            page = context["page"]
            if page == "tasks":
                suggestions = [s for s in suggestions if s["type"] in ["task_management", "productivity"]]
            elif page == "dashboard":
                suggestions = [s for s in suggestions if s["priority"] in ["high", "medium"]]

        return {
            "suggestions": suggestions[:3],  # Limit to top 3
            "generated_at": datetime.utcnow().isoformat(),
            "context": context or {},
            "total_available": len(suggestions),
        }


# Global instance for use in services
enhanced_mock_responses = EnhancedMockResponses()
