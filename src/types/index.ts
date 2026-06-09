export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  attachments?: { name: string, content: string }[];
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  createdAt: number;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  persona?: string;
  thinkingLevel?: 'low' | 'medium' | 'high';
  model?: 'openai/gpt-oss-120b' | 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant';
}

export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
}

export interface RecentFile extends FileData {
  addedAt: number;
}
