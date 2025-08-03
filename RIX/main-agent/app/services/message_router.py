"""
Intelligent message routing system for RIX Main Agent
Analyzes message content to determine appropriate N8N workflow
"""

import re
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

from app.core.logging import get_logger
from app.models.chat import WorkflowType, ContentAnalysisResult

logger = get_logger(__name__)

# Download required NLTK data (run once)
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('wordnet')


class MessageRouter:
    """Intelligent message routing system"""
    
    def __init__(self):
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        
        # Define workflow patterns and keywords
        self.workflow_patterns = {
            WorkflowType.VOICE_PROCESSING: {
                "keywords": [
                    "audio", "voice", "speech", "recording", "transcribe", "listen",
                    "sound", "microphone", "speak", "pronunciation", "accent"
                ],
                "patterns": [
                    r".*\b(voice|audio|speech|recording)\b.*",
                    r".*\b(transcribe|dictate)\b.*",
                    r".*\b(listen to|hear)\b.*"
                ],
                "priority": 0.9  # High priority for voice-specific content
            },
            
            WorkflowType.NEWS_INTELLIGENCE: {
                "keywords": [
                    "news", "article", "headline", "breaking", "report", "journalist",
                    "media", "press", "current", "events", "update", "story", "market",
                    "stock", "finance", "economy", "politics", "world", "today"
                ],
                "patterns": [
                    r".*\b(news|breaking|headline)\b.*",
                    r".*\b(what.*happen|latest|current.*event)\b.*",
                    r".*\b(market|stock|finance|economy)\b.*",
                    r".*\b(today.*news|news.*today)\b.*"
                ],
                "priority": 0.8
            },
            
            WorkflowType.CALENDAR_INTELLIGENCE: {
                "keywords": [
                    "calendar", "schedule", "appointment", "meeting", "event", "time",
                    "date", "remind", "plan", "book", "availability", "free", "busy",
                    "today", "tomorrow", "next week", "deadline", "due"
                ],
                "patterns": [
                    r".*\b(schedule|calendar|appointment)\b.*",
                    r".*\b(meeting|event)\b.*",
                    r".*\b(remind|reminder)\b.*",
                    r".*\b(when.*free|availability)\b.*",
                    r".*\b(today|tomorrow|next.*week|this.*week)\b.*"
                ],
                "priority": 0.85
            },
            
            WorkflowType.TASK_MANAGEMENT: {
                "keywords": [
                    "task", "todo", "complete", "finish", "done", "assign", "project",
                    "deadline", "priority", "urgent", "work", "job", "activity",
                    "checklist", "progress", "status", "follow up"
                ],
                "patterns": [
                    r".*\b(task|todo|to.*do)\b.*",
                    r".*\b(complete|finish|done)\b.*",
                    r".*\b(assign|project)\b.*",
                    r".*\b(deadline|priority|urgent)\b.*",
                    r".*\b(checklist|progress)\b.*"
                ],
                "priority": 0.8
            },
            
            WorkflowType.PROJECT_CHATBOT: {
                "keywords": [
                    "project", "development", "code", "programming", "software",
                    "feature", "bug", "issue", "repository", "git", "deploy",
                    "database", "api", "frontend", "backend", "architecture"
                ],
                "patterns": [
                    r".*\b(project|development)\b.*",
                    r".*\b(code|programming|software)\b.*",
                    r".*\b(feature|bug|issue)\b.*",
                    r".*\b(repository|git|deploy)\b.*",
                    r".*\b(database|api|frontend|backend)\b.*"
                ],
                "priority": 0.75
            },
            
            WorkflowType.MORNING_BRIEF: {
                "keywords": [
                    "brief", "summary", "overview", "daily", "morning", "today",
                    "update", "report", "digest", "recap", "status", "agenda"
                ],
                "patterns": [
                    r".*\b(brief|summary|overview)\b.*",
                    r".*\b(daily|morning)\b.*",
                    r".*\b(today.*agenda|agenda.*today)\b.*",
                    r".*\b(update|report|digest)\b.*"
                ],
                "priority": 0.7
            },
            
            WorkflowType.NOTIFICATION_MANAGEMENT: {
                "keywords": [
                    "notify", "notification", "alert", "reminder", "warning",
                    "inform", "message", "email", "sms", "push", "bell"
                ],
                "patterns": [
                    r".*\b(notify|notification|alert)\b.*",
                    r".*\b(reminder|warning)\b.*",
                    r".*\b(inform|message)\b.*",
                    r".*\b(email|sms|push)\b.*"
                ],
                "priority": 0.6
            },
            
            WorkflowType.ANALYTICS_LEARNING: {
                "keywords": [
                    "analyze", "analytics", "data", "metrics", "statistics", "report",
                    "insights", "trends", "performance", "learn", "pattern",
                    "behavior", "optimization", "improvement"
                ],
                "patterns": [
                    r".*\b(analyz|analytics|data|metrics)\b.*",
                    r".*\b(statistics|report|insights)\b.*",
                    r".*\b(trends|performance)\b.*",
                    r".*\b(learn|pattern|behavior)\b.*"
                ],
                "priority": 0.65
            },
            
            # Phase 5 Intelligence Features
            WorkflowType.ROUTINE_COACHING: {
                "keywords": [
                    "routine", "habit", "coaching", "optimize", "improve", "streak",
                    "consistency", "advice", "suggestion", "coach", "better", "enhance",
                    "morning routine", "evening routine", "daily routine", "habit tracker",
                    "routine help", "habit advice", "streak broken", "routine struggle"
                ],
                "patterns": [
                    r".*\b(routine|habit).*\b(coach|advice|help|improve|optimize)\b.*",
                    r".*\b(how.*better|improve.*routine|optimize.*habit)\b.*",
                    r".*\b(routine.*struggling|habit.*difficult)\b.*",
                    r".*\b(streak|consistency).*\b(help|advice)\b.*",
                    r".*\b(morning|evening).*routine.*\b(better|improve)\b.*"
                ],
                "priority": 0.85  # High priority for routine coaching
            },
            
            WorkflowType.PROJECT_INTELLIGENCE: {
                "keywords": [
                    "project", "health score", "analyze", "insight", "assessment", "intelligence",
                    "project status", "project health", "project analysis", "project insight",
                    "project review", "project assessment", "health check", "project metrics",
                    "progress analysis", "project intelligence", "ai score", "project ai"
                ],
                "patterns": [
                    r".*\b(project).*\b(health|score|analysis|insight|intelligence)\b.*",
                    r".*\b(analyze|assess).*\b(project|progress)\b.*",
                    r".*\b(health.*score|ai.*score)\b.*",
                    r".*\b(project.*status|project.*review)\b.*",
                    r".*\b(project.*metrics|project.*insight)\b.*"
                ],
                "priority": 0.82  # High priority for project intelligence
            },
            
            WorkflowType.CALENDAR_OPTIMIZATION: {
                "keywords": [
                    "calendar", "schedule", "optimize", "time block", "time management",
                    "scheduling", "calendar optimization", "schedule optimization", "time optimization",
                    "productive schedule", "schedule advice", "calendar advice", "time blocking",
                    "schedule better", "optimize time", "calendar intelligence", "smart scheduling"
                ],
                "patterns": [
                    r".*\b(calendar|schedule).*\b(optimize|better|improve|advice)\b.*",
                    r".*\b(time.*block|time.*management).*\b(optimize|improve)\b.*",
                    r".*\b(optimize.*schedule|improve.*calendar)\b.*",
                    r".*\b(productive.*schedule|efficient.*time)\b.*",
                    r".*\b(schedule.*advice|calendar.*help)\b.*"
                ],
                "priority": 0.83  # High priority for calendar optimization
            },
            
            # Master Brain as fallback for general queries
            WorkflowType.MASTER_BRAIN: {
                "keywords": [
                    "help", "question", "ask", "tell", "explain", "what", "how",
                    "why", "when", "where", "general", "chat", "conversation"
                ],
                "patterns": [
                    r".*\b(help|question|ask)\b.*",
                    r".*\b(tell|explain)\b.*",
                    r".*\b(what|how|why|when|where)\b.*",
                    r".*\b(general|chat)\b.*"
                ],
                "priority": 0.3  # Lower priority, acts as fallback
            }
        }
    
    async def analyze_content(self, message: str, context: Optional[Dict[str, Any]] = None) -> ContentAnalysisResult:
        """Analyze message content and recommend workflow"""
        logger.info("Analyzing message content", message_length=len(message))
        
        # Preprocess message
        processed_message = await self._preprocess_message(message)
        
        # Extract keywords and entities
        keywords = await self._extract_keywords(processed_message)
        entities = await self._extract_entities(message)
        
        # Calculate workflow scores
        workflow_scores = await self._calculate_workflow_scores(processed_message, keywords)
        
        # Apply context if available
        if context:
            workflow_scores = await self._apply_context(workflow_scores, context)
        
        # Select best workflow
        best_workflow, confidence = await self._select_best_workflow(workflow_scores)
        
        # Generate reasoning
        reasoning = await self._generate_reasoning(best_workflow, workflow_scores, keywords)
        
        result = ContentAnalysisResult(
            recommended_workflow=best_workflow,
            confidence=confidence,
            reasoning=reasoning,
            keywords=keywords,
            intent=await self._detect_intent(message),
            entities=entities
        )
        
        logger.info(
            "Content analysis completed",
            workflow=best_workflow.value,
            confidence=confidence,
            keywords_count=len(keywords)
        )
        
        return result
    
    async def _preprocess_message(self, message: str) -> str:
        """Preprocess message for analysis"""
        # Convert to lowercase
        processed = message.lower()
        
        # Remove special characters but keep spaces
        processed = re.sub(r'[^\w\s]', ' ', processed)
        
        # Remove extra whitespace
        processed = ' '.join(processed.split())
        
        return processed
    
    async def _extract_keywords(self, message: str) -> List[str]:
        """Extract meaningful keywords from message"""
        try:
            # Tokenize
            tokens = word_tokenize(message)
            
            # Remove stopwords and short words
            keywords = [
                self.lemmatizer.lemmatize(word)
                for word in tokens
                if word not in self.stop_words and len(word) > 2
            ]
            
            # Remove duplicates while preserving order
            unique_keywords = []
            seen = set()
            for keyword in keywords:
                if keyword not in seen:
                    unique_keywords.append(keyword)
                    seen.add(keyword)
            
            return unique_keywords[:20]  # Limit to top 20 keywords
            
        except Exception as e:
            logger.warning("Keyword extraction failed", error=str(e))
            return []
    
    async def _extract_entities(self, message: str) -> List[Dict[str, Any]]:
        """Extract entities from message (simplified implementation)"""
        entities = []
        
        # Extract dates
        date_patterns = [
            r'\b(today|tomorrow|yesterday)\b',
            r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
            r'\b(\d{1,2}/\d{1,2}/\d{4})\b',
            r'\b(\d{1,2}-\d{1,2}-\d{4})\b'
        ]
        
        for pattern in date_patterns:
            matches = re.finditer(pattern, message, re.IGNORECASE)
            for match in matches:
                entities.append({
                    "type": "date",
                    "value": match.group(),
                    "start": match.start(),
                    "end": match.end()
                })
        
        # Extract times
        time_patterns = [
            r'\b(\d{1,2}:\d{2}\s?(am|pm)?)\b',
            r'\b(\d{1,2}\s?(am|pm))\b'
        ]
        
        for pattern in time_patterns:
            matches = re.finditer(pattern, message, re.IGNORECASE)
            for match in matches:
                entities.append({
                    "type": "time",
                    "value": match.group(),
                    "start": match.start(),
                    "end": match.end()
                })
        
        return entities
    
    async def _calculate_workflow_scores(self, message: str, keywords: List[str]) -> Dict[WorkflowType, float]:
        """Calculate scores for each workflow based on message content"""
        scores = {}
        
        for workflow, config in self.workflow_patterns.items():
            score = 0.0
            
            # Keyword matching
            keyword_matches = 0
            for keyword in keywords:
                if keyword in config["keywords"]:
                    keyword_matches += 1
            
            if keywords:
                keyword_score = (keyword_matches / len(keywords)) * 0.6
            else:
                keyword_score = 0.0
            
            # Pattern matching
            pattern_score = 0.0
            for pattern in config["patterns"]:
                if re.search(pattern, message, re.IGNORECASE):
                    pattern_score += 0.4 / len(config["patterns"])
            
            # Calculate total score
            score = (keyword_score + pattern_score) * config["priority"]
            scores[workflow] = score
        
        return scores
    
    async def _apply_context(self, scores: Dict[WorkflowType, float], context: Dict[str, Any]) -> Dict[WorkflowType, float]:
        """Apply conversation context to workflow scores"""
        # Boost scores based on recent conversation history
        if "recent_workflows" in context:
            recent_workflows = context["recent_workflows"]
            for workflow in recent_workflows:
                if workflow in scores:
                    scores[workflow] *= 1.2  # 20% boost for recent workflows
        
        # Consider time of day
        if "time_of_day" in context:
            time_of_day = context["time_of_day"]
            if time_of_day == "morning":
                scores[WorkflowType.MORNING_BRIEF] *= 1.5
            elif time_of_day == "evening":
                scores[WorkflowType.ANALYTICS_LEARNING] *= 1.3
        
        return scores
    
    async def _select_best_workflow(self, scores: Dict[WorkflowType, float]) -> Tuple[WorkflowType, float]:
        """Select the best workflow based on scores"""
        if not scores:
            return WorkflowType.MASTER_BRAIN, 0.5
        
        # Sort by score
        sorted_workflows = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        best_workflow, best_score = sorted_workflows[0]
        
        # If no workflow has a significant score, use Master Brain
        if best_score < 0.3:
            return WorkflowType.MASTER_BRAIN, 0.5
        
        # Normalize confidence score
        confidence = min(best_score, 1.0)
        
        return best_workflow, confidence
    
    async def _generate_reasoning(self, workflow: WorkflowType, scores: Dict[WorkflowType, float], keywords: List[str]) -> str:
        """Generate human-readable reasoning for workflow selection"""
        reasoning_parts = []
        
        # Main selection reason
        score = scores.get(workflow, 0.0)
        if score > 0.7:
            reasoning_parts.append(f"High confidence match for {workflow.value}")
        elif score > 0.5:
            reasoning_parts.append(f"Good match for {workflow.value}")
        else:
            reasoning_parts.append(f"Default selection: {workflow.value}")
        
        # Keywords contribution
        if keywords:
            top_keywords = keywords[:3]
            reasoning_parts.append(f"Key terms: {', '.join(top_keywords)}")
        
        # Alternative workflows
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        if len(sorted_scores) > 1 and sorted_scores[1][1] > 0.3:
            alt_workflow = sorted_scores[1][0]
            reasoning_parts.append(f"Alternative: {alt_workflow.value}")
        
        return ". ".join(reasoning_parts)
    
    async def _detect_intent(self, message: str) -> Optional[str]:
        """Detect user intent from message"""
        intent_patterns = {
            "question": [r".*\b(what|how|why|when|where|which|who)\b.*\?"],
            "request": [r".*\b(please|can you|could you|would you)\b.*"],
            "command": [r".*\b(create|make|build|generate|show|list)\b.*"],
            "information": [r".*\b(tell me|explain|describe|info)\b.*"],
            "help": [r".*\b(help|assist|support)\b.*"]
        }
        
        message_lower = message.lower()
        for intent, patterns in intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    return intent
        
        return None


# Global router instance
message_router = MessageRouter()