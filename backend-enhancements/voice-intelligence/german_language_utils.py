# /Users/benediktthomas/RIX Personal Agent/backend-enhancements/voice-intelligence/german_language_utils.py
# German language processing utilities for RIX Voice Intelligence
# Provides German-specific NLP capabilities including text normalization, entity extraction, and cultural context
# RELEVANT FILES: german_intent_classifier.py, enhanced_voice_processor.py, intent_testing.py

import logging
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class TemporalExpression:
    """Temporal expression found in German text"""

    text: str
    normalized: str
    date_time: Optional[datetime]
    time_type: str  # 'absolute', 'relative', 'recurring'
    confidence: float


@dataclass
class GermanEntity:
    """German language entity with cultural context"""

    text: str
    entity_type: str
    normalized_value: Any
    confidence: float
    cultural_context: Optional[Dict[str, Any]] = None


class GermanLanguageUtils:
    """
    German Language Processing Utilities for RIX Voice Intelligence

    Features:
    - German text normalization with umlauts and compound words
    - Temporal expression recognition (heute, morgen, nächste Woche)
    - Cultural context awareness (Sie/Du forms, politeness markers)
    - Entity extraction for calendar, tasks, routines, goals, knowledge, news
    - German language characteristics detection
    - Compound word handling and decomposition
    - German grammar pattern recognition
    """

    def __init__(self):
        """Initialize German Language Utils"""
        self.logger = logging.getLogger(__name__)

        # German temporal expressions
        self.temporal_patterns = self._initialize_temporal_patterns()

        # German cultural markers
        self.cultural_markers = self._initialize_cultural_markers()

        # German compound word patterns
        self.compound_patterns = self._initialize_compound_patterns()

        # German grammar patterns
        self.grammar_patterns = self._initialize_grammar_patterns()

        # Performance stats
        self.processing_stats = {
            "normalizations": 0,
            "entity_extractions": 0,
            "temporal_extractions": 0,
            "cultural_detections": 0,
        }

        self.logger.info("German Language Utils initialized")

    def _initialize_temporal_patterns(self) -> Dict[str, Dict[str, Any]]:
        """
        Initialize German temporal expression patterns

        Returns:
            Dictionary of temporal patterns with processing info
        """
        return {
            # Absolute time expressions
            "absolute_dates": {
                "patterns": [
                    r"(?P<day>\d{1,2})\.(?P<month>\d{1,2})\.(?P<year>\d{2,4})",  # 15.03.2024
                    r"(?P<day>\d{1,2})\.\s*(?P<month_name>januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)",  # 15. März
                    r"am\s+(?P<day>\d{1,2})\.(?P<month>\d{1,2})",  # am 15.03
                ],
                "processor": self._process_absolute_date,
            },
            "absolute_times": {
                "patterns": [
                    r"(?P<hour>\d{1,2}):(?P<minute>\d{2})(?:\s*(?P<period>uhr))?",  # 14:30 Uhr
                    r"(?P<hour>\d{1,2})\s*(?P<period>uhr)",  # 14 Uhr
                    r"(?P<hour_word>ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)\s*(?P<period>uhr)",  # drei Uhr
                ],
                "processor": self._process_absolute_time,
            },
            # Relative time expressions
            "relative_dates": {
                "patterns": [
                    r"(?P<relative>heute|heute)",
                    r"(?P<relative>morgen)",
                    r"(?P<relative>übermorgen)",
                    r"(?P<relative>gestern)",
                    r"(?P<relative>vorgestern)",
                    r"(?P<direction>nächste|kommende|diese)\s+(?P<unit>woche|monat|jahr)",
                    r"(?P<direction>letzte|vergangene)\s+(?P<unit>woche|monat|jahr)",
                    r"in\s+(?P<number>\d+|\w+)\s+(?P<unit>tag|tage|tagen|woche|wochen|monat|monaten|jahr|jahren)",
                    r"vor\s+(?P<number>\d+|\w+)\s+(?P<unit>tag|tage|tagen|woche|wochen|monat|monaten|jahr|jahren)",
                ],
                "processor": self._process_relative_date,
            },
            "relative_times": {
                "patterns": [
                    r"(?P<relative>jetzt|sofort|gleich)",
                    r"(?P<relative>später|nachher)",
                    r"(?P<relative>früh|früher)",
                    r"(?P<relative>spät|später)",
                    r"in\s+(?P<number>\d+|\w+)\s+(?P<unit>minute|minuten|stunde|stunden)",
                    r"vor\s+(?P<number>\d+|\w+)\s+(?P<unit>minute|minuten|stunde|stunden)",
                ],
                "processor": self._process_relative_time,
            },
            # Day of week
            "weekdays": {
                "patterns": [
                    r"(?P<weekday>montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)",
                    r"am\s+(?P<weekday>montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)",
                    r"(?P<direction>nächsten|kommenden|diesen)\s+(?P<weekday>montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)",
                ],
                "processor": self._process_weekday,
            },
            # Time periods
            "time_periods": {
                "patterns": [
                    r"(?P<period>morgen|vormittag|mittag|nachmittag|abend|nacht)",
                    r"(?P<period>früh|spät)",
                    r"am\s+(?P<period>morgen|vormittag|mittag|nachmittag|abend)",
                    r"in\s+der\s+(?P<period>nacht|früh)",
                ],
                "processor": self._process_time_period,
            },
        }

    def _initialize_cultural_markers(self) -> Dict[str, List[str]]:
        """
        Initialize German cultural and politeness markers

        Returns:
            Dictionary of cultural markers
        """
        return {
            "formality_high": [
                "sie",
                "ihnen",
                "ihr",
                "ihre",
                "bitte schön",
                "sehr gerne",
                "dürfte ich",
                "könnten sie",
                "würden sie",
                "haben sie die güte",
            ],
            "formality_low": [
                "du",
                "dir",
                "dich",
                "dein",
                "deine",
                "hey",
                "hi",
                "tschüss",
                "mach mal",
                "kannst du",
                "magst du",
            ],
            "politeness_markers": [
                "bitte",
                "danke",
                "entschuldigung",
                "entschuldigen sie",
                "verzeihen sie",
                "tut mir leid",
                "dankeschön",
                "vielen dank",
            ],
            "urgency_markers": [
                "sofort",
                "dringend",
                "eilig",
                "schnell",
                "asap",
                "unverzüglich",
                "umgehend",
                "sofortiger bedarf",
                "höchste priorität",
            ],
            "uncertainty_markers": [
                "vielleicht",
                "möglicherweise",
                "eventuell",
                "wahrscheinlich",
                "ich denke",
                "ich glaube",
                "ich meine",
                "vermutlich",
            ],
        }

    def _initialize_compound_patterns(self) -> Dict[str, str]:
        """
        Initialize German compound word patterns

        Returns:
            Dictionary of compound word patterns
        """
        return {
            # Task-related compounds
            "task_compounds": r"(?:arbeits|haus|büro|projekt)(?:aufgabe|arbeit|termin|meeting)",
            # Calendar-related compounds
            "calendar_compounds": r"(?:termin|meeting|besprechung)(?:kalender|plan|übersicht|liste)",
            # Routine-related compounds
            "routine_compounds": r"(?:morgen|abend|mittag|tages|wochen)(?:routine|programm|ablauf|plan)",
            # Goal-related compounds
            "goal_compounds": r"(?:lebens|jahres|quartals|wochen)(?:ziel|goal|vorhaben|target)",
            # Knowledge-related compounds
            "knowledge_compounds": r"(?:wissens|lern|info|daten)(?:basis|bank|sammlung|speicher)",
            # News-related compounds
            "news_compounds": r"(?:nachrichten|news|tages|welt)(?:überblick|briefing|zusammenfassung|update)",
        }

    def _initialize_grammar_patterns(self) -> Dict[str, str]:
        """
        Initialize German grammar patterns for entity extraction

        Returns:
            Dictionary of grammar patterns
        """
        return {
            # German articles and determiners
            "articles": r"\b(?:der|die|das|ein|eine|einen|einem|einer|eines|den|dem|des)\b",
            # German prepositions for temporal and spatial relations
            "prepositions": r"\b(?:in|an|auf|bei|mit|nach|vor|über|unter|zwischen|während|bis|seit|ab|um|gegen|für|zu|von)\b",
            # German modal verbs
            "modal_verbs": r"\b(?:kann|kannst|können|könnte|könnten|muss|musst|müssen|müsste|müssten|soll|sollst|sollen|sollte|sollten|will|willst|wollen|wollte|wollten|darf|darfst|dürfen|dürfte|dürften|mag|magst|mögen|möchte|möchten)\b",
            # German question words
            "question_words": r"\b(?:wer|was|wann|wo|wie|warum|weshalb|wieso|welche|welcher|welches|womit|wodurch|wofür|wohin|woher)\b",
            # German numbers
            "numbers": r"\b(?:null|eins|ein|eine|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|dreizehn|vierzehn|fünfzehn|sechzehn|siebzehn|achtzehn|neunzehn|zwanzig|\d+)\b",
        }

    async def normalize_text(self, text: str) -> str:
        """
        Normalize German text for processing

        Args:
            text: Raw German text

        Returns:
            Normalized German text
        """
        try:
            self.processing_stats["normalizations"] += 1

            # Convert to lowercase
            normalized = text.lower().strip()

            # Normalize Unicode characters (umlauts, ß)
            normalized = unicodedata.normalize("NFKC", normalized)

            # Fix common German transcription issues
            normalized = await self._fix_transcription_errors(normalized)

            # Normalize compound words
            normalized = await self._normalize_compounds(normalized)

            # Remove extra whitespace
            normalized = re.sub(r"\s+", " ", normalized)

            self.logger.debug(f"Text normalized: '{text}' -> '{normalized}'")

            return normalized

        except Exception as e:
            self.logger.error(f"Text normalization failed: {e}")
            return text.lower().strip()

    async def _fix_transcription_errors(self, text: str) -> str:
        """
        Fix common German transcription errors from speech recognition

        Args:
            text: Text with potential transcription errors

        Returns:
            Text with corrected transcription errors
        """
        corrections = {
            # Umlauts
            "ae": "ä",
            "oe": "ö",
            "ue": "ü",
            "ss": "ß",
            # Common word corrections
            "dass": "das",
            "weiss": "weiß",
            "heiss": "heiß",
            "grosse": "große",
            "strasse": "straße",
            # Articles
            "dass": "das",
            "denn": "den",
            "dem": "dem",
            # Time expressions
            "heute": "heute",
            "morgen": "morgen",
            "gestern": "gestern",
            "naechste": "nächste",
            "letzte": "letzte",
            # Common verbs
            "machen": "machen",
            "gehen": "gehen",
            "kommen": "kommen",
            "haben": "haben",
            "sein": "sein",
            "werden": "werden",
        }

        corrected = text
        for incorrect, correct in corrections.items():
            corrected = re.sub(r"\b" + re.escape(incorrect) + r"\b", correct, corrected)

        return corrected

    async def _normalize_compounds(self, text: str) -> str:
        """
        Normalize German compound words for better matching

        Args:
            text: Text with compound words

        Returns:
            Text with normalized compound words
        """
        # Add spaces in compound words for better pattern matching
        # This is a simplified approach - production would use German morphology

        for compound_type, pattern in self.compound_patterns.items():
            # Find compound words and potentially split them
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                compound = match.group(0)
                # Keep compound but also add spaced version for matching
                # Example: "morgenroutine" -> "morgenroutine morgen routine"
                spaced = re.sub(r"([a-z])([A-Z])", r"\1 \2", compound).lower()
                if spaced != compound:
                    text = text.replace(compound, f"{compound} {spaced}")

        return text

    async def extract_temporal_expressions(self, text: str) -> Dict[str, Any]:
        """
        Extract temporal expressions from German text

        Args:
            text: German text to analyze

        Returns:
            Dictionary of temporal entities
        """
        try:
            self.processing_stats["temporal_extractions"] += 1

            temporal_entities = {}
            expressions = []

            for category, config in self.temporal_patterns.items():
                for pattern in config["patterns"]:
                    matches = re.finditer(pattern, text, re.IGNORECASE)
                    for match in matches:
                        try:
                            # Process the match using the specific processor
                            processed = await config["processor"](match, text)
                            if processed:
                                expressions.append(processed)

                        except Exception as e:
                            self.logger.error(f"Temporal processing failed for {pattern}: {e}")

            # Organize temporal expressions
            if expressions:
                temporal_entities["temporal_expressions"] = expressions
                temporal_entities["has_temporal"] = True
                temporal_entities["temporal_count"] = len(expressions)

                # Extract specific types
                dates = [exp for exp in expressions if exp.time_type in ["absolute", "relative"]]
                times = [exp for exp in expressions if "time" in exp.time_type]

                if dates:
                    temporal_entities["dates"] = dates
                if times:
                    temporal_entities["times"] = times
            else:
                temporal_entities["has_temporal"] = False
                temporal_entities["temporal_count"] = 0

            return temporal_entities

        except Exception as e:
            self.logger.error(f"Temporal extraction failed: {e}")
            return {"has_temporal": False, "temporal_count": 0}

    async def _process_absolute_date(self, match: re.Match, text: str) -> Optional[TemporalExpression]:
        """Process absolute date expressions"""
        try:
            groups = match.groupdict()
            if "day" in groups and "month" in groups:
                day = int(groups["day"])

                if "month_name" in groups and groups["month_name"]:
                    month_names = {
                        "januar": 1,
                        "februar": 2,
                        "märz": 3,
                        "april": 4,
                        "mai": 5,
                        "juni": 6,
                        "juli": 7,
                        "august": 8,
                        "september": 9,
                        "oktober": 10,
                        "november": 11,
                        "dezember": 12,
                    }
                    month = month_names.get(groups["month_name"].lower(), 1)
                else:
                    month = int(groups["month"])

                year = int(groups.get("year", datetime.now().year))
                if year < 100:  # 2-digit year
                    year += 2000 if year < 50 else 1900

                date_obj = datetime(year, month, day)

                return TemporalExpression(
                    text=match.group(0),
                    normalized=date_obj.strftime("%Y-%m-%d"),
                    date_time=date_obj,
                    time_type="absolute",
                    confidence=0.9,
                )
        except (ValueError, KeyError) as e:
            self.logger.debug(f"Date processing failed: {e}")
        return None

    async def _process_absolute_time(self, match: re.Match, text: str) -> Optional[TemporalExpression]:
        """Process absolute time expressions"""
        try:
            groups = match.groupdict()

            if "hour_word" in groups and groups["hour_word"]:
                hour_words = {
                    "ein": 1,
                    "zwei": 2,
                    "drei": 3,
                    "vier": 4,
                    "fünf": 5,
                    "sechs": 6,
                    "sieben": 7,
                    "acht": 8,
                    "neun": 9,
                    "zehn": 10,
                    "elf": 11,
                    "zwölf": 12,
                }
                hour = hour_words.get(groups["hour_word"].lower(), 0)
            else:
                hour = int(groups.get("hour", 0))

            minute = int(groups.get("minute", 0))

            # Create time object
            today = datetime.now().replace(hour=hour, minute=minute, second=0, microsecond=0)

            return TemporalExpression(
                text=match.group(0),
                normalized=today.strftime("%H:%M"),
                date_time=today,
                time_type="absolute_time",
                confidence=0.85,
            )
        except (ValueError, KeyError) as e:
            self.logger.debug(f"Time processing failed: {e}")
        return None

    async def _process_relative_date(self, match: re.Match, text: str) -> Optional[TemporalExpression]:
        """Process relative date expressions"""
        try:
            groups = match.groupdict()
            base_date = datetime.now()

            if "relative" in groups:
                relative = groups["relative"].lower()
                if relative == "heute":
                    target_date = base_date
                elif relative == "morgen":
                    target_date = base_date + timedelta(days=1)
                elif relative == "übermorgen":
                    target_date = base_date + timedelta(days=2)
                elif relative == "gestern":
                    target_date = base_date - timedelta(days=1)
                elif relative == "vorgestern":
                    target_date = base_date - timedelta(days=2)
                else:
                    return None

                return TemporalExpression(
                    text=match.group(0),
                    normalized=target_date.strftime("%Y-%m-%d"),
                    date_time=target_date,
                    time_type="relative",
                    confidence=0.9,
                )

            # Handle "nächste/kommende/diese Woche/Monat/Jahr"
            if "direction" in groups and "unit" in groups:
                direction = groups["direction"].lower()
                unit = groups["unit"].lower()

                if unit == "woche":
                    if direction in ["nächste", "kommende"]:
                        target_date = base_date + timedelta(weeks=1)
                    elif direction == "diese":
                        target_date = base_date
                    else:
                        return None
                elif unit == "monat":
                    if direction in ["nächste", "kommende"]:
                        target_date = base_date.replace(month=base_date.month + 1 if base_date.month < 12 else 1)
                    elif direction == "diese":
                        target_date = base_date
                    else:
                        return None
                else:
                    return None

                return TemporalExpression(
                    text=match.group(0),
                    normalized=target_date.strftime("%Y-%m-%d"),
                    date_time=target_date,
                    time_type="relative",
                    confidence=0.8,
                )

        except Exception as e:
            self.logger.debug(f"Relative date processing failed: {e}")
        return None

    async def _process_relative_time(self, match: re.Match, text: str) -> Optional[TemporalExpression]:
        """Process relative time expressions"""
        try:
            groups = match.groupdict()

            if "relative" in groups:
                relative = groups["relative"].lower()
                if relative in ["jetzt", "sofort", "gleich"]:
                    target_time = datetime.now()
                    confidence = 0.9
                elif relative in ["später", "nachher"]:
                    target_time = datetime.now() + timedelta(hours=2)  # Approximation
                    confidence = 0.6
                else:
                    return None

                return TemporalExpression(
                    text=match.group(0),
                    normalized=target_time.strftime("%H:%M"),
                    date_time=target_time,
                    time_type="relative_time",
                    confidence=confidence,
                )

        except Exception as e:
            self.logger.debug(f"Relative time processing failed: {e}")
        return None

    async def _process_weekday(self, match: re.Match, text: str) -> Optional[TemporalExpression]:
        """Process weekday expressions"""
        try:
            groups = match.groupdict()
            weekday_map = {
                "montag": 0,
                "dienstag": 1,
                "mittwoch": 2,
                "donnerstag": 3,
                "freitag": 4,
                "samstag": 5,
                "sonntag": 6,
            }

            if "weekday" in groups:
                weekday_name = groups["weekday"].lower()
                target_weekday = weekday_map.get(weekday_name)

                if target_weekday is not None:
                    # Calculate next occurrence of this weekday
                    today = datetime.now()
                    days_ahead = target_weekday - today.weekday()
                    if days_ahead <= 0:  # Target day already happened this week
                        days_ahead += 7

                    target_date = today + timedelta(days=days_ahead)

                    return TemporalExpression(
                        text=match.group(0),
                        normalized=target_date.strftime("%Y-%m-%d"),
                        date_time=target_date,
                        time_type="weekday",
                        confidence=0.85,
                    )

        except Exception as e:
            self.logger.debug(f"Weekday processing failed: {e}")
        return None

    async def _process_time_period(self, match: re.Match, text: str) -> Optional[TemporalExpression]:
        """Process time period expressions"""
        try:
            groups = match.groupdict()
            period_map = {
                "morgen": "06:00-12:00",
                "vormittag": "08:00-12:00",
                "mittag": "12:00-14:00",
                "nachmittag": "14:00-18:00",
                "abend": "18:00-22:00",
                "nacht": "22:00-06:00",
            }

            if "period" in groups:
                period = groups["period"].lower()
                time_range = period_map.get(period)

                if time_range:
                    return TemporalExpression(
                        text=match.group(0),
                        normalized=time_range,
                        date_time=None,  # Time range, not specific time
                        time_type="time_period",
                        confidence=0.8,
                    )

        except Exception as e:
            self.logger.debug(f"Time period processing failed: {e}")
        return None

    async def extract_german_entities(self, text: str) -> Dict[str, Any]:
        """
        Extract German-specific entities

        Args:
            text: German text to analyze

        Returns:
            Dictionary of German entities
        """
        try:
            self.processing_stats["entity_extractions"] += 1

            entities = {}

            # Cultural markers
            cultural_info = await self._extract_cultural_markers(text)
            if cultural_info:
                entities.update(cultural_info)

            # Numbers (German style)
            numbers = await self._extract_german_numbers(text)
            if numbers:
                entities["numbers"] = numbers

            # German grammar elements
            grammar_info = await self._extract_grammar_patterns(text)
            if grammar_info:
                entities.update(grammar_info)

            return entities

        except Exception as e:
            self.logger.error(f"German entity extraction failed: {e}")
            return {}

    async def _extract_cultural_markers(self, text: str) -> Dict[str, Any]:
        """Extract German cultural and politeness markers"""
        cultural_info = {}

        # Check formality level
        formal_count = sum(1 for marker in self.cultural_markers["formality_high"] if marker in text.lower())
        informal_count = sum(1 for marker in self.cultural_markers["formality_low"] if marker in text.lower())

        if formal_count > informal_count:
            cultural_info["formality"] = "high"
            cultural_info["formality_confidence"] = formal_count / (formal_count + informal_count)
        elif informal_count > formal_count:
            cultural_info["formality"] = "low"
            cultural_info["formality_confidence"] = informal_count / (formal_count + informal_count)
        else:
            cultural_info["formality"] = "neutral"
            cultural_info["formality_confidence"] = 0.5

        # Check politeness markers
        politeness_markers = [marker for marker in self.cultural_markers["politeness_markers"] if marker in text.lower()]
        if politeness_markers:
            cultural_info["politeness_markers"] = politeness_markers
            cultural_info["politeness_level"] = "high" if len(politeness_markers) > 1 else "medium"

        # Check urgency markers
        urgency_markers = [marker for marker in self.cultural_markers["urgency_markers"] if marker in text.lower()]
        if urgency_markers:
            cultural_info["urgency_markers"] = urgency_markers
            cultural_info["urgency_level"] = "high" if len(urgency_markers) > 1 else "medium"

        self.processing_stats["cultural_detections"] += len(cultural_info)

        return cultural_info

    async def _extract_german_numbers(self, text: str) -> List[Dict[str, Any]]:
        """Extract German number expressions"""
        numbers = []

        # German number words
        number_words = {
            "null": 0,
            "eins": 1,
            "ein": 1,
            "eine": 1,
            "zwei": 2,
            "drei": 3,
            "vier": 4,
            "fünf": 5,
            "sechs": 6,
            "sieben": 7,
            "acht": 8,
            "neun": 9,
            "zehn": 10,
            "elf": 11,
            "zwölf": 12,
            "dreizehn": 13,
            "vierzehn": 14,
            "fünfzehn": 15,
            "sechzehn": 16,
            "siebzehn": 17,
            "achtzehn": 18,
            "neunzehn": 19,
            "zwanzig": 20,
        }

        # Find number words
        for word, value in number_words.items():
            if word in text.lower():
                numbers.append({"text": word, "value": value, "type": "number_word"})

        # Find numeric digits
        digit_matches = re.finditer(r"\b\d+\b", text)
        for match in digit_matches:
            numbers.append({"text": match.group(0), "value": int(match.group(0)), "type": "numeric"})

        return numbers

    async def _extract_grammar_patterns(self, text: str) -> Dict[str, Any]:
        """Extract German grammar patterns"""
        grammar_info = {}

        # Count different grammar elements
        for pattern_type, pattern in self.grammar_patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                grammar_info[f"{pattern_type}_count"] = len(matches)
                grammar_info[f"{pattern_type}_examples"] = matches[:3]  # First 3 examples

        return grammar_info

    # Intent-specific entity extractors
    async def extract_calendar_entities(self, text: str) -> Dict[str, Any]:
        """Extract calendar-specific entities"""
        entities = {}

        # Event types
        event_patterns = {
            "meeting": r"(?:meeting|besprechung|konferenz|call|termin)",
            "appointment": r"(?:termin|arzttermin|zahnarzttermin)",
            "event": r"(?:veranstaltung|event|feier|party)",
            "reminder": r"(?:erinnerung|reminder|notiz)",
        }

        for event_type, pattern in event_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities["event_type"] = event_type
                break

        # Duration indicators
        duration_pattern = r"(?:für|circa|etwa|ungefähr)?\s*(\d+|\w+)\s*(minute|minuten|stunde|stunden|tag|tage)"
        duration_match = re.search(duration_pattern, text, re.IGNORECASE)
        if duration_match:
            entities["duration"] = duration_match.group(0)

        # Location indicators
        location_patterns = [
            r"(?:bei|in|im|am|auf)\s+([A-ZÄÖÜ][a-zäöüß\s]+)",
            r"(?:zoom|teams|skype|webex)",
            r"(?:büro|office|home|homeoffice)",
        ]

        for pattern in location_patterns:
            location_match = re.search(pattern, text, re.IGNORECASE)
            if location_match:
                entities["location"] = location_match.group(0)
                break

        return entities

    async def extract_task_entities(self, text: str) -> Dict[str, Any]:
        """Extract task-specific entities"""
        entities = {}

        # Priority indicators
        priority_patterns = {
            "high": r"(?:dringend|wichtig|eilig|sofort|asap|priorität|urgent)",
            "medium": r"(?:normal|mittel|standard)",
            "low": r"(?:später|irgendwann|niedrig|low)",
        }

        for priority, pattern in priority_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities["priority"] = priority
                break

        # Task categories
        category_patterns = {
            "work": r"(?:arbeit|job|büro|projekt|meeting|besprechung)",
            "personal": r"(?:persönlich|privat|familie|freunde)",
            "health": r"(?:gesundheit|arzt|sport|fitness|medizin)",
            "finance": r"(?:geld|bank|rechnung|steuer|finanzen)",
            "shopping": r"(?:einkaufen|kaufen|bestellen|shopping)",
        }

        for category, pattern in category_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities["category"] = category
                break

        return entities

    async def extract_routine_entities(self, text: str) -> Dict[str, Any]:
        """Extract routine-specific entities"""
        entities = {}

        # Routine types
        routine_patterns = {
            "morning": r"(?:morgen|früh|morgenroutine|wake.*up)",
            "evening": r"(?:abend|nacht|abendroutine|schlafen)",
            "workout": r"(?:sport|fitness|training|workout|joggen|laufen)",
            "meditation": r"(?:meditation|entspannung|achtsamkeit|mindfulness)",
            "work": r"(?:arbeit|büro|arbeitsroutine|produktivität)",
        }

        for routine_type, pattern in routine_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities["routine_type"] = routine_type
                break

        # Completion indicators
        completion_patterns = {
            "completed": r"(?:erledigt|gemacht|fertig|abgeschlossen|geschafft|done)",
            "in_progress": r"(?:dabei|gerade|am machen|in arbeit)",
            "skipped": r"(?:übersprungen|ausgelassen|nicht gemacht|skip)",
        }

        for status, pattern in completion_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities["completion_status"] = status
                break

        return entities

    async def extract_goal_entities(self, text: str) -> Dict[str, Any]:
        """Extract goal-specific entities"""
        entities = {}

        # Goal types
        goal_patterns = {
            "fitness": r"(?:fitness|sport|gewicht|abnehmen|zunehmen|training)",
            "career": r"(?:karriere|beruf|job|arbeit|beförderung|gehalt)",
            "learning": r"(?:lernen|studium|kurs|sprache|skill|fähigkeit)",
            "financial": r"(?:geld|sparen|investition|schulden|finanzen)",
            "personal": r"(?:persönlich|familie|beziehung|freunde|hobby)",
        }

        for goal_type, pattern in goal_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities["goal_type"] = goal_type
                break

        # Progress indicators
        progress_patterns = {
            "good": r"(?:gut|super|toll|perfekt|prima|excellent)",
            "okay": r"(?:okay|geht so|mittel|durchschnitt)",
            "poor": r"(?:schlecht|nicht gut|schwierig|probleme)",
        }

        for progress, pattern in progress_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities["progress_sentiment"] = progress
                break

        return entities

    async def extract_knowledge_entities(self, text: str) -> Dict[str, Any]:
        """Extract knowledge-specific entities"""
        entities = {}

        # Knowledge categories
        category_patterns = {
            "technical": r"(?:technik|technologie|programmierung|software|computer)",
            "business": r"(?:business|geschäft|management|marketing|verkauf)",
            "personal": r"(?:persönlich|leben|tipps|tricks|erfahrung)",
            "academic": r"(?:wissenschaft|forschung|studium|university|akademisch)",
            "creative": r"(?:kreativ|kunst|design|musik|schreiben)",
        }

        for category, pattern in category_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities["knowledge_category"] = category
                break

        # Source indicators
        source_patterns = {
            "book": r"(?:buch|book|lesen|gelesen)",
            "article": r"(?:artikel|article|blog|website)",
            "video": r"(?:video|youtube|tutorial|course)",
            "podcast": r"(?:podcast|hörbuch|audio)",
            "experience": r"(?:erfahrung|gelernt|erlebt|experience)",
        }

        for source, pattern in source_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities["knowledge_source"] = source
                break

        return entities

    async def extract_news_entities(self, text: str) -> Dict[str, Any]:
        """Extract news-specific entities"""
        entities = {}

        # News categories
        category_patterns = {
            "politics": r"(?:politik|regierung|wahl|partei|bundestag)",
            "business": r"(?:wirtschaft|unternehmen|aktien|börse|finanzen)",
            "technology": r"(?:technologie|digital|internet|ki|artificial intelligence)",
            "sports": r"(?:sport|fußball|tennis|olympia|bundesliga)",
            "international": r"(?:international|welt|ausland|global|europa)",
        }

        for category, pattern in category_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities["news_category"] = category
                break

        # Time scope
        scope_patterns = {
            "breaking": r"(?:eilmeldung|breaking|urgent|sofort)",
            "today": r"(?:heute|today|aktuell|jetzt)",
            "weekly": r"(?:woche|weekly|wöchentlich)",
            "summary": r"(?:zusammenfassung|überblick|briefing|summary)",
        }

        for scope, pattern in scope_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities["news_scope"] = scope
                break

        return entities

    async def extract_basic_entities(self, text: str) -> Dict[str, Any]:
        """Extract basic entities for fallback cases"""
        entities = {}

        # Basic sentiment
        sentiment_patterns = {
            "positive": r"(?:gut|super|toll|prima|excellent|perfekt|happy|freude)",
            "negative": r"(?:schlecht|nicht gut|probleme|schwierig|sad|ärger)",
            "neutral": r"(?:okay|geht so|normal|mittel)",
        }

        for sentiment, pattern in sentiment_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities["sentiment"] = sentiment
                break

        # Basic actions
        action_patterns = {
            "create": r"(?:erstellen|anlegen|neu|hinzufügen|machen)",
            "update": r"(?:ändern|update|bearbeiten|anpassen)",
            "delete": r"(?:löschen|entfernen|delete|remove)",
            "query": r"(?:zeigen|anzeigen|suchen|finden|what|was|wie)",
        }

        for action, pattern in action_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities["basic_action"] = action
                break

        return entities

    async def has_german_characteristics(self, text: str) -> bool:
        """
        Check if text has German language characteristics

        Args:
            text: Text to analyze

        Returns:
            True if text appears to be German
        """
        try:
            # German umlauts and ß
            german_chars = re.search(r"[äöüßÄÖÜ]", text)
            if german_chars:
                return True

            # Common German words
            german_words = [
                "der",
                "die",
                "das",
                "und",
                "ist",
                "ich",
                "mit",
                "für",
                "auf",
                "eine",
                "zu",
                "haben",
                "werden",
                "können",
                "soll",
                "aber",
                "wie",
                "was",
                "wenn",
                "oder",
                "auch",
                "noch",
                "nach",
                "über",
            ]

            words_in_text = text.lower().split()
            german_word_count = sum(1 for word in german_words if word in words_in_text)

            # If more than 20% of checked words are German, consider it German
            if len(words_in_text) > 0 and german_word_count / len(words_in_text) > 0.2:
                return True

            # German compound word patterns
            if re.search(self.compound_patterns["task_compounds"], text, re.IGNORECASE):
                return True

            return False

        except Exception as e:
            self.logger.error(f"German characteristics check failed: {e}")
            return False

    async def get_processing_stats(self) -> Dict[str, Any]:
        """Get processing statistics"""
        return {
            "normalizations": self.processing_stats["normalizations"],
            "entity_extractions": self.processing_stats["entity_extractions"],
            "temporal_extractions": self.processing_stats["temporal_extractions"],
            "cultural_detections": self.processing_stats["cultural_detections"],
            "temporal_patterns_count": sum(len(config["patterns"]) for config in self.temporal_patterns.values()),
            "cultural_markers_count": sum(len(markers) for markers in self.cultural_markers.values()),
            "compound_patterns_count": len(self.compound_patterns),
        }

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check"""
        try:
            # Test basic functionality
            test_text = "Erstelle einen Termin für morgen um 14 Uhr"
            normalized = await self.normalize_text(test_text)
            temporal = await self.extract_temporal_expressions(normalized)
            entities = await self.extract_german_entities(normalized)

            return {
                "healthy": True,
                "test_normalization": len(normalized) > 0,
                "test_temporal": temporal.get("has_temporal", False),
                "test_entities": len(entities) > 0,
                "stats": await self.get_processing_stats(),
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return {
                "healthy": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }
