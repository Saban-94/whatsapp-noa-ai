import { Chat, KnowledgeItem, AdminSettings, WebhookLog } from '../types';
import { INITIAL_CHATS, INITIAL_KNOWLEDGE_BASE, INITIAL_SETTINGS, DEFAULT_QUICK_REPLIES } from '../data/mockData';

const STORAGE_KEYS = {
  CHATS: 'sabanos_wa_chats_v1',
  SETTINGS: 'sabanos_wa_settings_v1',
  KNOWLEDGE_BASE: 'sabanos_wa_kb_v1',
  WEBHOOK_LOGS: 'sabanos_wa_logs_v1',
};

export function loadStoredChats(): Chat[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (data) {
      const parsed: Chat[] = JSON.parse(data);
      // Migrate Noa AI avatar if it's using the old unsplash URL
      return parsed.map((c) => {
        if (c.id === 'chat_noa_ai' || c.contact.id === 'c_noa') {
          return {
            ...c,
            contact: {
              ...c.contact,
              avatar: 'https://i.ibb.co/Zz6H1zth/1785576538638.png',
            },
          };
        }
        return c;
      });
    }
  } catch (e) {
    console.error('Error loading chats from storage:', e);
  }
  return INITIAL_CHATS;
}

export function saveStoredChats(chats: Chat[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  } catch (e) {
    console.error('Error saving chats:', e);
  }
}

export function loadStoredSettings(): AdminSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      const parsed: AdminSettings = JSON.parse(data);
      if (!parsed.quickReplies || parsed.quickReplies.length === 0) {
        parsed.quickReplies = DEFAULT_QUICK_REPLIES;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return INITIAL_SETTINGS;
}

export function saveStoredSettings(settings: AdminSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

export function loadStoredKnowledgeBase(): KnowledgeItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_BASE);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error loading KB:', e);
  }
  return INITIAL_KNOWLEDGE_BASE;
}

export function saveStoredKnowledgeBase(kb: KnowledgeItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_BASE, JSON.stringify(kb));
  } catch (e) {
    console.error('Error saving KB:', e);
  }
}

export function loadStoredLogs(): WebhookLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WEBHOOK_LOGS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error loading logs:', e);
  }
  return [];
}

export function saveStoredLogs(logs: WebhookLog[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.WEBHOOK_LOGS, JSON.stringify(logs.slice(-50)));
  } catch (e) {
    console.error('Error saving logs:', e);
  }
}

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEYS.CHATS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.KNOWLEDGE_BASE);
  localStorage.removeItem(STORAGE_KEYS.WEBHOOK_LOGS);
}
