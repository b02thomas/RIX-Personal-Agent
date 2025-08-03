# Second Brain User Flows
# /docs/ux/second-brain-user-flows.md  
# Comprehensive user journey mapping for Projects with AI, Smart Calendar, Routines with coaching, Intelligence Overview
# This document defines core user flows for the RIX Personal Agent Second Brain functionality
# RELEVANT FILES: src/app/dashboard/voice/page.tsx, src/store/chat-store.ts, src/components/chat/chat-container.tsx, src/app/dashboard/page.tsx

## Executive Summary

This document maps the essential user flows for RIX's Second Brain functionality, focusing on the four core feature areas specified in the locked scope: **Projects with AI**, **Smart Calendar**, **Routines with coaching**, and **Intelligence Overview**. Each flow is designed to minimize cognitive load while maximizing the AI-assisted productivity experience.

### Key Flow Principles
1. **Seamless Context Switching**: Users move fluidly between projects, routines, and intelligence insights
2. **AI-First Interactions**: Every major action leverages the N8N MCP endpoints for intelligent assistance
3. **Progressive Disclosure**: Complex features are revealed gradually based on user engagement
4. **Mobile-Optimized**: All flows work effectively on mobile devices with PWA capabilities

## Core User Journey Overview

### Primary User Personas

**The Focused Professional**
- **Goals**: Organize multiple projects, maintain consistent routines, stay informed
- **Pain Points**: Context switching, routine maintenance, information overload
- **Preferred Interactions**: Quick capture, voice commands, automated organization

**The Strategic Thinker**
- **Goals**: Connect insights across projects, track long-term progress, make data-driven decisions
- **Pain Points**: Fragmented information, lack of progress visibility, decision paralysis
- **Preferred Interactions**: Visual dashboards, trend analysis, cross-project connections

## Flow 1: Project Creation & AI-Assisted Setup

### User Story
*"As a user, I want to create a new project and have AI help me structure it with minimal manual input."*

### Flow Steps

#### 1. Project Initiation (Entry Points)
```
Entry Point A: Sidebar → "Quick Actions" → "New Project"
Entry Point B: Projects Section → "+ Add Project" 
Entry Point C: Voice Command → "Create a new project for [topic]"
Entry Point D: Quick Capture → Smart categorization suggests project creation
```

#### 2. AI-Powered Project Setup Flow
```
Step 1: Project Prompt
┌─────────────────────────────────────────┐
│ 🎯 Create New Project                   │
│                                         │
│ Tell me about your project:             │
│ ┌─────────────────────────────────────┐ │
│ │ [Text Area with AI suggestions]     │ │
│ │ e.g., "Website redesign for client" │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Or choose template:                     │
│ [Marketing Campaign] [Product Launch]   │
│ [Research Project] [Personal Goal]      │
│                                         │
│ [Continue with AI Setup] [Skip Setup]   │
└─────────────────────────────────────────┘

Step 2: AI Analysis & Suggestions (N8N MCP Processing)
┌─────────────────────────────────────────┐
│ 🤖 AI is analyzing your project...      │
│                                         │
│ Suggested structure:                    │
│ ✓ Project Timeline (3 phases)          │
│ ✓ Key Milestones (5 identified)        │
│ ✓ Related Routines (Daily standup)     │
│ ✓ Success Metrics (Traffic increase)   │
│                                         │
│ [Customize] [Accept All] [Manual Setup] │
└─────────────────────────────────────────┘

Step 3: Project Dashboard Created
┌─────────────────────────────────────────┐
│ 📁 Website Redesign Project             │
│                                         │
│ Phase 1: Discovery & Planning           │
│ ⏰ Due: Aug 15 │ 📊 Progress: 0%       │
│                                         │
│ Quick Actions:                          │
│ [+ Add Task] [📅 Schedule] [💬 AI Chat] │
│                                         │
│ Smart Suggestions:                      │
│ • Schedule client interview             │
│ • Research competitor sites             │
│ • Create wireframe templates           │
└─────────────────────────────────────────┘
```

#### 3. Success Metrics
- **Time to Project Creation**: <2 minutes from initiation to active project
- **AI Suggestion Adoption**: >70% of users accept at least one AI suggestion
- **Project Engagement**: Users interact with project within 24 hours of creation

