'use client';

import { Message } from '@/store/chat-store';
import { cn } from '@/lib/utils';
import { Mic, User, Bot } from 'lucide-react';

interface MessageBubbleProps {
    message: Message;
    isLastMessage?: boolean;
}

export function MessageBubble({ message, isLastMessage = false }: MessageBubbleProps) {
    const isFromAi = message.isFromAi;
    const isVoice = message.messageType === 'voice';

    return (
        <div
            className={cn(
                'flex gap-3 mb-4',
                isFromAi ? 'justify-start' : 'justify-end'
            )}
        >
            {/* Avatar */}
            <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                isFromAi
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
            )}>
                {isFromAi ? (
                    <Bot className="h-4 w-4" />
                ) : (
                    <User className="h-4 w-4" />
                )}
            </div>

            {/* Message Content */}
            <div className={cn(
                'max-w-xs lg:max-w-md px-4 py-3 rounded-lg',
                isFromAi
                    ? 'bg-muted text-foreground'
                    : 'bg-primary text-primary-foreground'
            )}>
                {/* Message Type Icon */}
                {isVoice && (
                    <div className="flex items-center gap-1 mb-2">
                        <Mic className="h-3 w-3" />
                        <span className="text-xs opacity-70">Sprachnachricht</span>
                    </div>
                )}

                {/* Message Text */}
                <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                </div>

                {/* Timestamp */}
                <div className={cn(
                    'text-xs mt-2',
                    isFromAi ? 'text-muted-foreground' : 'text-primary-foreground/70'
                )}>
                    {new Date(message.createdAt).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </div>
            </div>
        </div>
    );
} 