export type MessageSender = 'user' | 'ai' | 'agent' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type MessageType = 'text' | 'image' | 'audio' | 'document' | 'voice_note';

export interface Message {
  id: string;
  chatId: string;
  sender: MessageSender;
  text: string;
  timestamp: string; // HH:MM or ISO
  dateStr?: string; // YYYY-MM-DD
  status: MessageStatus;
  type?: MessageType;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  audioDuration?: string;
  audioWaveform?: number[];
  isVoiceNote?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  statusText?: string;
  isOnline: boolean;
  lastSeen?: string;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  isAiManaged: boolean;
  unreadCount: number;
  labels?: string[];
  notes?: string;
}

export interface Chat {
  id: string;
  contact: Contact;
  lastMessage?: Message;
  messages: Message[];
  updatedAt: string;
}

export interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  isEnabled: boolean;
  updatedAt: string;
}

export interface AdminSettings {
  systemPrompt: string;
  webAppUrl: string;
  webhookSyncEnabled: boolean;
  activeModel: string;
  autoReplyEnabled: boolean;
  typingDelayMs: number;
  notificationSoundEnabled: boolean;
  darkTheme: boolean;
  operatorName: string;
  enableBlueTicks?: boolean;
  businessHoursEnabled?: boolean;
  businessHoursStart?: string;
  businessHoursEnd?: string;
  businessDays?: number[];
  outsideHoursMode?: 'silent' | 'out_of_office_msg';
  outsideHoursMessage?: string;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  url: string;
  payload: any;
  responseCode: number;
  status: 'success' | 'error';
  details?: string;
}

export type ChatFilter = 'all' | 'unread' | 'favorites' | 'groups';
