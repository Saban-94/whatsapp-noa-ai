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
  transcription?: string;
  isTranscribing?: boolean;
  hasDiscrepancy?: boolean;
  isDiscrepancy?: boolean;
  isReviewed?: boolean;
}

export interface CustomerOrderRecord {
  id: string;
  date: string;
  items: string;
  total: number;
  status: 'בטיפול' | 'אושר' | 'סופק' | 'בדרך';
  skuDetails?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  company?: string;
  address?: string;
  creditLimit?: number;
  balance?: number;
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
  orderHistory?: CustomerOrderRecord[];
  blueTicksOverride?: 'global' | 'enabled' | 'disabled';
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

export interface QuickReply {
  id: string;
  title: string;
  text: string;
  shortcut?: string;
  category?: string;
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
  quickReplies?: QuickReply[];
  autoArchiveEnabled?: boolean;
  autoArchiveDays?: number;
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

export type ChatFilter = 'all' | 'unread' | 'favorites' | 'groups' | 'archived';

export interface LogisticProduct {
  sku: string;
  productName: string;
  aliases: string[];
  unit: string;
  category?: string;
  price?: number;
}

export interface NormalizedOrderItem {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  originalText?: string;
  confidence?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface StagedOrder {
  id: string;
  orderNumber: string;
  customerPhone: string;
  customerName: string;
  rawMessage: string;
  noaResponse: string;
  items: NormalizedOrderItem[];
  totalPrice: number;
  status: 'נקלט ב-SabanOS' | 'בטיפול לוגיסטי' | 'יצא לדרך' | 'הושלם' | 'APPROVED';
  driverName?: string;
  address?: string;
  sentToWhatsapp: boolean;
  createdAt: string;
}

export interface ListenerEventPayload {
  id?: string;
  phone: string;
  senderName: string;
  isGroup?: boolean;
  groupId?: string;
  mentionedJids?: string[];
  parsedClientName?: string;
  incomingMessage: string;
  noaResponse?: string;
  sentToWhatsapp?: boolean;
  timestamp?: string;
  stagedOrder?: StagedOrder;
}
