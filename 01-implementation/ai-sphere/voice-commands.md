# Voice Commands Reference

This document outlines the supported voice commands for the RIX AI sphere.

## Wake Words

### Primary Wake Word
- **"Hey RIX"** - Activates voice input and opens the AI interface
- **"RIX"** - Short form activation

### Alternative Wake Words
- **"Assistant"** - Generic activation
- **"Help"** - Context-sensitive assistance

## Core Commands

### Navigation Commands
- **"Go to dashboard"** - Navigate to main dashboard
- **"Open projects"** - Navigate to projects page
- **"Show tasks"** - Navigate to tasks/routines page
- **"Open calendar"** - Navigate to calendar page
- **"Settings"** - Open settings page

### Task Management
- **"Create task [description]"** - Create a new task
- **"Add to-do [description]"** - Create a quick task
- **"Schedule [task] for [time/date]"** - Schedule a task
- **"Mark [task] complete"** - Complete a task
- **"Show my tasks"** - Display current tasks
- **"What's due today?"** - Show today's tasks

### Project Management
- **"Create project [name]"** - Create a new project
- **"Open project [name]"** - Switch to specific project
- **"Project status"** - Show current project health
- **"Update project [name]"** - Update project information

### Calendar & Scheduling
- **"Schedule meeting [description]"** - Create calendar event
- **"What's my schedule?"** - Show today's calendar
- **"Free time today"** - Show available time slots
- **"Block time for [activity]"** - Create time block
- **"Next meeting"** - Show upcoming meeting

### Routine & Habits
- **"Check habits"** - Review habit completion
- **"Mark habit complete"** - Complete habit for today
- **"Routine status"** - Show routine progress
- **"How am I doing?"** - Show routine analytics
- **"Habit coach"** - Get routine optimization suggestions

### Information & Analytics
- **"Daily briefing"** - Get today's summary
- **"Weekly summary"** - Get week overview
- **"Productivity stats"** - Show productivity metrics
- **"Show insights"** - Display AI insights
- **"Progress report"** - Show goal progress

### Quick Actions
- **"Take note [content]"** - Create quick note
- **"Remind me [content] at [time]"** - Set reminder
- **"Set timer [duration]"** - Start timer
- **"What time is it?"** - Show current time
- **"Weather"** - Show weather information

## Context-Aware Commands

### Dashboard Context
When on the dashboard:
- **"Summary"** - Show dashboard summary
- **"Key metrics"** - Highlight important stats
- **"Recent activity"** - Show recent actions
- **"Notifications"** - Show pending notifications

### Project Context
When viewing a project:
- **"Add task"** - Add task to current project
- **"Project health"** - Show project AI health score
- **"Team members"** - Show project collaborators
- **"Milestone status"** - Show milestone progress

### Calendar Context
When on calendar:
- **"Today's schedule"** - Show today's events
- **"Next week"** - Navigate to next week
- **"Find time for [duration]"** - Suggest available slots
- **"Reschedule [event]"** - Move calendar event

### Routine Context
When on routines page:
- **"Today's habits"** - Show habits for today
- **"Streak info"** - Show current streaks
- **"Skip habit [name]"** - Skip habit for today
- **"Habit suggestions"** - Get optimization tips

## Command Patterns

### Natural Language Processing
The system understands various phrasings:

**Creating Tasks:**
- "Create a task to [description]"
- "Add [description] to my todo list"
- "I need to [description]"
- "Remember to [description]"

**Scheduling:**
- "Schedule [event] for [time]"
- "Book [event] at [time]"
- "Put [event] on my calendar for [time]"
- "I have a [event] at [time]"

**Questions:**
- "What's [query]?"
- "Show me [query]"
- "Tell me about [query]"
- "How is [query] going?"

### Time Expressions
Supported time formats:
- **Relative**: "tomorrow", "next week", "in 2 hours"
- **Absolute**: "3 PM", "March 15th", "Monday"
- **Natural**: "this afternoon", "end of day", "next Monday"

