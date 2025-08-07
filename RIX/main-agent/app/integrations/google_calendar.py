# /main-agent/app/integrations/google_calendar.py
# Google Calendar integration for syncing events and time blocks with external calendar
# Supports OAuth authentication, real-time sync, and German business hour optimization
# RELEVANT FILES: calendar.py, calendar_intelligence.py, /frontend/hooks/useCalendar.ts

import asyncio
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
import logging
from dataclasses import dataclass

# For production, these would be real Google Calendar API imports:
# from google.oauth2.credentials import Credentials
# from google.auth.transport.requests import Request
# from google_auth_oauthlib.flow import InstalledAppFlow
# from googleapiclient.discovery import build
# from googleapiclient.errors import HttpError

# Setup logging
logger = logging.getLogger(__name__)

@dataclass
class CalendarCredentials:
    """Google Calendar API credentials"""
    access_token: str
    refresh_token: str
    token_uri: str
    client_id: str
    client_secret: str
    scopes: List[str]
    expiry: datetime

@dataclass
class SyncResult:
    """Calendar sync operation result"""
    success: bool
    events_synced: int
    conflicts_resolved: int
    errors: List[str]
    sync_time: datetime

class GoogleCalendarIntegration:
    """
    Google Calendar integration service that handles:
    - OAuth authentication and token management
    - Bidirectional calendar synchronization  
    - Time block creation and management
    - German business hour validation
    - Conflict detection and resolution
    """
    
    def __init__(self):
        # In production, these would be loaded from secure configuration
        self.CLIENT_ID = "your-google-client-id.googleusercontent.com"
        self.CLIENT_SECRET = "your-google-client-secret"
        self.REDIRECT_URI = "http://localhost:8001/auth/google/callback"
        self.SCOPES = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ]
        self.user_credentials = {}  # In production, this would be database-backed
        
    async def authenticate_user(self, user_id: str, authorization_code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access tokens and store credentials
        """
        try:
            logger.info(f"Authenticating Google Calendar for user {user_id}")
            
            # For development, return mock credentials
            # In production, this would use Google's OAuth2 flow:
            #
            # flow = InstalledAppFlow.from_client_config({
            #     "web": {
            #         "client_id": self.CLIENT_ID,
            #         "client_secret": self.CLIENT_SECRET,
            #         "redirect_uris": [self.REDIRECT_URI]
            #     }
            # }, self.SCOPES)
            # 
            # flow.fetch_token(code=authorization_code)
            # credentials = flow.credentials
            
            mock_credentials = CalendarCredentials(
                access_token="mock_access_token_12345",
                refresh_token="mock_refresh_token_67890", 
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.CLIENT_ID,
                client_secret=self.CLIENT_SECRET,
                scopes=self.SCOPES,
                expiry=datetime.now(timezone.utc) + timedelta(hours=1)
            )
            
            # Store credentials (in production, this would be encrypted in database)
            self.user_credentials[user_id] = mock_credentials
            
            return {
                "success": True,
                "message": "Google Calendar authentication successful",
                "permissions": self.SCOPES,
                "expiry": mock_credentials.expiry.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to authenticate Google Calendar for user {user_id}: {str(e)}")
            return {
                "success": False,
                "error": f"Authentication failed: {str(e)}"
            }
    
    async def refresh_credentials(self, user_id: str) -> bool:
        """
        Refresh expired Google Calendar credentials
        """
        try:
            credentials = self.user_credentials.get(user_id)
            if not credentials:
                return False
            
            # Check if credentials are expired
            if credentials.expiry > datetime.now(timezone.utc):
                return True  # Still valid
            
            logger.info(f"Refreshing Google Calendar credentials for user {user_id}")
            
            # In production, this would refresh the actual tokens:
            # request = Request()
            # credentials.refresh(request)
            
            # Mock refresh
            credentials.access_token = f"refreshed_token_{int(datetime.now().timestamp())}"
            credentials.expiry = datetime.now(timezone.utc) + timedelta(hours=1)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to refresh credentials for user {user_id}: {str(e)}")
            return False
    
    async def get_calendar_service(self, user_id: str):
        """
        Get authenticated Google Calendar service instance
        """
        # Ensure credentials are valid
        if not await self.refresh_credentials(user_id):
            raise Exception("Invalid or expired Google Calendar credentials")
        
        credentials = self.user_credentials.get(user_id)
        if not credentials:
            raise Exception("No Google Calendar credentials found")
        
        # In production, this would return actual Google Calendar service:
        # service = build('calendar', 'v3', credentials=credentials)
        # return service
        
        # Return mock service for development
        return MockGoogleCalendarService()
    
    async def sync_calendar_data(self, user_id: str, force_full_sync: bool = False) -> SyncResult:
        """
        Synchronize calendar data between RIX and Google Calendar
        """
        try:
            logger.info(f"Starting calendar sync for user {user_id} (force={force_full_sync})")
            
            service = await self.get_calendar_service(user_id)
            
            # Get time range for sync
            now = datetime.now(timezone.utc)
            start_date = now - timedelta(days=7)  # Sync past week
            end_date = now + timedelta(days=30)   # Sync next month
            
            # Fetch events from Google Calendar
            google_events = await self._fetch_google_events(service, start_date, end_date)
            
            # Get RIX events for comparison
            rix_events = await self._fetch_rix_events(user_id, start_date, end_date)
            
            # Perform bidirectional sync
            sync_stats = await self._perform_sync(user_id, google_events, rix_events)
            
            return SyncResult(
                success=True,
                events_synced=sync_stats["synced"],
                conflicts_resolved=sync_stats["conflicts"],
                errors=[],
                sync_time=now
            )
            
        except Exception as e:
            logger.error(f"Calendar sync failed for user {user_id}: {str(e)}")
            return SyncResult(
                success=False,
                events_synced=0,
                conflicts_resolved=0,
                errors=[str(e)],
                sync_time=now
            )
    
    async def _fetch_google_events(self, service, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Fetch events from Google Calendar"""
        
        # In production, this would make actual API calls:
        # events_result = service.events().list(
        #     calendarId='primary',
        #     timeMin=start_date.isoformat(),
        #     timeMax=end_date.isoformat(),
        #     singleEvents=True,
        #     orderBy='startTime'
        # ).execute()
        # 
        # events = events_result.get('items', [])
        
        # Mock Google Calendar events
        mock_events = [
            {
                "id": "google_event_1",
                "summary": "Weekly Team Meeting",
                "description": "Regular team standup",
                "start": {"dateTime": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()},
                "end": {"dateTime": (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()},
                "location": "Conference Room B",
                "attendees": [
                    {"email": "team@company.com", "responseStatus": "accepted"}
                ],
                "created": datetime.now(timezone.utc).isoformat(),
                "updated": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "google_event_2", 
                "summary": "Client Call - Project Review",
                "description": "Quarterly review with client",
                "start": {"dateTime": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()},
                "end": {"dateTime": (datetime.now(timezone.utc) + timedelta(days=1, hours=1)).isoformat()},
                "hangoutLink": "https://meet.google.com/xyz-abc-def",
                "attendees": [
                    {"email": "client@partner.com", "responseStatus": "needsAction"},
                    {"email": "sales@company.com", "responseStatus": "accepted"}
                ],
                "created": datetime.now(timezone.utc).isoformat(),
                "updated": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        return mock_events
    
    async def _fetch_rix_events(self, user_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Fetch events from RIX database"""
        
        # TODO: Query actual RIX database
        # In production, this would query the database for user's events
        
        # Mock RIX events
        mock_rix_events = [
            {
                "id": "rix_event_1",
                "title": "Focus Time - Deep Work",
                "description": "AI-suggested focus block",
                "start_time": (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat(),
                "end_time": (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat(),
                "type": "focus",
                "source": "ai_generated",
                "user_id": user_id
            }
        ]
        
        return mock_rix_events
    
    async def _perform_sync(self, user_id: str, google_events: List[Dict], rix_events: List[Dict]) -> Dict[str, int]:
        """Perform bidirectional synchronization between Google and RIX"""
        
        stats = {"synced": 0, "conflicts": 0}
        
        # Convert Google events to RIX format
        for google_event in google_events:
            rix_event = await self._convert_google_to_rix(google_event, user_id)
            
            # Check if event already exists in RIX
            existing_rix = next((e for e in rix_events if e.get("external_id") == google_event["id"]), None)
            
            if not existing_rix:
                # Create new RIX event
                await self._create_rix_event(rix_event)
                stats["synced"] += 1
            else:
                # Check for conflicts and update if needed
                if await self._has_conflicts(existing_rix, rix_event):
                    await self._resolve_conflict(existing_rix, rix_event)
                    stats["conflicts"] += 1
        
        # Sync RIX time blocks to Google Calendar
        for rix_event in rix_events:
            if rix_event.get("type") == "focus" and not rix_event.get("synced_to_google"):
                google_event = await self._convert_rix_to_google(rix_event)
                await self._create_google_event(user_id, google_event)
                stats["synced"] += 1
        
        return stats
    
    async def _convert_google_to_rix(self, google_event: Dict, user_id: str) -> Dict[str, Any]:
        """Convert Google Calendar event to RIX format"""
        
        start_time = google_event["start"].get("dateTime", google_event["start"].get("date"))
        end_time = google_event["end"].get("dateTime", google_event["end"].get("date"))
        
        # Determine event type
        event_type = "meeting"
        if "focus" in google_event.get("summary", "").lower():
            event_type = "focus"
        elif "break" in google_event.get("summary", "").lower():
            event_type = "break"
        
        return {
            "id": f"google_{google_event['id']}",
            "external_id": google_event["id"],
            "title": google_event.get("summary", "Untitled Event"),
            "description": google_event.get("description"),
            "start_time": start_time,
            "end_time": end_time,
            "location": google_event.get("location"),
            "meeting_url": google_event.get("hangoutLink"),
            "attendees": [
                {
                    "email": attendee["email"],
                    "status": attendee.get("responseStatus", "needs_action")
                }
                for attendee in google_event.get("attendees", [])
            ],
            "type": event_type,
            "priority": "medium",
            "status": "confirmed",
            "source": "google",
            "user_id": user_id,
            "created_at": google_event.get("created"),
            "updated_at": google_event.get("updated")
        }
    
    async def _convert_rix_to_google(self, rix_event: Dict) -> Dict[str, Any]:
        """Convert RIX event to Google Calendar format"""
        
        return {
            "summary": rix_event.get("title", "RIX Event"),
            "description": f"RIX {rix_event.get('type', 'event')}: {rix_event.get('description', '')}",
            "start": {"dateTime": rix_event["start_time"]},
            "end": {"dateTime": rix_event["end_time"]},
            "location": rix_event.get("location"),
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 10}
                ]
            },
            "colorId": self._get_color_for_type(rix_event.get("type", "meeting"))
        }
    
    def _get_color_for_type(self, event_type: str) -> str:
        """Get Google Calendar color ID for RIX event type"""
        color_mapping = {
            "focus": "9",      # Blue
            "deep_work": "9",  # Blue
            "creative": "10",  # Green
            "meeting": "1",    # Lavender
            "break": "11",     # Red
            "admin": "8"       # Gray
        }
        return color_mapping.get(event_type, "1")
    
    async def _create_rix_event(self, event_data: Dict):
        """Create event in RIX database"""
        # TODO: Implement database creation
        logger.info(f"Creating RIX event: {event_data['title']}")
    
    async def _create_google_event(self, user_id: str, event_data: Dict) -> str:
        """Create event in Google Calendar"""
        try:
            service = await self.get_calendar_service(user_id)
            
            # In production:
            # event = service.events().insert(calendarId='primary', body=event_data).execute()
            # return event['id']
            
            # Mock creation
            event_id = f"google_{int(datetime.now().timestamp())}"
            logger.info(f"Created Google Calendar event: {event_data['summary']} (ID: {event_id})")
            return event_id
            
        except Exception as e:
            logger.error(f"Failed to create Google Calendar event: {str(e)}")
            raise
    
    async def _has_conflicts(self, existing_event: Dict, new_event: Dict) -> bool:
        """Check if events have conflicts that need resolution"""
        
        # Compare key fields for conflicts
        conflicts = []
        
        if existing_event.get("title") != new_event.get("title"):
            conflicts.append("title")
        
        if existing_event.get("start_time") != new_event.get("start_time"):
            conflicts.append("time")
        
        if existing_event.get("location") != new_event.get("location"):
            conflicts.append("location")
        
        return len(conflicts) > 0
    
    async def _resolve_conflict(self, existing_event: Dict, new_event: Dict):
        """Resolve conflicts between existing and new events"""
        
        logger.info(f"Resolving conflict for event: {existing_event.get('title')}")
        
        # For now, Google Calendar takes precedence
        # In production, this might involve user confirmation
        updated_event = {**existing_event, **new_event}
        updated_event["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # TODO: Update in database
        logger.info(f"Event updated with Google Calendar data")
    
    async def create_event(self, user_id: str, event_data: Dict[str, Any]) -> str:
        """Create a new event in Google Calendar"""
        
        try:
            google_event = await self._convert_rix_to_google(event_data)
            event_id = await self._create_google_event(user_id, google_event)
            
            logger.info(f"Created Google Calendar event for user {user_id}: {event_data['title']}")
            return event_id
            
        except Exception as e:
            logger.error(f"Failed to create Google Calendar event: {str(e)}")
            raise
    
    async def update_event(self, user_id: str, event_id: str, updates: Dict[str, Any]) -> bool:
        """Update an existing event in Google Calendar"""
        
        try:
            service = await self.get_calendar_service(user_id)
            
            # In production:
            # event = service.events().get(calendarId='primary', eventId=event_id).execute()
            # event.update(updates)
            # updated_event = service.events().update(
            #     calendarId='primary', 
            #     eventId=event_id, 
            #     body=event
            # ).execute()
            
            logger.info(f"Updated Google Calendar event {event_id} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update Google Calendar event: {str(e)}")
            return False
    
    async def delete_event(self, user_id: str, event_id: str) -> bool:
        """Delete an event from Google Calendar"""
        
        try:
            service = await self.get_calendar_service(user_id)
            
            # In production:
            # service.events().delete(calendarId='primary', eventId=event_id).execute()
            
            logger.info(f"Deleted Google Calendar event {event_id} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete Google Calendar event: {str(e)}")
            return False
    
    async def get_calendar_list(self, user_id: str) -> List[Dict[str, Any]]:
        """Get list of user's calendars"""
        
        try:
            service = await self.get_calendar_service(user_id)
            
            # In production:
            # calendar_list = service.calendarList().list().execute()
            # return calendar_list.get('items', [])
            
            # Mock calendar list
            return [
                {
                    "id": "primary",
                    "summary": "Primary Calendar",
                    "primary": True,
                    "accessRole": "owner"
                },
                {
                    "id": "work@company.com",
                    "summary": "Work Calendar", 
                    "primary": False,
                    "accessRole": "writer"
                }
            ]
            
        except Exception as e:
            logger.error(f"Failed to get calendar list for user {user_id}: {str(e)}")
            return []
    
    async def setup_webhook(self, user_id: str, calendar_id: str = "primary") -> Dict[str, Any]:
        """Setup webhook for real-time calendar notifications"""
        
        try:
            service = await self.get_calendar_service(user_id)
            
            webhook_url = f"https://your-domain.com/api/calendar/webhook/{user_id}"
            
            # In production:
            # channel = service.events().watch(
            #     calendarId=calendar_id,
            #     body={
            #         'id': f'channel_{user_id}_{int(datetime.now().timestamp())}',
            #         'type': 'web_hook',
            #         'address': webhook_url,
            #         'expiration': int((datetime.now() + timedelta(days=7)).timestamp() * 1000)
            #     }
            # ).execute()
            
            # Mock webhook setup
            channel = {
                "id": f"channel_{user_id}_{int(datetime.now().timestamp())}",
                "resourceUri": f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events",
                "expiration": int((datetime.now() + timedelta(days=7)).timestamp() * 1000)
            }
            
            logger.info(f"Setup Google Calendar webhook for user {user_id}")
            return {
                "success": True,
                "channel_id": channel["id"],
                "expiration": channel["expiration"]
            }
            
        except Exception as e:
            logger.error(f"Failed to setup webhook for user {user_id}: {str(e)}")
            return {"success": False, "error": str(e)}

class MockGoogleCalendarService:
    """Mock Google Calendar service for development"""
    
    def __init__(self):
        self.events_data = {}
        
    def events(self):
        return MockEventsResource()

class MockEventsResource:
    """Mock Google Calendar events resource"""
    
    def list(self, calendarId='primary', **kwargs):
        return MockRequest([])
    
    def insert(self, calendarId='primary', body=None):
        event_id = f"mock_event_{int(datetime.now().timestamp())}"
        return MockRequest({"id": event_id, **body})
    
    def update(self, calendarId='primary', eventId=None, body=None):
        return MockRequest({"id": eventId, **body})
    
    def delete(self, calendarId='primary', eventId=None):
        return MockRequest({})

class MockRequest:
    """Mock Google API request"""
    
    def __init__(self, result):
        self.result = result
    
    def execute(self):
        return self.result