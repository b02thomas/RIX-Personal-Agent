# /Users/benediktthomas/RIX Personal Agent/backend-enhancements/voice-intelligence/multilang_entity_extractor.py
# Multi-language entity extraction for RIX Voice Intelligence Phase 2.0
# Extracts entities from German and English voice commands with language-aware formatting
# RELEVANT FILES: multilang_intent_classifier.py, enhanced_voice_processor.py, voice_mcp_router.py, german_language_utils.py

import logging
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union
from dataclasses import dataclass
from enum import Enum
import asyncio

from german_language_utils import GermanLanguageUtils


class EntityType(Enum):
    """Entity types for multi-language extraction"""
    DATE = "date"
    TIME = "time"
    DURATION = "duration"
    PERSON = "person"
    LOCATION = "location"
    TASK_TITLE = "task_title"
    PRIORITY = "priority"
    STATUS = "status"
    CATEGORY = "category"
    AMOUNT = "amount"
    FREQUENCY = "frequency"
    TOPIC = "topic"
    ACTION = "action"
    EVENT_TYPE = "event_type"
    EMOTION = "emotion"
    QUALITY = "quality"


@dataclass
class ExtractedEntity:
    """Extracted entity with metadata"""
    type: EntityType
    value: str
    confidence: float
    language: str
    normalized_value: Optional[str] = None
    start_pos: Optional[int] = None
    end_pos: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class MultiLanguageEntityExtractor:
    """
    Multi-Language Entity Extraction System for RIX Voice Intelligence
    
    Features:
    - German and English entity extraction with language-aware patterns
    - Date/time parsing for both languages with cultural considerations
    - Task, calendar, and knowledge entity extraction
    - Priority and status recognition in both languages
    - Location and person name extraction
    - Confidence scoring and normalization
    - Language-specific formatting and validation
    """

    def __init__(self, language_utils: Optional[GermanLanguageUtils] = None):
        """
        Initialize Multi-Language Entity Extractor
        
        Args:
            language_utils: Optional German language utilities instance
        """
        self.logger = logging.getLogger(__name__)
        self.language_utils = language_utils or GermanLanguageUtils()
        
        # German patterns
        self.german_patterns = self._initialize_german_patterns()
        
        # English patterns
        self.english_patterns = self._initialize_english_patterns()
        
        # Common patterns (work for both languages)
        self.common_patterns = self._initialize_common_patterns()
        
        # Entity normalization mappings
        self.normalization_maps = {
            "de": self._initialize_german_normalizations(),
            "en": self._initialize_english_normalizations()
        }
        
        # Extraction statistics
        self.extraction_stats = {
            "total_extractions": 0,
            "successful_extractions": 0,
            "entities_by_type": {},
            "entities_by_language": {"de": 0, "en": 0},
            "average_confidence": 0.0,
        }
        
        self.logger.info("Multi-Language Entity Extractor initialized")

    def _initialize_german_patterns(self) -> Dict[EntityType, List[Dict[str, Any]]]:
        """Initialize German entity patterns"""
        return {
            EntityType.DATE: [
                {
                    "pattern": r"(?:heute|jetzt)",
                    "confidence": 0.95,
                    "handler": self._extract_german_date_relative
                },
                {
                    "pattern": r"(?:morgen|übermorgen)",
                    "confidence": 0.9,
                    "handler": self._extract_german_date_relative
                },
                {
                    "pattern": r"(?:nächste|kommende)\s+(?:woche|monat)",
                    "confidence": 0.85,
                    "handler": self._extract_german_date_relative
                },
                {
                    "pattern": r"(?:am\s+)?(\d{1,2})\.(\d{1,2})\.?(?:(\d{2,4}))?",
                    "confidence": 0.9,
                    "handler": self._extract_german_date_absolute
                },
                {
                    "pattern": r"(?:am\s+)?(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)",
                    "confidence": 0.8,
                    "handler": self._extract_german_weekday
                },
            ],
            
            EntityType.TIME: [
                {
                    "pattern": r"(?:um\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:uhr)?",
                    "confidence": 0.9,
                    "handler": self._extract_german_time_absolute
                },
                {
                    "pattern": r"(?:morgens|vormittags|mittags|nachmittags|abends|nachts)",
                    "confidence": 0.7,
                    "handler": self._extract_german_time_relative
                },
                {
                    "pattern": r"(?:in\s+)?(\d+)\s+(?:minuten|stunden)",
                    "confidence": 0.8,
                    "handler": self._extract_german_time_duration
                },
            ],
            
            EntityType.PRIORITY: [
                {
                    "pattern": r"(?:sehr\s+)?(?:wichtig|dringend|priorität|eilig)",
                    "confidence": 0.9,
                    "handler": self._extract_german_priority
                },
                {
                    "pattern": r"(?:niedrige|mittlere|hohe)\s+priorität",
                    "confidence": 0.85,
                    "handler": self._extract_german_priority
                },
            ],
            
            EntityType.STATUS: [
                {
                    "pattern": r"(?:erledigt|fertig|abgeschlossen|gemacht|geschafft)",
                    "confidence": 0.95,
                    "handler": self._extract_german_status
                },
                {
                    "pattern": r"(?:offen|in\s+bearbeitung|begonnen|gestartet)",
                    "confidence": 0.9,
                    "handler": self._extract_german_status
                },
            ],
            
            EntityType.PERSON: [
                {
                    "pattern": r"(?:mit\s+|für\s+|von\s+)([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*)",
                    "confidence": 0.8,
                    "handler": self._extract_person_name
                },
            ],
            
            EntityType.LOCATION: [
                {
                    "pattern": r"(?:in\s+|bei\s+|nach\s+)([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*)",
                    "confidence": 0.75,
                    "handler": self._extract_location_name
                },
                {
                    "pattern": r"(?:zuhause|büro|office|konferenzraum|meeting\s*raum)",
                    "confidence": 0.8,
                    "handler": self._extract_common_location
                },
            ],
        }

    def _initialize_english_patterns(self) -> Dict[EntityType, List[Dict[str, Any]]]:
        """Initialize English entity patterns"""
        return {
            EntityType.DATE: [
                {
                    "pattern": r"(?:today|now)",
                    "confidence": 0.95,
                    "handler": self._extract_english_date_relative
                },
                {
                    "pattern": r"(?:tomorrow|day after tomorrow)",
                    "confidence": 0.9,
                    "handler": self._extract_english_date_relative
                },
                {
                    "pattern": r"(?:next|coming)\s+(?:week|month|year)",
                    "confidence": 0.85,
                    "handler": self._extract_english_date_relative
                },
                {
                    "pattern": r"(\d{1,2})[\/\-](\d{1,2})[\/\-]?(?:(\d{2,4}))?",
                    "confidence": 0.85,
                    "handler": self._extract_english_date_absolute
                },
                {
                    "pattern": r"(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)",
                    "confidence": 0.8,
                    "handler": self._extract_english_weekday
                },
            ],
            
            EntityType.TIME: [
                {
                    "pattern": r"(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?",
                    "confidence": 0.9,
                    "handler": self._extract_english_time_absolute
                },
                {
                    "pattern": r"(?:morning|afternoon|evening|night)",
                    "confidence": 0.7,
                    "handler": self._extract_english_time_relative
                },
                {
                    "pattern": r"(?:in\s+)?(\d+)\s+(?:minutes|hours)",
                    "confidence": 0.8,
                    "handler": self._extract_english_time_duration
                },
            ],
            
            EntityType.PRIORITY: [
                {
                    "pattern": r"(?:very\s+)?(?:important|urgent|priority|critical)",
                    "confidence": 0.9,
                    "handler": self._extract_english_priority
                },
                {
                    "pattern": r"(?:low|medium|high)\s+priority",
                    "confidence": 0.85,
                    "handler": self._extract_english_priority
                },
            ],
            
            EntityType.STATUS: [
                {
                    "pattern": r"(?:done|finished|completed|accomplished)",
                    "confidence": 0.95,
                    "handler": self._extract_english_status
                },
                {
                    "pattern": r"(?:open|in\s+progress|started|ongoing)",
                    "confidence": 0.9,
                    "handler": self._extract_english_status
                },
            ],
            
            EntityType.PERSON: [
                {
                    "pattern": r"(?:with\s+|for\s+|from\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
                    "confidence": 0.8,
                    "handler": self._extract_person_name
                },
            ],
            
            EntityType.LOCATION: [
                {
                    "pattern": r"(?:at\s+|in\s+|to\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
                    "confidence": 0.75,
                    "handler": self._extract_location_name
                },
                {
                    "pattern": r"(?:home|office|conference\s*room|meeting\s*room)",
                    "confidence": 0.8,
                    "handler": self._extract_common_location
                },
            ],
        }

    def _initialize_common_patterns(self) -> Dict[EntityType, List[Dict[str, Any]]]:
        """Initialize patterns that work for both languages"""
        return {
            EntityType.AMOUNT: [
                {
                    "pattern": r"(\d+(?:\.\d+)?)\s*(?:€|euro|dollar|\$|usd)",
                    "confidence": 0.9,
                    "handler": self._extract_currency_amount
                },
                {
                    "pattern": r"(\d+(?:\.\d+)?)\s*(?:kg|gram|liter|meter|km)",
                    "confidence": 0.85,
                    "handler": self._extract_measurement
                },
            ],
            
            EntityType.FREQUENCY: [
                {
                    "pattern": r"(?:täglich|daily)",
                    "confidence": 0.9,
                    "handler": self._extract_frequency
                },
                {
                    "pattern": r"(?:wöchentlich|weekly)",
                    "confidence": 0.9,
                    "handler": self._extract_frequency
                },
                {
                    "pattern": r"(?:monatlich|monthly)",
                    "confidence": 0.9,
                    "handler": self._extract_frequency
                },
            ],
        }

    def _initialize_german_normalizations(self) -> Dict[str, Dict[str, str]]:
        """Initialize German entity normalizations"""
        return {
            "priority": {
                "sehr wichtig": "high",
                "wichtig": "high",
                "dringend": "high",
                "eilig": "high",
                "mittlere priorität": "medium",
                "normale priorität": "medium",
                "niedrige priorität": "low",
                "unwichtig": "low",
            },
            "status": {
                "erledigt": "completed",
                "fertig": "completed",
                "abgeschlossen": "completed",
                "gemacht": "completed",
                "geschafft": "completed",
                "offen": "open",
                "in bearbeitung": "in_progress",
                "begonnen": "in_progress",
                "gestartet": "in_progress",
            },
            "time_relative": {
                "morgens": "morning",
                "vormittags": "morning",
                "mittags": "noon",
                "nachmittags": "afternoon",
                "abends": "evening",
                "nachts": "night",
            },
        }

    def _initialize_english_normalizations(self) -> Dict[str, Dict[str, str]]:
        """Initialize English entity normalizations"""
        return {
            "priority": {
                "very important": "high",
                "important": "high",
                "urgent": "high",
                "critical": "high",
                "medium priority": "medium",
                "normal priority": "medium",
                "low priority": "low",
                "unimportant": "low",
            },
            "status": {
                "done": "completed",
                "finished": "completed",
                "completed": "completed",
                "accomplished": "completed",
                "open": "open",
                "in progress": "in_progress",
                "started": "in_progress",
                "ongoing": "in_progress",
            },
            "time_relative": {
                "morning": "morning",
                "afternoon": "afternoon",
                "evening": "evening",
                "night": "night",
            },
        }

    async def extract_entities(
        self, 
        text: str, 
        language: str = "de", 
        entity_types: Optional[List[EntityType]] = None
    ) -> List[ExtractedEntity]:
        """
        Extract entities from text in specified language
        
        Args:
            text: Input text to extract entities from
            language: Language code ("de" or "en")
            entity_types: Optional list of specific entity types to extract
            
        Returns:
            List of extracted entities
        """
        try:
            self.extraction_stats["total_extractions"] += 1
            
            entities = []
            
            # Select appropriate pattern sets
            if language == "en":
                patterns = self.english_patterns
            else:
                patterns = self.german_patterns  # Default to German
            
            # Always include common patterns
            all_patterns = {**patterns, **self.common_patterns}
            
            # Filter by requested entity types if specified
            if entity_types:
                all_patterns = {k: v for k, v in all_patterns.items() if k in entity_types}
            
            # Extract entities for each type
            for entity_type, pattern_list in all_patterns.items():
                type_entities = await self._extract_entities_of_type(
                    text, entity_type, pattern_list, language
                )
                entities.extend(type_entities)
            
            # Remove duplicate and overlapping entities
            entities = await self._deduplicate_entities(entities)
            
            # Sort by position in text
            entities.sort(key=lambda e: e.start_pos if e.start_pos is not None else 0)
            
            # Update statistics
            if entities:
                self.extraction_stats["successful_extractions"] += 1
                self.extraction_stats["entities_by_language"][language] += len(entities)
                
                for entity in entities:
                    entity_type_name = entity.type.value
                    if entity_type_name not in self.extraction_stats["entities_by_type"]:
                        self.extraction_stats["entities_by_type"][entity_type_name] = 0
                    self.extraction_stats["entities_by_type"][entity_type_name] += 1
            
            self.logger.debug(f"Extracted {len(entities)} entities from text (language: {language})")
            
            return entities
            
        except Exception as e:
            self.logger.error(f"Entity extraction failed: {e}")
            return []

    async def _extract_entities_of_type(
        self, 
        text: str, 
        entity_type: EntityType, 
        patterns: List[Dict[str, Any]], 
        language: str
    ) -> List[ExtractedEntity]:
        """Extract entities of a specific type"""
        entities = []
        
        for pattern_info in patterns:
            pattern = pattern_info["pattern"]
            confidence = pattern_info["confidence"]
            handler = pattern_info["handler"]
            
            matches = re.finditer(pattern, text, re.IGNORECASE)
            
            for match in matches:
                try:
                    # Call the specific handler for this pattern
                    entity_value = await handler(match, text, language)
                    
                    if entity_value:
                        # Normalize the value
                        normalized_value = await self._normalize_entity_value(
                            entity_value, entity_type, language
                        )
                        
                        entity = ExtractedEntity(
                            type=entity_type,
                            value=entity_value,
                            confidence=confidence,
                            language=language,
                            normalized_value=normalized_value,
                            start_pos=match.start(),
                            end_pos=match.end(),
                            metadata={
                                "pattern": pattern,
                                "match_text": match.group(0)
                            }
                        )
                        
                        entities.append(entity)
                        
                except Exception as e:
                    self.logger.warning(f"Handler failed for pattern {pattern}: {e}")
                    continue
        
        return entities

    async def _normalize_entity_value(
        self, 
        value: str, 
        entity_type: EntityType, 
        language: str
    ) -> Optional[str]:
        """Normalize entity value based on type and language"""
        try:
            normalizations = self.normalization_maps.get(language, {})
            type_normalizations = normalizations.get(entity_type.value, {})
            
            value_lower = value.lower().strip()
            
            # Direct mapping lookup
            if value_lower in type_normalizations:
                return type_normalizations[value_lower]
            
            # Special handling for different entity types
            if entity_type == EntityType.DATE:
                return await self._normalize_date_value(value, language)
            elif entity_type == EntityType.TIME:
                return await self._normalize_time_value(value, language)
            elif entity_type == EntityType.PRIORITY:
                return await self._normalize_priority_value(value, language)
            elif entity_type == EntityType.STATUS:
                return await self._normalize_status_value(value, language)
            
            return value.strip()
            
        except Exception as e:
            self.logger.warning(f"Entity normalization failed: {e}")
            return value

    async def _deduplicate_entities(self, entities: List[ExtractedEntity]) -> List[ExtractedEntity]:
        """Remove duplicate and overlapping entities"""
        if not entities:
            return entities
        
        # Sort by start position
        entities.sort(key=lambda e: e.start_pos if e.start_pos is not None else 0)
        
        deduplicated = []
        
        for entity in entities:
            # Check for overlap with existing entities
            overlaps = False
            for existing in deduplicated:
                if (entity.start_pos is not None and existing.start_pos is not None and
                    entity.end_pos is not None and existing.end_pos is not None):
                    
                    # Check for overlap
                    if (entity.start_pos < existing.end_pos and 
                        entity.end_pos > existing.start_pos):
                        
                        # Keep the entity with higher confidence
                        if entity.confidence > existing.confidence:
                            deduplicated.remove(existing)
                        else:
                            overlaps = True
                            break
            
            if not overlaps:
                deduplicated.append(entity)
        
        return deduplicated

    # Handler methods for different entity types
    async def _extract_german_date_relative(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract German relative dates"""
        matched_text = match.group(0).lower()
        
        if "heute" in matched_text or "jetzt" in matched_text:
            return "today"
        elif "morgen" in matched_text:
            if "übermorgen" in matched_text:
                return "day_after_tomorrow"
            return "tomorrow"
        elif "nächste woche" in matched_text or "kommende woche" in matched_text:
            return "next_week"
        elif "nächsten monat" in matched_text or "kommenden monat" in matched_text:
            return "next_month"
        
        return matched_text

    async def _extract_english_date_relative(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract English relative dates"""
        matched_text = match.group(0).lower()
        
        if "today" in matched_text or "now" in matched_text:
            return "today"
        elif "tomorrow" in matched_text:
            if "day after tomorrow" in matched_text:
                return "day_after_tomorrow"
            return "tomorrow"
        elif "next week" in matched_text or "coming week" in matched_text:
            return "next_week"
        elif "next month" in matched_text or "coming month" in matched_text:
            return "next_month"
        
        return matched_text

    async def _extract_german_date_absolute(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract German absolute dates (DD.MM.YYYY format)"""
        day = match.group(1)
        month = match.group(2)
        year = match.group(3) if match.group(3) else str(datetime.now().year)
        
        if len(year) == 2:
            year = "20" + year
        
        try:
            # Validate date
            datetime(int(year), int(month), int(day))
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        except ValueError:
            return None

    async def _extract_english_date_absolute(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract English absolute dates (MM/DD/YYYY format)"""
        month = match.group(1)
        day = match.group(2)
        year = match.group(3) if match.group(3) else str(datetime.now().year)
        
        if len(year) == 2:
            year = "20" + year
        
        try:
            # Validate date
            datetime(int(year), int(month), int(day))
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        except ValueError:
            return None

    async def _extract_german_weekday(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract German weekdays"""
        weekday_map = {
            "montag": "monday",
            "dienstag": "tuesday", 
            "mittwoch": "wednesday",
            "donnerstag": "thursday",
            "freitag": "friday",
            "samstag": "saturday",
            "sonntag": "sunday"
        }
        weekday = match.group(1).lower() if match.group(1) else match.group(0).lower()
        return weekday_map.get(weekday, weekday)

    async def _extract_english_weekday(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract English weekdays"""
        weekday = match.group(1).lower() if match.group(1) else match.group(0).lower()
        return weekday

    async def _extract_german_time_absolute(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract German absolute times"""
        hour = match.group(1)
        minute = match.group(2) if match.group(2) else "00"
        
        try:
            hour_int = int(hour)
            minute_int = int(minute)
            
            if 0 <= hour_int <= 23 and 0 <= minute_int <= 59:
                return f"{hour.zfill(2)}:{minute.zfill(2)}"
        except ValueError:
            pass
        
        return None

    async def _extract_english_time_absolute(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract English absolute times"""
        hour = match.group(1)
        minute = match.group(2) if match.group(2) else "00"
        
        # Handle AM/PM
        full_match = match.group(0).lower()
        is_pm = "pm" in full_match
        is_am = "am" in full_match
        
        try:
            hour_int = int(hour)
            minute_int = int(minute)
            
            if is_pm and hour_int != 12:
                hour_int += 12
            elif is_am and hour_int == 12:
                hour_int = 0
            
            if 0 <= hour_int <= 23 and 0 <= minute_int <= 59:
                return f"{str(hour_int).zfill(2)}:{minute.zfill(2)}"
        except ValueError:
            pass
        
        return None

    async def _extract_german_time_relative(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract German relative times"""
        return match.group(0).lower()

    async def _extract_english_time_relative(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract English relative times"""
        return match.group(0).lower()

    async def _extract_german_time_duration(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract German time durations"""
        amount = match.group(1)
        full_match = match.group(0).lower()
        
        if "minuten" in full_match:
            return f"{amount}_minutes"
        elif "stunden" in full_match:
            return f"{amount}_hours"
        
        return match.group(0)

    async def _extract_english_time_duration(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract English time durations"""
        amount = match.group(1)
        full_match = match.group(0).lower()
        
        if "minutes" in full_match:
            return f"{amount}_minutes"
        elif "hours" in full_match:
            return f"{amount}_hours"
        
        return match.group(0)

    async def _extract_german_priority(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract German priority indicators"""
        return match.group(0).lower()

    async def _extract_english_priority(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract English priority indicators"""
        return match.group(0).lower()

    async def _extract_german_status(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract German status indicators"""
        return match.group(0).lower()

    async def _extract_english_status(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract English status indicators"""
        return match.group(0).lower()

    async def _extract_person_name(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract person names"""
        if match.group(1):
            return match.group(1).strip()
        return None

    async def _extract_location_name(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract location names"""
        if match.group(1):
            return match.group(1).strip()
        return None

    async def _extract_common_location(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract common location names"""
        return match.group(0).lower()

    async def _extract_currency_amount(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract currency amounts"""
        amount = match.group(1)
        full_match = match.group(0).lower()
        
        if "€" in full_match or "euro" in full_match:
            return f"{amount}_EUR"
        elif "$" in full_match or "dollar" in full_match or "usd" in full_match:
            return f"{amount}_USD"
        
        return amount

    async def _extract_measurement(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract measurements"""
        return match.group(0)

    async def _extract_frequency(self, match: re.Match, text: str, language: str) -> Optional[str]:
        """Extract frequency indicators"""
        matched_text = match.group(0).lower()
        
        if "täglich" in matched_text or "daily" in matched_text:
            return "daily"
        elif "wöchentlich" in matched_text or "weekly" in matched_text:
            return "weekly"
        elif "monatlich" in matched_text or "monthly" in matched_text:
            return "monthly"
        
        return matched_text

    # Normalization helper methods
    async def _normalize_date_value(self, value: str, language: str) -> Optional[str]:
        """Normalize date values"""
        # Already handled in extraction methods
        return value

    async def _normalize_time_value(self, value: str, language: str) -> Optional[str]:
        """Normalize time values"""
        # Already handled in extraction methods
        return value

    async def _normalize_priority_value(self, value: str, language: str) -> Optional[str]:
        """Normalize priority values"""
        normalizations = self.normalization_maps.get(language, {}).get("priority", {})
        return normalizations.get(value.lower(), value)

    async def _normalize_status_value(self, value: str, language: str) -> Optional[str]:
        """Normalize status values"""
        normalizations = self.normalization_maps.get(language, {}).get("status", {})
        return normalizations.get(value.lower(), value)

    async def get_extraction_stats(self) -> Dict[str, Any]:
        """Get entity extraction statistics"""
        return {
            "total_extractions": self.extraction_stats["total_extractions"],
            "successful_extractions": self.extraction_stats["successful_extractions"],
            "success_rate": (
                self.extraction_stats["successful_extractions"] / 
                self.extraction_stats["total_extractions"] 
                if self.extraction_stats["total_extractions"] > 0 else 0.0
            ),
            "entities_by_type": self.extraction_stats["entities_by_type"],
            "entities_by_language": self.extraction_stats["entities_by_language"],
            "supported_languages": ["de", "en"],
            "supported_entity_types": [e.value for e in EntityType],
        }

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check of the entity extractor"""
        try:
            # Test extraction with sample texts
            german_test = await self.extract_entities("Morgen um 10 Uhr wichtiger Termin", "de")
            english_test = await self.extract_entities("Tomorrow at 2pm important meeting", "en")
            
            return {
                "status": "healthy",
                "german_extraction_test": len(german_test) > 0,
                "english_extraction_test": len(english_test) > 0,
                "supported_languages": ["de", "en"],
                "supported_entity_types": len(EntityType),
                "extraction_stats": await self.get_extraction_stats(),
                "timestamp": datetime.utcnow().isoformat(),
            }
            
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }