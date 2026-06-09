export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
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
}

export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
}
