# Chat Interface Specifications

## Central Chat Interface Requirements

### Overall Chat Container
- **Primary Focus**: Chat takes 60% of screen width on desktop
- **Background**: var(--card-background) with subtle border
- **Height**: Flexible, min-height: 600px, max-height: calc(100vh - 140px)
- **Border Radius**: 8px consistent with design system
- **Shadow**: Subtle elevation with hover effects

### Chat Header Component
```tsx
// Chat Header Layout
<CardHeader className="flex-shrink-0 border-b border-border-color">
  <div className="flex items-center justify-between">
    <div>
      <CardTitle className="text-xl font-semibold text-primary">
        Chat with RIX
      </CardTitle>
      <CardDescription className="text-text-secondary">
        Your personal AI assistant
      </CardDescription>
    </div>
    <div className="flex gap-2">
      <Button variant="outline" size="icon" title="New Chat">
        <Plus className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" title="Voice Call">
        <Phone className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" title="Settings">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  </div>
</CardHeader>
```

**Specifications:**
- Height: 72px fixed
- Padding: 16px horizontal, 12px vertical
- Border bottom: 1px solid var(--border-color)
- Button group: 3 buttons max, 32px size each
- Title: text-xl, font-semibold
- Description: text-sm, text-secondary

### Message Area Component

#### Message List Container
```tsx
// Message Area Layout
<div className="flex-1 overflow-y-auto p-4 space-y-4">
  {messages.map((message) => (
    <MessageBubble key={message.id} message={message} />
  ))}
  {isTyping && <TypingIndicator />}
</div>
```

**Specifications:**
- **Flex**: flex-1 to take available space
- **Overflow**: overflow-y-auto for scrolling
- **Padding**: 16px all sides
- **Message Spacing**: 16px between messages (space-y-4)
- **Scroll Behavior**: Smooth scroll, auto-scroll to latest message

#### Message Bubble Design

**User Messages (Right-aligned):**
```tsx
<div className="flex justify-end">
  <div className="max-w-[70%] bg-primary text-primary-foreground rounded-lg px-4 py-3">
    <p className="text-sm leading-relaxed">{content}</p>
    <span className="text-xs opacity-75 mt-2 block">
      {formatTime(createdAt)}
    </span>
  </div>
</div>
```

**AI Messages (Left-aligned):**
```tsx
<div className="flex justify-start">
  <div className="max-w-[70%] bg-muted text-foreground rounded-lg px-4 py-3">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary-foreground" />
      </div>
      <span className="text-xs font-medium">RIX</span>
    </div>
    <p className="text-sm leading-relaxed">{content}</p>
    <span className="text-xs text-muted-foreground mt-2 block">
      {formatTime(createdAt)}
    </span>
  </div>
</div>
```

**Message Bubble Specifications:**
- **Max Width**: 70% of container
- **Padding**: 16px horizontal, 12px vertical
- **Border Radius**: 12px (more rounded for bubbles)
- **User Bubble**: var(--primary-blue) background
- **AI Bubble**: var(--card-background) with border
- **Typography**: text-sm, line-height: 1.5
- **Timestamp**: text-xs, muted color

#### Typing Indicator
```tsx
<div className="flex justify-start">
  <div className="bg-muted rounded-lg px-4 py-3">
    <div className="flex items-center gap-1">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
      </div>
      <span className="text-xs text-muted-foreground ml-2">RIX is typing...</span>
    </div>
  </div>
</div>
```

### Input Area Component

#### Input Container Layout
```tsx
<div className="flex-shrink-0 p-4 border-t border-border-color">
  <div className="flex items-center gap-3">
    <VoiceRecorderButton />
    <div className="flex-1 relative">
      <TextInput />
    </div>
    <SendButton />
  </div>
</div>
```

**Specifications:**
- **Fixed Height**: 72px (44px input + 28px padding)
- **Border Top**: 1px solid var(--border-color)
- **Background**: Same as card background
- **Gap**: 12px between elements
- **Padding**: 16px horizontal, 14px vertical

#### Voice Recorder Button
```tsx
<Button
  variant={isRecording ? "destructive" : "outline"}
  size="icon"
  className="w-11 h-11 rounded-full"
  disabled={disabled}
>
  {isRecording ? (
    <Square className="h-5 w-5" />
  ) : (
    <Mic className="h-5 w-5" />
  )}
</Button>
```

**Specifications:**
- **Size**: 44px x 44px (touch-friendly)
- **Shape**: Circular (rounded-full)
- **States**: 
  - Normal: Outline variant with mic icon
  - Recording: Red background with stop icon
  - Disabled: Muted colors
- **Animation**: Subtle pulse when recording

#### Text Input Field
```tsx
<Input
  placeholder="Type your message..."
  value={inputValue}
  onChange={handleInputChange}
  onKeyDown={handleKeyDown}
  className="min-h-[44px] resize-none border-border-color"
  disabled={disabled}
/>
```

**Specifications:**
- **Height**: 44px minimum (auto-expand for longer messages)
- **Placeholder**: "Type your message..."
- **Border**: 1px solid var(--border-color)
- **Border Radius**: 6px
- **Padding**: 12px horizontal, 10px vertical
- **Auto-expand**: Up to 120px max height
- **Enter Key**: Send message (Shift+Enter for new line)

#### Send Button
```tsx
<Button
  size="icon"
  className="w-11 h-11 rounded-full"
  disabled={!inputValue.trim() || disabled}
>
  <Send className="h-5 w-5" />
</Button>
```

**Specifications:**
- **Size**: 44px x 44px
- **Shape**: Circular
- **State**: Disabled when input is empty
- **Color**: Primary blue when active
- **Animation**: Subtle scale on press

## Interactive Features

### Voice Integration
- **Voice Recording**: Hold to record, release to send
- **Voice Feedback**: Visual waveform during recording
- **Speech-to-Text**: Real-time transcription display
- **Voice Commands**: "Hey RIX" wake word support

### Keyboard Shortcuts
- **Enter**: Send message
- **Shift + Enter**: New line
- **Cmd/Ctrl + K**: Focus input
- **Cmd/Ctrl + N**: New conversation
- **Escape**: Cancel current action

### Touch Gestures (Mobile)
- **Swipe Up**: Scroll to latest message
- **Long Press**: Select message for actions
- **Double Tap**: Quick reaction/like
- **Pull to Refresh**: Reload conversation

## Accessibility Features
- **Screen Reader**: Full ARIA labels and descriptions
- **Keyboard Navigation**: Tab order through all interactive elements
- **Focus Indicators**: Clear focus rings on all controls
- **Color Contrast**: WCAG AA compliance for all text
- **Voice Feedback**: Audio confirmation for voice actions

## Performance Optimizations
- **Virtual Scrolling**: For conversations with 100+ messages
- **Message Throttling**: Batch updates to prevent UI lag
- **Image Lazy Loading**: Load images as they enter viewport
- **Debounced Typing**: Delay typing indicator to reduce API calls