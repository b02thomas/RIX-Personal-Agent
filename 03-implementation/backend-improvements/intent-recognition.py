# /03-implementation/backend-improvements/intent-recognition.py
# Advanced pattern matching for natural language processing in RIX Main Agent
# Improves upon existing message_router.py with enhanced NLP capabilities
# RELEVANT FILES: app/services/message_router.py, app/models/chat.py, app/api/endpoints/chat.py

import re
import asyncio
from typing import List, Dict, Any, Optional, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import json

try:
    import nltk
    from nltk.tokenize import word_tokenize, sent_tokenize
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    from nltk.tag import pos_tag
    from nltk.chunk import ne_chunk
    from nltk.tree import Tree
except ImportError:
    print("NLTK not available - using fallback tokenization")
    nltk = None

from app.models.chat import WorkflowType
from app.core.logging import get_logger

logger = get_logger(__name__)


class IntentType(str, Enum):
    """Enhanced intent classification"""
    # Action intents
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    SCHEDULE = "schedule"
    ANALYZE = "analyze"
    
    # Information intents
    QUESTION = "question"
    REQUEST = "request"
    COMMAND = "command"
    SEARCH = "search"
    HELP = "help"
    
    # Emotional intents
    FRUSTRATION = "frustration"
    CELEBRATION = "celebration"
    CONCERN = "concern"
    
    # Workflow-specific intents
    TASK_INTENT = "task_management"
    PROJECT_INTENT = "project_management"
    CALENDAR_INTENT = "calendar_management"
    ROUTINE_INTENT = "routine_management"
    VOICE_INTENT = "voice_processing"


class EntityType(str, Enum):
    """Entity classification types"""
    DATE = "date"
    TIME = "time"
    DURATION = "duration"
    PERSON = "person"
    PROJECT = "project"
    TASK = "task"
    PRIORITY = "priority"
    STATUS = "status"
    LOCATION = "location"
    QUANTITY = "quantity"


@dataclass
class Entity:
    """Extracted entity with metadata"""
    text: str
    entity_type: EntityType
    start_pos: int
    end_pos: int
    confidence: float
    normalized_value: Optional[Any] = None
    context: Optional[Dict[str, Any]] = None


@dataclass
class IntentAnalysisResult:
    """Complete intent analysis result"""
    primary_intent: IntentType
    secondary_intents: List[IntentType]
    confidence: float
    entities: List[Entity]
    sentiment: str  # positive, negative, neutral
    urgency: str    # high, medium, low
    complexity: str # simple, moderate, complex
    context_requirements: List[str]
    suggested_clarifications: List[str]


