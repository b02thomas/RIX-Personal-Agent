# AI Sphere Integration Guide

This guide explains how to integrate the floating AI sphere into the RIX dashboard layout.

## Integration Steps

### 1. Add CSS Import to Global Styles

Add the sphere animations CSS to your global stylesheet:

```css
/* In your global CSS file (e.g., globals.css or app.css) */
@import './01-implementation/ai-sphere/sphere-animations.css';
```

### 2. Update Root Layout Component

Add the FloatingAISphere to your main layout component:

```tsx
// In app/layout.tsx or your main layout component
import { FloatingAISphere } from '@/01-implementation/ai-sphere/FloatingAISphere';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Your existing layout content */}
        <main>{children}</main>
        
        {/* Add FloatingAISphere at the end */}
        <FloatingAISphere />
      </body>
    </html>
  );
}
```

### 3. Alternative: Page-Level Integration

If you prefer to add the sphere only on specific pages:

```tsx
// In specific page components
import { FloatingAISphere } from '@/01-implementation/ai-sphere/FloatingAISphere';

export default function DashboardPage() {
  return (
    <div className="page-container">
      {/* Your page content */}
      <FloatingAISphere />
    </div>
  );
}
```

### 4. Configure Positioning

The sphere is positioned using CSS fixed positioning and will automatically:
- Stay in the bottom-right corner
- Adjust position on mobile to avoid bottom navigation
- Not interfere with the sidebar or chat interface

### 5. Customization Options

You can customize the sphere behavior:

```tsx
<FloatingAISphere 
  className="custom-sphere-styles"
  disabled={false}
/>
```

## CSS Variables Setup

Ensure these CSS variables are defined in your design system:

```css
:root {
  --primary-blue: #0066FF;
  --primary-blue-dark: #0052CC;
  --background-dark: #0F1115;
  --card-background: #1A1D23;
  --border-color: #2D3748;
  --text-primary: #FFFFFF;
  --text-secondary: #A0AEC0;
}
```

## Dependencies

The sphere components require these dependencies:
- `lucide-react` for icons
- `next/dynamic` for code splitting
- `next/navigation` for pathname detection
- Your existing `cn` utility function

## Browser Support

### Web Speech API
Voice input requires browser support for the Web Speech API:
- ✅ Chrome/Edge (full support)
- ✅ Safari (partial support)
- ❌ Firefox (limited support)
- ✅ Mobile browsers (varies)

The component gracefully degrades when speech recognition is not available.

## Performance Considerations

1. **Dynamic Imports**: Icons are loaded dynamically to reduce initial bundle size
2. **Hardware Acceleration**: Animations use `transform` and `opacity` for 60fps performance
3. **Event Listeners**: Properly cleaned up to prevent memory leaks
4. **Debounced Actions**: Voice input includes debouncing for better UX

## Accessibility Features

- **WCAG 2.1 AA Compliant**: Proper contrast ratios and focus indicators
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Touch Targets**: 44px minimum touch target size on mobile
- **Reduced Motion**: Respects `prefers-reduced-motion` setting

## Testing

### Unit Tests
Test the sphere components:

```bash
# Test sphere functionality
npm run test -- FloatingAISphere
npm run test -- AIBubbleInterface
npm run test -- VoiceInput
```

### Manual Testing Checklist
- [ ] Sphere appears in correct position
- [ ] Click toggles interface
- [ ] Voice input works (in supported browsers)
- [ ] Quick actions trigger correctly
- [ ] Interface closes on outside click
- [ ] Mobile positioning is correct
- [ ] Animations are smooth
- [ ] Keyboard navigation works
- [ ] Screen reader announces properly

## Troubleshooting

### Common Issues

1. **Sphere not visible**
   - Check z-index conflicts
   - Verify CSS import
   - Check CSS variables are defined

2. **Voice input not working**
   - Confirm browser support
   - Check microphone permissions
   - Verify HTTPS context (required for Web Speech API)

3. **Performance issues**
   - Check for memory leaks in event listeners
   - Verify hardware acceleration is working
   - Monitor bundle size with dynamic imports

4. **Mobile positioning issues**
   - Verify mobile breakpoints
   - Check for bottom navigation conflicts
   - Test on various screen sizes

### Debug Mode

Enable debug logging:

```tsx
<FloatingAISphere 
  // Add debug prop when implementing
  debug={process.env.NODE_ENV === 'development'}
/>
```

## Future Enhancements

### Planned Features
1. **AI Context Awareness**: Real-time context from current page
2. **Voice Commands**: Predefined voice commands for common actions
3. **Conversation History**: Persistent chat history
4. **Smart Suggestions**: AI-powered action suggestions
5. **Customizable Position**: User-configurable sphere position

### API Integration

To connect with your AI backend:

```tsx
// Example API integration
const handleVoiceResult = async (transcript: string) => {
  try {
    const response = await fetch('/api/ai/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: transcript,
        context: getPageContext()
      })
    });
    
    const result = await response.json();
    // Handle AI response
  } catch (error) {
    console.error('AI processing error:', error);
  }
};
```

## Support

For implementation questions or issues:
1. Check this guide first
2. Review the component source code
3. Test in isolation to identify conflicts
4. Verify browser compatibility requirements