### Technical Implementation Notes
- **MCP Endpoint**: `/mcp/project-chatbot` for AI analysis and suggestions
- **State Management**: New `projectStore` to manage project state
- **Navigation**: Dynamic project appears in sidebar immediately
- **Offline Support**: Basic project creation works offline, AI features sync when online

## Flow 2: Smart Calendar Intelligence Integration

### User Story
*"As a user, I want my calendar to intelligently understand my projects and routines, automatically suggesting optimal scheduling."*

### Flow Steps

#### 1. Calendar Context Awareness
```
Smart Calendar Interface:
┌─────────────────────────────────────────┐
│ 📅 Smart Calendar - Aug 2025           │
│                                         │
│ Today's AI Insights:                    │
│ 🎯 Project deadlines approaching (2)   │
│ 🔄 Routine health: 85% completion      │
│ ⚡ Energy prediction: High (morning)   │
│                                         │
│ Suggested Focus Time:                   │
│ 9:00-11:00 AM │ Website Redesign       │
│ 2:00-3:00 PM  │ Client Research        │
│                                         │
│ [Accept All] [Customize] [Manual View]  │
└─────────────────────────────────────────┘
```

#### 2. Intelligent Event Creation Flow
```
Step 1: Voice/Text Input
User: "Schedule time to work on the website redesign project"

Step 2: AI Context Processing (N8N MCP)
┌─────────────────────────────────────────┐
│ 🤖 AI Understanding...                  │
│                                         │
│ Project: Website Redesign ✓             │
│ Current Phase: Discovery & Planning     │
│ Available Time Slots:                   │
│                                         │
│ Option 1: Tomorrow 9:00-11:00 AM       │
│ • High energy period                   │
│ • No conflicts                         │
│ • Optimal for creative work            │
│                                         │
│ Option 2: Today 3:00-4:30 PM           │
│ • Medium energy                        │
│ • Buffer time available                │
│                                         │
│ [Select Option 1] [Select Option 2]     │
│ [See More Options] [Custom Time]        │
└─────────────────────────────────────────┘

Step 3: Event Creation with Context
┌─────────────────────────────────────────┐
│ ✓ Calendar Event Created                │
│                                         │
│ 📅 Website Redesign Work Session        │
│ Tomorrow 9:00-11:00 AM                  │
│                                         │
│ AI-Generated Agenda:                    │
│ • Review discovery notes (15 min)      │
│ • Competitor analysis (45 min)         │
│ • Initial wireframe sketches (60 min)  │
│                                         │
│ Pre-session prep reminder set for 8:45 AM │
│ Project materials will be ready         │
│                                         │
│ [View in Calendar] [Edit Event]         │
└─────────────────────────────────────────┘
```

#### 3. Routine Integration Flow
```
Daily Routine Check-in:
┌─────────────────────────────────────────┐
│ 🌅 Morning Routine - 7:00 AM           │
│                                         │
│ Today's Schedule Preview:               │
│ • 9:00 AM - Website Design Work        │
│ • 2:00 PM - Client Meeting (Prep needed)│
│ • 6:00 PM - Evening Routine            │
│                                         │
│ AI Coaching Insight:                    │
│ "You have a design session today. Consider │
│ reviewing yesterday's notes during your    │
│ commute for better flow state."            │
│                                         │
│ [Mark Complete] [Snooze 15min]          │
└─────────────────────────────────────────┘
```

### Technical Implementation Notes
- **MCP Endpoint**: `/mcp/calendar-intelligence` for smart scheduling
- **Integration**: Bidirectional sync with project and routine data
- **Permissions**: Calendar access with user consent
- **Offline Capability**: View-only mode offline, sync when connected

## Flow 3: Routines with AI Coaching

### User Story
*"As a user, I want intelligent coaching that helps me build and maintain routines that align with my projects and goals."*

### Flow Steps

