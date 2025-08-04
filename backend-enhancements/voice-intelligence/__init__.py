# /Users/benediktthomas/RIX Personal Agent/backend-enhancements/voice-intelligence/__init__.py
# RIX Voice Intelligence Phase 1 - Enhanced Voice Processor Foundation
# German language optimized voice processing with Whisper integration and session management
# RELEVANT FILES: enhanced_voice_processor.py, voice_session_manager.py, audio_utils.py, voice.py

"""
RIX Voice Intelligence Phase 1 - Enhanced Voice Processor Foundation

This package provides the foundation for RIX Voice Intelligence with German language
optimization, session management, and performance-optimized audio processing.

Components:
- EnhancedVoiceProcessor: Core voice processing with German intelligence
- VoiceSessionManager: Session-based audio chunk management
- AudioUtils: Audio format conversion and optimization utilities
- Voice API: FastAPI endpoints for voice processing integration

Features:
- German language optimized transcription with Whisper
- Session-based multi-chunk audio processing
- Performance target: <3 seconds processing time
- Comprehensive error handling and fallbacks
- Database integration ready for future phases
- Modular design for easy extension

Usage:
    from voice_intelligence import EnhancedVoiceProcessor, VoiceSessionManager
    
    processor = EnhancedVoiceProcessor(
        openai_api_key="your-key",
        target_language="de"
    )
    
    result = await processor.process_voice_input(
        user_id="user123",
        audio_data=audio_bytes
    )
"""

from .audio_utils import AudioUtils
from .enhanced_voice_processor import EnhancedVoiceProcessor
from .voice_session_manager import VoiceSessionManager

__version__ = "1.0.0"
__author__ = "RIX Development Team"
__description__ = "RIX Voice Intelligence Phase 1 - Enhanced Voice Processor Foundation"

__all__ = [
    "EnhancedVoiceProcessor",
    "VoiceSessionManager",
    "AudioUtils",
]

# Package configuration
PHASE = 1
TARGET_LANGUAGE = "de"  # German
PERFORMANCE_TARGET_SECONDS = 3.0
SUPPORTED_LANGUAGES = ["de", "en", "auto"]

# Integration notes for future phases
FUTURE_PHASES = {
    2: "Intent Classification and Context Understanding",
    3: "MCP Router Integration and Workflow Triggering",
    4: "Advanced German NLP and Conversational AI",
    5: "Multi-modal Voice Intelligence Integration",
}
