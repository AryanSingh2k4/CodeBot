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

  async getFiles(): Promise<FileData[]> {
    const files: FileData[] = [];
    await fileStore.iterate((value: FileData, key) => {
      files.push(value);
    });
    return files;
  },

  async saveFile(file: FileData): Promise<void> {
    await fileStore.setItem(file.id, file);
  },

  async removeFile(id: string): Promise<void> {
    await fileStore.removeItem(id);
  },

  async clearFiles(): Promise<void> {
    await fileStore.clear();
  }
};