#### 1. Routine Creation & Personalization
```
Routine Setup Flow:
┌─────────────────────────────────────────┐
│ 🔄 Create New Routine                   │
│                                         │
│ What routine would you like to build?   │
│ ┌─────────────────────────────────────┐ │
│ │ Morning productivity routine        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Templates available:                    │
│ [Morning Focus] [Evening Reflection]    │
│ [Project Review] [Weekly Planning]      │
│                                         │
│ [Start with AI] [Build from scratch]    │
└─────────────────────────────────────────┘

AI-Powered Routine Building:
┌─────────────────────────────────────────┐
│ 🤖 Building your routine...             │
│                                         │
│ Based on your projects and goals:       │
│                                         │
│ 🌅 Morning Productivity Routine         │
│ ⏰ Suggested time: 7:00-8:30 AM         │
│                                         │
│ Recommended steps:                      │
│ 1. Project priority review (10 min)    │
│ 2. Daily goal setting (5 min)          │
│ 3. Energy check-in (5 min)             │
│ 4. Focus time preparation (10 min)     │
│                                         │
│ [Customize Steps] [Set Reminders]       │
│ [Start Today] [Schedule for Tomorrow]   │
└─────────────────────────────────────────┘
```

#### 2. Daily Routine Execution with Coaching
```
Active Routine Session:
┌─────────────────────────────────────────┐
│ 🔄 Morning Routine - Step 2/4          │
│                                         │
│ ✓ Project priority review (completed)  │
│ → Daily goal setting (current)         │
│   Energy check-in                      │
│   Focus time preparation               │
│                                         │
│ Today's Goal Setting:                  │
│ Top 3 priorities for today:            │
│ 1. [                                ] │
│ 2. [                                ] │
│ 3. [                                ] │
│                                         │
│ 🤖 AI Suggestion:                       │
│ "Consider focusing on website wireframes │
│ this morning - your energy is typically │
│ highest for creative work at this time." │
│                                         │
│ [Next Step] [Skip] [Need Help]          │
└─────────────────────────────────────────┘

Weekly Coaching Check-in:
┌─────────────────────────────────────────┐
│ 📊 Routine Performance - Week 32        │
│                                         │
│ Morning Routine Completion: 85%         │
│ ████████▓▓ 6/7 days                     │
│                                         │
│ 🎯 Improvement Insights:                │
│ • You're most consistent on Mon-Wed     │
│ • Friday mornings need attention        │
│ • Goal-setting step provides 23% boost │
│   to daily productivity                 │
│                                         │
│ 🤖 Coaching Recommendation:             │
│ "Try preparing Friday goals on Thursday │
│ evening to reduce morning friction."    │
│                                         │
│ [Apply Suggestion] [Customize Routine]  │
│ [View Detailed Analytics]               │
└─────────────────────────────────────────┘
```

### Technical Implementation Notes
- **MCP Endpoint**: `/mcp/analytics-learning` for coaching insights
- **Data Tracking**: Completion rates, timing patterns, correlation analysis
- **Personalization**: ML-driven recommendations based on user behavior
- **Notifications**: Smart reminders based on optimal timing analysis

## Flow 4: Intelligence Overview Dashboard

### User Story
*"As a user, I want a comprehensive overview of my projects, routines, and productivity patterns with actionable AI insights."*

### Flow Steps

#### 1. Dashboard Landing Experience
```
Intelligence Overview:
┌─────────────────────────────────────────┐
│ 🤖 Intelligence Overview - Today        │
│                                         │
│ 📊 Productivity Score: 87/100          │
│ ████████▓▓ Excellent momentum          │
│                                         │
│ 🎯 Active Projects (3)                 │
│ ├─ Website Redesign      ░░░░░█ 65%    │
│ ├─ Marketing Campaign    ░░█░░░ 25%    │
│ └─ Team Onboarding      ░░░░░░ 5%     │
│                                         │
│ 🔄 Routine Health: 85%                 │
│ Morning: ✓ Evening: ✓ Weekly: ⚠       │
│                                         │
│ 💡 AI Insights (2 new):                │
│ • Focus time optimization opportunity  │
│ • Cross-project skill synergy detected │
│                                         │
│ [View Insights] [Weekly Report]         │
└─────────────────────────────────────────┘
```

