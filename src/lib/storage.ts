import localforage from 'localforage';
import { Chat, AppSettings, FileData } from '../types';

const chatStore = localforage.createInstance({
  name: 'CodeBot',
  storeName: 'chats'
});

const fileStore = localforage.createInstance({
  name: 'CodeBot',
  storeName: 'files'
});

export const storage = {
  async getChats(): Promise<Chat[]> {
    const chats: Chat[] = [];
    await chatStore.iterate((value: Chat, key) => {
      chats.push(value);
    });
    return chats.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async saveChat(chat: Chat): Promise<void> {
    await chatStore.setItem(chat.id, chat);
  },

  async deleteChat(id: string): Promise<void> {
    await chatStore.removeItem(id);
  },

  async clearChats(): Promise<void> {
    await chatStore.clear();
  },

  async getFiles(): Promise<import('../types').RecentFile[]> {
    const files: import('../types').RecentFile[] = [];
    await fileStore.iterate((value: import('../types').RecentFile, key) => {
      files.push(value);
    });
    return files.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  },

  async saveFile(file: FileData): Promise<void> {
    const recentFile: import('../types').RecentFile = { ...file, addedAt: Date.now() };
    await fileStore.setItem(file.id, recentFile);
    
    // Cleanup old files, keep only top 10
    const allFiles = await this.getFiles();
    if (allFiles.length > 10) {
      const toDelete = allFiles.slice(10);
      for (const f of toDelete) {
        await fileStore.removeItem(f.id);
      }
    }
  },

  async removeFile(id: string): Promise<void> {
    await fileStore.removeItem(id);
  },

  async clearFiles(): Promise<void> {
    await fileStore.clear();
  }
};