class EnhancedIntentRecognizer:
    """Advanced intent recognition with enhanced NLP capabilities"""
    
    def __init__(self):
        self.lemmatizer = WordNetLemmatizer() if nltk else None
        self.stop_words = set(stopwords.words('english')) if nltk else set()
        
        # Enhanced pattern definitions
        self.intent_patterns = self._initialize_intent_patterns()
        self.entity_patterns = self._initialize_entity_patterns()
        self.workflow_mappings = self._initialize_workflow_mappings()
        self.context_patterns = self._initialize_context_patterns()
        
        # Emotional indicators
        self.sentiment_indicators = self._initialize_sentiment_indicators()
        
        # Priority and urgency indicators
        self.urgency_indicators = self._initialize_urgency_indicators()
    
    def _initialize_intent_patterns(self) -> Dict[IntentType, Dict[str, Any]]:
        """Initialize comprehensive intent patterns"""
        return {
            IntentType.CREATE: {
                "keywords": [
                    "create", "add", "new", "make", "build", "generate", "start",
                    "setup", "establish", "form", "construct", "design", "develop"
                ],
                "patterns": [
                    r"\b(create|add|new|make)\s+(?:a\s+)?(?:new\s+)?(task|project|meeting|event|note|reminder)",
                    r"\b(i\s+need\s+to|let's|can\s+you)\s+(create|add|make)",
                    r"\b(setup|establish|start)\s+(?:a\s+)?(new|project|task)",
                    r"\bgenerate\s+(?:a\s+)?(report|summary|briefing)"
                ],
                "priority": 0.9
            },
            
            IntentType.READ: {
                "keywords": [
                    "show", "list", "display", "view", "see", "check", "look",
                    "what", "get", "fetch", "find", "search", "browse"
                ],
                "patterns": [
                    r"\b(show|list|display)\s+(?:me\s+)?(?:my\s+)?(tasks|projects|schedule|calendar)",
                    r"\bwhat\s+(?:are\s+)?(?:my\s+)?(tasks|projects|meetings|schedule)",
                    r"\b(check|look\s+at)\s+(?:my\s+)?(progress|status|calendar)",
                    r"\bfind\s+(?:me\s+)?(?:all\s+)?(tasks|projects|meetings)"
                ],
                "priority": 0.8
            },
            
            IntentType.UPDATE: {
                "keywords": [
                    "update", "change", "modify", "edit", "complete", "finish",
                    "mark", "set", "move", "reschedule", "reassign"
                ],
                "patterns": [
                    r"\b(update|change|modify)\s+(?:the\s+)?(task|project|meeting)",
                    r"\b(complete|finish|mark\s+as\s+done)\s+(?:the\s+)?(task|project)",
                    r"\b(set|change)\s+(?:the\s+)?(priority|status|deadline)",
                    r"\b(reschedule|move)\s+(?:the\s+)?(meeting|appointment|event)"
                ],
                "priority": 0.85
            },
            
            IntentType.DELETE: {
                "keywords": [
                    "delete", "remove", "cancel", "drop", "eliminate", "clear",
                    "archive", "dismiss", "discard"
                ],
                "patterns": [
                    r"\b(delete|remove|cancel)\s+(?:the\s+)?(task|project|meeting|event)",
                    r"\b(clear|archive)\s+(?:all\s+)?(completed|old|finished)",
                    r"\bdismiss\s+(?:the\s+)?(notification|reminder|alert)"
                ],
                "priority": 0.8
            },
            
            IntentType.SCHEDULE: {
                "keywords": [
                    "schedule", "book", "plan", "arrange", "set", "organize",
                    "appointment", "meeting", "event", "calendar", "time"
                ],
                "patterns": [
                    r"\b(schedule|book|arrange)\s+(?:a\s+)?(meeting|appointment|call)",
                    r"\bplan\s+(?:a\s+)?(session|meeting|review|call)",
                    r"\bset\s+(?:up\s+)?(?:a\s+)?(meeting|appointment|reminder)",
                    r"\bwhen\s+(?:is|are)\s+(?:my\s+)?(meeting|appointment|free\s+time)"
                ],
                "priority": 0.9
            },
            
            IntentType.ANALYZE: {
                "keywords": [
                    "analyze", "review", "assess", "evaluate", "report",
                    "summarize", "insights", "metrics", "statistics", "performance"
                ],
                "patterns": [
                    r"\b(analyze|review|assess)\s+(?:my\s+)?(progress|performance|productivity)",
                    r"\bgenerate\s+(?:a\s+)?(report|summary|analysis)",
                    r"\bshow\s+(?:me\s+)?(?:my\s+)?(insights|metrics|statistics|analytics)",
                    r"\bhow\s+(?:am\s+i|is\s+my)\s+(doing|performing|progressing)"
                ],
                "priority": 0.8
            },
            
            IntentType.QUESTION: {
                "keywords": [
                    "what", "how", "when", "where", "why", "which", "who",
                    "can", "could", "would", "should", "is", "are", "do"
                ],
                "patterns": [
                    r"\b(what|how|when|where|why|which|who)\s+",
                    r"\b(can|could|would|should)\s+(?:you|i|we)",
                    r"\b(is|are|do|does)\s+",
                    r"\?\s*$"  # Ends with question mark
                ],
                "priority": 0.7
            },
            
            IntentType.HELP: {
                "keywords": [
                    "help", "assist", "support", "guide", "explain", "teach",
                    "how to", "tutorial", "documentation", "instructions"
                ],
                "patterns": [
                    r"\b(help|assist)\s+(?:me\s+)?(?:with\s+)?",
                    r"\bexplain\s+(?:how\s+)?(?:to\s+)?",
                    r"\bhow\s+(?:do\s+i|to)\s+",
                    r"\bi\s+(?:need\s+)?(?:help|assistance)\s+(?:with\s+)?"
                ],
                "priority": 0.75
            },
            
            IntentType.FRUSTRATION: {
                "keywords": [
                    "frustrated", "annoyed", "stuck", "broken", "not working",
                    "problem", "issue", "error", "bug", "wrong"
                ],
                "patterns": [
                    r"\b(not\s+working|broken|stuck|problem|issue|error)",
                    r"\b(frustrated|annoyed|angry)\s+",
                    r"\bthis\s+(?:is\s+)?(stupid|dumb|broken|wrong)",
                    r"\bwhy\s+(?:is\s+this|won't\s+this|can't\s+i)"
                ],
                "priority": 0.85
            }
        }
    
    def _initialize_entity_patterns(self) -> Dict[EntityType, Dict[str, Any]]:
        """Initialize entity extraction patterns"""
        return {
            EntityType.DATE: {
                "patterns": [
                    r"\b(today|tomorrow|yesterday)\b",
                    r"\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
                    r"\b(\d{1,2}/\d{1,2}/\d{4})\b",
                    r"\b(\d{1,2}-\d{1,2}-\d{4})\b",
                    r"\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b",
                    r"\bnext\s+(week|month|year)\b",
                    r"\blast\s+(week|month|year)\b",
                    r"\bthis\s+(week|month|year)\b"
                ],
                "normalizer": self._normalize_date
            },
            
            EntityType.TIME: {
                "patterns": [
                    r"\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b",
                    r"\b(\d{1,2}\s*(?:am|pm))\b",
                    r"\b(morning|afternoon|evening|night)\b",
                    r"\b(noon|midnight)\b",
                    r"\bin\s+(\d+)\s+(hours?|minutes?)\b"
                ],
                "normalizer": self._normalize_time
            },
            
            EntityType.DURATION: {
                "patterns": [
                    r"\b(\d+)\s+(minutes?|hours?|days?|weeks?|months?)\b",
                    r"\b(half|quarter)\s+(hour|day)\b",
                    r"\bfor\s+(\d+)\s+(min|hr|h)\b",
                    r"\b(\d+)\s*[-–]\s*(\d+)\s+(minutes?|hours?)\b"
                ],
                "normalizer": self._normalize_duration
            },
            
            EntityType.PRIORITY: {
                "patterns": [
                    r"\b(high|urgent|critical|important)\s+priority\b",
                    r"\b(low|minor|nice\s+to\s+have)\s+priority\b",
                    r"\b(medium|normal|standard)\s+priority\b",
                    r"\b(asap|urgent|emergency)\b",
                    r"\bpriority\s+(high|medium|low|1|2|3)\b"
                ],
                "normalizer": self._normalize_priority
            },
            
            EntityType.STATUS: {
                "patterns": [
                    r"\b(todo|to\s+do|pending|not\s+started)\b",
                    r"\b(in\s+progress|working\s+on|started|ongoing)\b",
                    r"\b(completed|done|finished|complete)\b",
                    r"\b(blocked|stuck|waiting|on\s+hold)\b",
                    r"\b(cancelled|canceled|dropped)\b"
                ],
                "normalizer": self._normalize_status
            },
            
            EntityType.PROJECT: {
                "patterns": [
                    r"\bproject\s+([a-zA-Z0-9\s\-_]+)\b",
                    r"\bfor\s+(?:the\s+)?([A-Z][a-zA-Z0-9\s]+)\s+project\b",
                    r"\bin\s+([A-Z][a-zA-Z0-9\s]+)\b",
                    r"\b([A-Z][a-zA-Z0-9]+)\s+(?:project|initiative|effort)\b"
                ],
                "normalizer": self._normalize_project
            }
        }
    
    def _initialize_workflow_mappings(self) -> Dict[IntentType, List[WorkflowType]]:
        """Map intents to workflows"""
        return {
            IntentType.TASK_INTENT: [WorkflowType.TASK_MANAGEMENT],
            IntentType.PROJECT_INTENT: [WorkflowType.PROJECT_CHATBOT, WorkflowType.PROJECT_INTELLIGENCE],
            IntentType.CALENDAR_INTENT: [WorkflowType.CALENDAR_INTELLIGENCE, WorkflowType.CALENDAR_OPTIMIZATION],
            IntentType.ROUTINE_INTENT: [WorkflowType.ROUTINE_COACHING],
            IntentType.VOICE_INTENT: [WorkflowType.VOICE_PROCESSING],
            IntentType.ANALYZE: [WorkflowType.ANALYTICS_LEARNING, WorkflowType.PROJECT_INTELLIGENCE],
            IntentType.SCHEDULE: [WorkflowType.CALENDAR_INTELLIGENCE],
            IntentType.CREATE: [WorkflowType.TASK_MANAGEMENT, WorkflowType.PROJECT_CHATBOT],
            IntentType.HELP: [WorkflowType.MASTER_BRAIN]
        }
    
    def _initialize_context_patterns(self) -> Dict[str, List[str]]:
        """Initialize context requirement patterns"""
        return {
            "project_context": [
                r"\bfor\s+(?:the\s+)?project\b",
                r"\bin\s+(?:the\s+)?project\b",
                r"\bproject\s+related\b"
            ],
            "time_context": [
                r"\b(today|tomorrow|this\s+week|next\s+week)\b",
                r"\bby\s+\d+\b",
                r"\bdeadline\b"
            ],
            "priority_context": [
                r"\b(urgent|important|critical|asap)\b",
                r"\bhigh\s+priority\b",
                r"\bneed\s+(?:this\s+)?(?:asap|urgently)\b"
            ]
        }
    
    def _initialize_sentiment_indicators(self) -> Dict[str, List[str]]:
        """Initialize sentiment analysis patterns"""
        return {
            "positive": [
                "great", "excellent", "perfect", "awesome", "fantastic",
                "love", "enjoy", "happy", "pleased", "satisfied", "good"
            ],
            "negative": [
                "terrible", "awful", "bad", "horrible", "hate", "dislike",
                "frustrated", "annoyed", "angry", "upset", "disappointed"
            ],
            "neutral": [
                "okay", "fine", "normal", "average", "standard", "typical"
            ]
        }
    
    def _initialize_urgency_indicators(self) -> Dict[str, List[str]]:
        """Initialize urgency detection patterns"""
        return {
            "high": [
                "urgent", "asap", "immediately", "emergency", "critical",
                "right now", "needs attention", "priority", "deadline"
            ],
            "medium": [
                "soon", "this week", "when possible", "scheduled",
                "planned", "upcoming", "moderate"
            ],
            "low": [
                "later", "eventually", "sometime", "no rush", "when convenient",
                "future", "optional", "nice to have"
            ]
        }
    
    async def analyze_intent(
        self, 
        message: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> IntentAnalysisResult:
        """Comprehensive intent analysis"""
        logger.info("Analyzing intent", message_length=len(message))
        
        # Preprocess message
        processed_message = self._preprocess_message(message)
        
        # Extract entities
        entities = await self._extract_entities(message)
        
        # Detect primary intent
        primary_intent, primary_confidence = await self._detect_primary_intent(processed_message)
        
        # Detect secondary intents
        secondary_intents = await self._detect_secondary_intents(processed_message, primary_intent)
        
        # Analyze sentiment
        sentiment = self._analyze_sentiment(message)
        
        # Detect urgency
        urgency = self._detect_urgency(message)
        
        # Assess complexity
        complexity = self._assess_complexity(message, entities)
        
        # Determine context requirements
        context_requirements = self._determine_context_requirements(message, entities)
        
        # Generate clarification suggestions
        clarifications = self._suggest_clarifications(message, entities, primary_intent)
        
        result = IntentAnalysisResult(
            primary_intent=primary_intent,
            secondary_intents=secondary_intents,
            confidence=primary_confidence,
            entities=entities,
            sentiment=sentiment,
            urgency=urgency,
            complexity=complexity,
            context_requirements=context_requirements,
            suggested_clarifications=clarifications
        )
        
        logger.info(
            "Intent analysis completed",
            primary_intent=primary_intent.value,
            confidence=primary_confidence,
            entities_count=len(entities),
            sentiment=sentiment,
            urgency=urgency
        )
        
        return result
    
    def _preprocess_message(self, message: str) -> str:
        """Enhanced message preprocessing"""
        # Convert to lowercase
        processed = message.lower()
        
        # Normalize contractions
        contractions = {
            "won't": "will not",
            "can't": "cannot",
            "n't": " not",
            "'ll": " will",
            "'ve": " have",
            "'re": " are",
            "'d": " would"
        }
        
        for contraction, expansion in contractions.items():
            processed = processed.replace(contraction, expansion)
        
        # Remove extra whitespace
        processed = ' '.join(processed.split())
        
        return processed
    
    async def _extract_entities(self, message: str) -> List[Entity]:
        """Extract entities using enhanced pattern matching"""
        entities = []
        
        for entity_type, config in self.entity_patterns.items():
            for pattern in config["patterns"]:
                matches = re.finditer(pattern, message, re.IGNORECASE)
                
                for match in matches:
                    entity_text = match.group()
                    start_pos = match.start()
                    end_pos = match.end()
                    
                    # Calculate confidence based on pattern specificity
                    confidence = self._calculate_entity_confidence(entity_text, entity_type)
                    
                    # Normalize value if normalizer exists
                    normalized_value = None
                    if "normalizer" in config:
                        normalized_value = config["normalizer"](entity_text)
                    
                    entity = Entity(
                        text=entity_text,
                        entity_type=entity_type,
                        start_pos=start_pos,
                        end_pos=end_pos,
                        confidence=confidence,
                        normalized_value=normalized_value
                    )
                    
                    entities.append(entity)
        
        # Remove overlapping entities (keep highest confidence)
        entities = self._resolve_entity_conflicts(entities)
        
        return entities
    
    async def _detect_primary_intent(self, message: str) -> Tuple[IntentType, float]:
        """Detect primary intent with confidence scoring"""
        intent_scores = {}
        
        for intent_type, config in self.intent_patterns.items():
            score = 0.0
            
            # Keyword matching
            keywords_found = 0
            for keyword in config["keywords"]:
                if keyword in message:
                    keywords_found += 1
            
            if config["keywords"]:
                keyword_score = (keywords_found / len(config["keywords"])) * 0.6
            else:
                keyword_score = 0.0
            
            # Pattern matching
            pattern_score = 0.0
            for pattern in config["patterns"]:
                if re.search(pattern, message, re.IGNORECASE):
                    pattern_score += 0.4 / len(config["patterns"])
            
            # Calculate total score with priority weighting
            total_score = (keyword_score + pattern_score) * config["priority"]
            intent_scores[intent_type] = total_score
        
        # Find best intent
        if not intent_scores:
            return IntentType.HELP, 0.5
        
        best_intent = max(intent_scores.items(), key=lambda x: x[1])
        
        # If confidence is too low, default to help
        if best_intent[1] < 0.3:
            return IntentType.HELP, 0.5
        
        return best_intent[0], min(best_intent[1], 1.0)
    
    async def _detect_secondary_intents(
        self, 
        message: str, 
        primary_intent: IntentType
    ) -> List[IntentType]:
        """Detect secondary intents that may be present"""
        secondary_intents = []
        
        # Check for question intent in addition to primary intent
        if primary_intent != IntentType.QUESTION:
            if re.search(r'\?', message) or re.search(r'\b(what|how|when|where|why)\b', message):
                secondary_intents.append(IntentType.QUESTION)
        
        # Check for help intent if user seems confused
        confusion_patterns = [
            r"\bi\s+don't\s+know\b",
            r"\bnot\s+sure\b",
            r"\bconfused\b",
            r"\bhow\s+do\s+i\b"
        ]
        
        if primary_intent != IntentType.HELP:
            for pattern in confusion_patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    secondary_intents.append(IntentType.HELP)
                    break
        
        # Check for emotional context
        for emotion_type in [IntentType.FRUSTRATION, IntentType.CELEBRATION, IntentType.CONCERN]:
            if self._detect_emotional_intent(message, emotion_type):
                secondary_intents.append(emotion_type)
        
        return secondary_intents
    
    def _analyze_sentiment(self, message: str) -> str:
        """Analyze message sentiment"""
        message_lower = message.lower()
        
        positive_score = sum(1 for word in self.sentiment_indicators["positive"] if word in message_lower)
        negative_score = sum(1 for word in self.sentiment_indicators["negative"] if word in message_lower)
        
        if positive_score > negative_score:
            return "positive"
        elif negative_score > positive_score:
            return "negative"
        else:
            return "neutral"
    
    def _detect_urgency(self, message: str) -> str:
        """Detect urgency level"""
        message_lower = message.lower()
        
        high_urgency = sum(1 for word in self.urgency_indicators["high"] if word in message_lower)
        medium_urgency = sum(1 for word in self.urgency_indicators["medium"] if word in message_lower)
        low_urgency = sum(1 for word in self.urgency_indicators["low"] if word in message_lower)
        
        if high_urgency > 0:
            return "high"
        elif medium_urgency > low_urgency:
            return "medium"
        else:
            return "low"
    
    def _assess_complexity(self, message: str, entities: List[Entity]) -> str:
        """Assess message complexity"""
        # Count sentences
        sentences = len(re.split(r'[.!?]+', message))
        
        # Count words
        words = len(message.split())
        
        # Count entities
        entity_count = len(entities)
        
        # Calculate complexity score
        complexity_score = (sentences * 0.3) + (words * 0.01) + (entity_count * 0.5)
        
        if complexity_score > 5:
            return "complex"
        elif complexity_score > 2:
            return "moderate"
        else:
            return "simple"
    
    def _determine_context_requirements(
        self, 
        message: str, 
        entities: List[Entity]
    ) -> List[str]:
        """Determine what context is needed"""
        requirements = []
        
        # Check for context patterns
        for context_type, patterns in self.context_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    requirements.append(context_type)
                    break
        
        # Check entity-based requirements
        entity_types = [entity.entity_type for entity in entities]
        
        if EntityType.PROJECT in entity_types:
            requirements.append("project_context")
        
        if EntityType.DATE in entity_types or EntityType.TIME in entity_types:
            requirements.append("time_context")
        
        if EntityType.PRIORITY in entity_types:
            requirements.append("priority_context")
        
        return list(set(requirements))  # Remove duplicates
    
    def _suggest_clarifications(
        self, 
        message: str, 
        entities: List[Entity], 
        primary_intent: IntentType
    ) -> List[str]:
        """Suggest clarifications needed"""
        clarifications = []
        
        # Intent-specific clarifications
        if primary_intent == IntentType.CREATE:
            if not any(e.entity_type == EntityType.PROJECT for e in entities):
                clarifications.append("Which project should this be associated with?")
            
            if not any(e.entity_type == EntityType.PRIORITY for e in entities):
                clarifications.append("What priority should this have?")
        
        elif primary_intent == IntentType.SCHEDULE:
            if not any(e.entity_type == EntityType.DATE for e in entities):
                clarifications.append("What date would you prefer?")
            
            if not any(e.entity_type == EntityType.TIME for e in entities):
                clarifications.append("What time works best?")
        
        elif primary_intent == IntentType.UPDATE:
            if not any(e.entity_type == EntityType.STATUS for e in entities):
                clarifications.append("What should the new status be?")
        
        # General clarifications based on ambiguity
        if len(message.split()) < 3:
            clarifications.append("Could you provide more details about what you'd like to do?")
        
        # Check for pronouns that need clarification
        pronouns = ["it", "this", "that", "them", "they"]
        if any(pronoun in message.lower() for pronoun in pronouns):
            clarifications.append("Could you specify what you're referring to?")
        
        return clarifications
    
    def _detect_emotional_intent(self, message: str, emotion_type: IntentType) -> bool:
        """Detect specific emotional intent"""
        message_lower = message.lower()
        
        if emotion_type == IntentType.FRUSTRATION:
            frustration_words = ["frustrated", "annoyed", "stuck", "broken", "not working"]
            return any(word in message_lower for word in frustration_words)
        
        elif emotion_type == IntentType.CELEBRATION:
            celebration_words = ["done", "completed", "finished", "success", "great", "awesome"]
            return any(word in message_lower for word in celebration_words)
        
        elif emotion_type == IntentType.CONCERN:
            concern_words = ["worried", "concerned", "problem", "issue", "trouble"]
            return any(word in message_lower for word in concern_words)
        
        return False
    
    def _calculate_entity_confidence(self, entity_text: str, entity_type: EntityType) -> float:
        """Calculate confidence score for entity extraction"""
        # Base confidence
        base_confidence = 0.7
        
        # Boost confidence for specific patterns
        if entity_type == EntityType.DATE:
            if re.match(r'\d{1,2}/\d{1,2}/\d{4}', entity_text):
                return 0.95
            elif entity_text.lower() in ["today", "tomorrow", "yesterday"]:
                return 0.9
        
        elif entity_type == EntityType.TIME:
            if re.match(r'\d{1,2}:\d{2}', entity_text):
                return 0.9
        
        elif entity_type == EntityType.PRIORITY:
            if any(word in entity_text.lower() for word in ["high", "urgent", "critical"]):
                return 0.85
        
        return base_confidence
    
    def _resolve_entity_conflicts(self, entities: List[Entity]) -> List[Entity]:
        """Resolve overlapping entities by keeping highest confidence"""
        if not entities:
            return entities
        
        # Sort by position
        entities.sort(key=lambda e: e.start_pos)
        
        resolved = []
        i = 0
        
        while i < len(entities):
            current = entities[i]
            overlapping = [current]
            
            # Find all overlapping entities
            j = i + 1
            while j < len(entities) and entities[j].start_pos < current.end_pos:
                overlapping.append(entities[j])
                j += 1
            
            # Keep the one with highest confidence
            best_entity = max(overlapping, key=lambda e: e.confidence)
            resolved.append(best_entity)
            
            # Skip processed entities
            i = j if j > i + 1 else i + 1
        
        return resolved
    
    # Normalization methods for entities
    def _normalize_date(self, date_text: str) -> Optional[datetime]:
        """Normalize date entity to datetime object"""
        date_text = date_text.lower().strip()
        
        if date_text == "today":
            return datetime.now()
        elif date_text == "tomorrow":
            return datetime.now() + timedelta(days=1)
        elif date_text == "yesterday":
            return datetime.now() - timedelta(days=1)
        
        # Add more sophisticated date parsing here
        return None
    
    def _normalize_time(self, time_text: str) -> Optional[str]:
        """Normalize time entity"""
        time_text = time_text.lower().strip()
        
        # Simple time normalization
        if "morning" in time_text:
            return "09:00"
        elif "afternoon" in time_text:
            return "14:00"
        elif "evening" in time_text:
            return "18:00"
        elif "night" in time_text:
            return "20:00"
        
        return time_text
    
    def _normalize_duration(self, duration_text: str) -> Optional[int]:
        """Normalize duration to minutes"""
        duration_text = duration_text.lower()
        
        # Extract number and unit
        match = re.search(r'(\d+)\s*(minutes?|hours?|days?|weeks?)', duration_text)
        if match:
            number = int(match.group(1))
            unit = match.group(2)
            
            if "minute" in unit:
                return number
            elif "hour" in unit:
                return number * 60
            elif "day" in unit:
                return number * 60 * 24
            elif "week" in unit:
                return number * 60 * 24 * 7
        
        return None
    
    def _normalize_priority(self, priority_text: str) -> str:
        """Normalize priority entity"""
        priority_text = priority_text.lower()
        
        if any(word in priority_text for word in ["high", "urgent", "critical", "important", "asap"]):
            return "high"
        elif any(word in priority_text for word in ["low", "minor", "nice"]):
            return "low"
        else:
            return "medium"
    
    def _normalize_status(self, status_text: str) -> str:
        """Normalize status entity"""
        status_text = status_text.lower()
        
        if any(word in status_text for word in ["todo", "to do", "pending", "not started"]):
            return "todo"
        elif any(word in status_text for word in ["progress", "working", "started"]):
            return "in_progress"
        elif any(word in status_text for word in ["completed", "done", "finished"]):
            return "completed"
        elif any(word in status_text for word in ["blocked", "stuck", "waiting"]):
            return "blocked"
        
        return "todo"
    
    def _normalize_project(self, project_text: str) -> str:
        """Normalize project entity"""
        # Extract project name from text
        project_text = project_text.strip()
        
        # Remove common prefixes/suffixes
        project_text = re.sub(r'^(project\s+|for\s+the\s+|in\s+)', '', project_text, flags=re.IGNORECASE)
        project_text = re.sub(r'(\s+project|\s+initiative)$', '', project_text, flags=re.IGNORECASE)
        
        return project_text.title()
    
    def analyze_voice_command(self, transcription: str, context: Optional[Dict[str, Any]] = None) -> IntentAnalysisResult:
        """Specialized analysis for voice commands with audio-specific patterns"""
        
        # Voice commands often have different patterns than text
        voice_patterns = {
            # Navigation commands
            r"(?:go\s+to|open|navigate\s+to|show\s+me)\s+(?:the\s+)?(dashboard|projects?|tasks?|calendar|settings)": {
                "intent": IntentType.NAVIGATE,
                "workflow": WorkflowType.MASTER_BRAIN
            },
            
            # Quick actions
            r"(?:create|add|new)\s+(?:a\s+)?task\s+(?:for\s+)?(today|tomorrow|this\s+week|next\s+week)": {
                "intent": IntentType.CREATE,
                "workflow": WorkflowType.TASK_MANAGEMENT
            },
            
            # Status queries
            r"(?:what's|show\s+me|tell\s+me)\s+(?:my\s+)?(?:project\s+)?(status|progress|health)": {
                "intent": IntentType.STATUS,
                "workflow": WorkflowType.PROJECT_INTELLIGENCE
            },
            
            # Routine commands
            r"(?:add|track|log)\s+(?:to\s+my\s+)?routine": {
                "intent": IntentType.CREATE,
                "workflow": WorkflowType.ROUTINE_COACHING
            },
            
            # Meeting/calendar commands
            r"schedule\s+(?:a\s+)?meeting\s+(?:with\s+.+?\s+)?(?:for\s+)?(today|tomorrow|this\s+week|next\s+week)": {
                "intent": IntentType.SCHEDULE,
                "workflow": WorkflowType.CALENDAR_INTELLIGENCE
            }
        }
        
        # Check voice-specific patterns first
        for pattern, config in voice_patterns.items():
            if re.search(pattern, transcription, re.IGNORECASE):
                # Extract entities specific to voice patterns
                entities = self._extract_voice_entities(transcription, pattern)
                
                return IntentAnalysisResult(
                    primary_intent=config["intent"],
                    secondary_intents=[],
                    confidence=0.92,  # High confidence for voice pattern matches
                    entities=entities,
                    sentiment="neutral",
                    urgency="medium",
                    complexity="simple",
                    context_requirements=["voice_input"],
                    suggested_clarifications=[]
                )
        
        # Fall back to regular analysis if no voice patterns match
        return self.analyze_intent(transcription, context)
    
    def _extract_voice_entities(self, transcription: str, pattern: str) -> List[Entity]:
        """Extract entities specifically from voice commands"""
        entities = []
        text_lower = transcription.lower()
        
        # Time entities (common in voice commands)
        time_patterns = {
            r"\b(today)\b": (EntityType.DATE, "today"),
            r"\b(tomorrow)\b": (EntityType.DATE, "tomorrow"),
            r"\b(this\s+week)\b": (EntityType.DURATION, "this_week"),
            r"\b(next\s+week)\b": (EntityType.DURATION, "next_week"),
            r"\b(this\s+morning|this\s+afternoon|this\s+evening|tonight)\b": (EntityType.TIME, None),
            r"\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b": (EntityType.TIME, None)
        }
        
        for time_pattern, (entity_type, normalized) in time_patterns.items():
            matches = re.finditer(time_pattern, text_lower)
            for match in matches:
                entities.append(Entity(
                    text=match.group(),
                    entity_type=entity_type,
                    start_pos=match.start(),
                    end_pos=match.end(),
                    confidence=0.9,
                    normalized_value=normalized or match.group(),
                    context={"voice_input": True}
                ))
        
        # Priority entities from voice tone/words
        priority_patterns = {
            r"\b(urgent|asap|immediately|right\s+away)\b": "high",
            r"\b(important|priority|critical)\b": "high",
            r"\b(when\s+I\s+have\s+time|later|eventually)\b": "low"
        }
        
        for priority_pattern, priority_level in priority_patterns.items():
            if re.search(priority_pattern, text_lower):
                match = re.search(priority_pattern, text_lower)
                entities.append(Entity(
                    text=match.group(),
                    entity_type=EntityType.PRIORITY,
                    start_pos=match.start(),
                    end_pos=match.end(),
                    confidence=0.85,
                    normalized_value=priority_level,
                    context={"voice_input": True}
                ))
        
        return entities
    
    def analyze_mobile_context(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze context specific to mobile interactions"""
        
        mobile_indicators = {
            "gesture_based": context.get("input_method") == "gesture",
            "voice_activated": context.get("input_method") == "voice",
            "touch_optimized": context.get("device_type") == "mobile",
            "quick_action": len(message.split()) <= 3,  # Short commands typical on mobile
            "location_aware": "location" in context,
            "time_sensitive": any(word in message.lower() for word in ["now", "urgent", "asap", "quick"])
        }
        
        # Suggest mobile-optimized responses
        mobile_optimizations = []
        
        if mobile_indicators["touch_optimized"]:
            mobile_optimizations.extend([
                "Use touch-friendly interface elements",
                "Provide swipe gestures for actions",
                "Optimize for thumb navigation"
            ])
        
        if mobile_indicators["voice_activated"]:
            mobile_optimizations.extend([
                "Provide audio feedback",
                "Confirm actions verbally",
                "Offer voice alternatives for follow-up"
            ])
        
        if mobile_indicators["quick_action"]:
            mobile_optimizations.extend([
                "Prioritize single-tap actions",
                "Minimize input required",
                "Show quick action buttons"
            ])
        
        return {
            "mobile_indicators": mobile_indicators,
            "optimizations": mobile_optimizations,
            "ui_adaptations": {
                "use_bottom_sheet": mobile_indicators["touch_optimized"],
                "enable_haptic_feedback": mobile_indicators["touch_optimized"],
                "show_voice_button": True,
                "compact_layout": mobile_indicators["quick_action"]
            }
        }
    
    def get_contextual_suggestions(self, intent_result: IntentAnalysisResult, context: Optional[Dict[str, Any]] = None) -> List[str]:
        """Generate contextual suggestions based on intent and context"""
        suggestions = []
        
        # Base suggestions on primary intent
        if intent_result.primary_intent == IntentType.CREATE:
            if EntityType.TASK in [e.entity_type for e in intent_result.entities]:
                suggestions.extend([
                    "Set a due date",
                    "Add to a project", 
                    "Set priority level",
                    "Add description or notes"
                ])
            elif EntityType.PROJECT in [e.entity_type for e in intent_result.entities]:
                suggestions.extend([
                    "Choose project template",
                    "Set project goals",
                    "Invite team members",
                    "Create initial tasks"
                ])
        
        elif intent_result.primary_intent == IntentType.READ:
            suggestions.extend([
                "Filter by status",
                "Sort by priority", 
                "Group by project",
                "Export to calendar"
            ])
        
        elif intent_result.primary_intent == IntentType.SCHEDULE:
            suggestions.extend([
                "Check availability",
                "Set reminder",
                "Add attendees",
                "Choose meeting type"
            ])
        
        # Add context-specific suggestions
        if context:
            if context.get("device_type") == "mobile":
                suggestions.append("Use voice input for faster entry")
            
            if context.get("time_of_day") == "morning":
                suggestions.append("Add to daily briefing")
            
            if context.get("current_page") == "dashboard":
                suggestions.append("Pin to dashboard widgets")
        
        return suggestions[:4]  # Limit to most relevant suggestions


# Global instance for use in services
enhanced_intent_recognizer = EnhancedIntentRecognizer()