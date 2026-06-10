import { EventEmitter } from 'events';
import type { Message } from '@prisma/client';

// Define the events payload mapping
interface AppEvents {
  new_message: (message: Message) => void;
  message_updated: (message: any) => void;
  user_typing: (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  message_read: (data: { conversationId: string; userId: string; lastReadAt: Date }) => void;
}

// Type-safe EventEmitter wrapper
declare interface AppEventEmitter {
  on<U extends keyof AppEvents>(event: U, listener: AppEvents[U]): this;
  emit<U extends keyof AppEvents>(event: U, ...args: Parameters<AppEvents[U]>): boolean;
  off<U extends keyof AppEvents>(event: U, listener: AppEvents[U]): this;
}

class AppEventEmitter extends EventEmitter {}

// Global singleton instance for the monorepo
export const ee = new AppEventEmitter();