#### 2. Deep Insights Exploration
```
AI Insight Detail View:
┌─────────────────────────────────────────┐
│ 💡 Focus Time Optimization              │
│                                         │
│ 📈 Pattern Analysis:                    │
│ Your most productive hours are 9-11 AM │
│ when working on creative tasks.         │
│                                         │
│ Current utilization: 60%                │
│ Optimization potential: +35% output     │
│                                         │
│ 🎯 Recommended Actions:                 │
│ 1. Block 9-11 AM for website design    │
│ 2. Move admin tasks to 2-4 PM          │
│ 3. Set "deep work" mode notifications  │
│                                         │
│ Expected impact:                        │
│ • 2.5 hours saved per week             │
│ • 35% faster project completion        │
│                                         │
│ [Apply Recommendations] [Customize]     │
│ [See Supporting Data] [Dismiss]         │
└─────────────────────────────────────────┘

Cross-Project Synergy:
┌─────────────────────────────────────────┐
│ 🔗 Skill Synergy Detected              │
│                                         │
│ Projects with overlapping skills:       │
│ Website Redesign ↔ Marketing Campaign   │
│                                         │
│ Shared elements:                        │
│ • Visual design principles             │
│ • User experience research             │
│ • Brand consistency requirements       │
│                                         │
│ 💡 Opportunity:                         │
│ Batch similar tasks to improve flow     │
│ and maintain design consistency.        │
│                                         │
│ Suggested workflow:                     │
│ 1. Complete UX research for both       │
│ 2. Create unified visual system        │
│ 3. Apply designs to both projects      │
│                                         │
│ [Create Linked Tasks] [View Details]    │
└─────────────────────────────────────────┘
```

#### 3. Weekly Intelligence Report
```
Weekly Intelligence Summary:
┌─────────────────────────────────────────┐
│ 📊 Week 32 Intelligence Report          │
│                                         │
│ 🎯 Achievement Highlights:              │
│ • Website project advanced 40%         │
│ • Morning routines: 6/7 completion     │
│ • 15.5 hours of focused work time      │
│                                         │
│ 📈 Performance Trends:                  │
│ Productivity: ↑ 12% vs last week       │
│ Routine consistency: ↑ 5%              │
│ Project velocity: ↑ 20%                │
│                                         │
│ 🚀 Next Week Optimization:             │
│ 1. Extend morning focus blocks         │
│ 2. Schedule marketing campaign kickoff │
│ 3. Add Friday reflection routine       │
│                                         │
│ [View Full Report] [Set Next Week]      │
│ [Share Progress] [Archive Report]       │
└─────────────────────────────────────────┘
```

### Technical Implementation Notes
- **MCP Endpoint**: `/mcp/analytics-learning` for intelligence processing
- **Data Sources**: Projects, routines, calendar events, completion rates
- **Visualization**: Chart.js or D3.js for interactive data displays
- **Export**: PDF reports for sharing and archiving

## Cross-Flow Integration Points

### Universal Quick Capture
Available from any screen via floating action button or keyboard shortcut:
```
Quick Capture Overlay:
┌─────────────────────────────────────────┐
│ ⚡ Quick Capture                        │
│                                         │
│ [Voice] [Text] [Photo] [Link]           │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Capture your thought, task, or      │ │
│ │ idea here...                        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 🤖 AI will categorize and route this   │
│ to the right project or routine.        │
│                                         │
│ [Capture] [Cancel]                      │
└─────────────────────────────────────────┘
```

### Context Switching
Seamless navigation between related items:
- Project → Related routines → Calendar events
- Routine → Connected projects → Performance insights
- Calendar → Project context → Routine reminders
- Intelligence → Specific projects → Actionable routines

## Success Metrics & KPIs

### User Engagement Metrics
- **Daily Active Usage**: >80% of registered users engage daily
- **Feature Adoption**: >60% use at least 3 of 4 core features weekly
- **Session Duration**: Average 15+ minutes per session
- **Return Rate**: >90% return within 48 hours of first use

### Effectiveness Metrics
- **Project Completion**: 40% faster completion vs traditional tools
- **Routine Adherence**: >75% consistency after 30 days
- **Calendar Optimization**: 25% reduction in scheduling conflicts
- **Decision Speed**: 50% faster decision-making with AI insights

### User Satisfaction Metrics
- **NPS Score**: >50 (industry benchmark for productivity tools)
- **Feature Usefulness**: >4.0/5.0 rating for each core feature
- **Recommendation Rate**: >70% would recommend to colleagues
- **Support Tickets**: <5% of users contact support monthly

---

**Document Status**: Phase 1 Complete - Core flows defined and ready for development
**Last Updated**: 2025-08-02  
**Next Review**: Before Phase 2 implementation begins