### Duration Expressions
Supported duration formats:
- **Minutes**: "15 minutes", "half hour", "45 min"
- **Hours**: "2 hours", "1.5 hours", "all day"
- **Days**: "2 days", "a week", "until Friday"

## Advanced Features

### Multi-Step Commands
- **"Create project called [name] with tasks [task1], [task2], [task3]"**
- **"Schedule daily standup at 9 AM every weekday"**
- **"Block 2 hours every morning for deep work"**

### Conditional Commands
- **"If I don't complete [task] today, reschedule for tomorrow"**
- **"Remind me about [task] only if I haven't done [habit]"**
- **"Set up [routine] but only on weekdays"**

### Batch Operations
- **"Mark all morning habits complete"**
- **"Schedule all pending tasks for this week"**
- **"Show overdue items across all projects"**

## Error Handling

### Ambiguous Commands
When commands are unclear:
- **"Which project did you mean?"**
- **"I found multiple tasks with that name. Which one?"**
- **"Could you be more specific about the time?"**

### Unsupported Commands
When commands aren't recognized:
- **"I don't understand that command yet"**
- **"Try saying 'Help' for available commands"**
- **"You can type your request instead"**

### Permission Required
When commands need confirmation:
- **"This will delete [item]. Are you sure?"**
- **"Should I reschedule [conflicting event]?"**
- **"This will mark [habit] complete for today. Confirm?"**

## Customization

### Personal Commands
Users can create custom voice shortcuts:
- **"Workday start"** → Open projects, check calendar, show tasks
- **"Evening review"** → Show completed tasks, tomorrow's schedule
- **"Weekly planning"** → Open calendar, show project status, review goals

### Context Preferences
Customize responses based on:
- **Time of day**: Different responses for morning vs evening
- **Current activity**: Adapt to active project or current page
- **User habits**: Learn from usage patterns

## Privacy & Security

### Voice Data Handling
- Voice input is processed locally when possible
- No audio is stored unless explicitly saved by user
- Transcripts are encrypted in transit
- User can disable voice features entirely

### Sensitive Information
- Commands involving sensitive data require confirmation
- Financial or personal info is handled with extra care
- User can set privacy levels for different data types

## Troubleshooting

### Common Issues

**Voice not recognized:**
- Check microphone permissions
- Ensure clear pronunciation
- Try shorter, simpler commands
- Use wake word before command

**Wrong action triggered:**
- Use more specific language
- Include context ("in project X", "for tomorrow")
- Use full names instead of abbreviations

**No response:**
- Check browser compatibility
- Verify internet connection
- Try clicking the sphere first
- Use text input as fallback

### Debug Commands
- **"Debug mode on/off"** - Toggle debug information
- **"Show last command"** - Display what was heard
- **"Voice test"** - Test voice recognition
- **"Reset voice"** - Restart voice engine

## Browser Compatibility

### Full Support
- ✅ Chrome 25+
- ✅ Edge 79+
- ✅ Safari 14.1+

### Partial Support
- ⚠️ Firefox (limited)
- ⚠️ Opera (varies)

### Mobile Support
- ✅ iOS Safari
- ✅ Chrome Mobile
- ✅ Samsung Internet

## Tips for Better Recognition

### Speaking Clearly
- Speak at normal pace
- Use clear pronunciation
- Pause briefly after wake word
- Avoid background noise

### Command Structure
- Start with action verb
- Be specific with details
- Use consistent terminology
- Include context when needed

### Best Practices
- Learn the most common commands
- Use text input for complex requests
- Combine voice with visual confirmation
- Practice with simple commands first

## Updates and Improvements

The voice command system is continuously improving:
- New commands added regularly
- Recognition accuracy improvements
- Support for additional languages
- Enhanced natural language understanding

Check the release notes for the latest voice command features and improvements.