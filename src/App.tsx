import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Menu, Info, Loader2, Monitor, Settings, PanelLeftClose, PanelLeftOpen, Copy, Edit2, RotateCw, ArrowDown, Check, ChevronDown, Plus, MoreVertical, Trash2 } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { Composer } from './components/Composer';
import { MarkdownMessage } from './components/MarkdownMessage';
import { SettingsModal } from './components/SettingsModal';
import { streamMessage, generateChatTitle, searchWeb, executeAgenticLoop } from './services/ai';
import { storage } from './lib/storage';
import { Chat, Message, AppSettings, FileData, RecentFile } from './types';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const Logo = ({ className = "", size = 24 }: { className?: string, size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M22.28 11.45c-.17-1.34-.84-2.58-1.92-3.41-.95-.73-2.13-1.12-3.35-1.12-.58 0-1.15.1-1.7.29-.46-1.16-1.3-2.12-2.4-2.73-1.1-.61-2.33-.91-3.58-.87-1.42.04-2.78.58-3.83 1.54-1.05.95-1.74 2.27-1.93 3.69-.17 1.34.02 2.73.54 3.96-.33.15-.65.34-.95.57-1.14.88-1.89 2.19-2.08 3.63-.2 1.45.1 2.92.83 4.18.73 1.25 1.88 2.14 3.23 2.5.6.16 1.23.23 1.85.23 1.27 0 2.52-.39 3.55-1.11 1.05-.73 1.81-1.78 2.16-2.97.26-.03.52-.08.77-.14 1.15-.27 2.19-.89 2.96-1.76.77-.87 1.24-1.96 1.35-3.12.11-1.17-.16-2.35-.76-3.37l-.02-.03c.5-.83.84-1.75.98-2.71v-.01zM11.97 4.16c.86-.01 1.69.21 2.4.63.71.42 1.27 1.02 1.62 1.74-1.61.02-3.17.51-4.52 1.4-.73.47-1.36 1.07-1.85 1.76-1.01 1.39-1.57 3.06-1.62 4.79-.01.12-.03.24-.04.37-.58-1.04-.9-2.22-.92-3.44-.02-1.22.25-2.43.8-3.51.56-1.08 1.38-1.98 2.38-2.61a5.61 5.61 0 0 1 1.75-.76c.01 0 .01 0 0 0zm-5.11 5.3c.77-.66 1.75-1.06 2.79-1.14 1.04-.08 2.07.18 2.95.73l.03.02c-1.1.99-1.94 2.27-2.4 3.73-.24.78-.36 1.6-.33 2.43.07 1.73.68 3.39 1.75 4.75.05.07.11.13.16.19-1.14-.15-2.23-.62-3.14-1.36-.92-.74-1.61-1.73-2-2.85-.38-1.12-.5-2.33-.35-3.51.15-1.18.6-2.29 1.3-3.21a5.77 5.77 0 0 1 1.24-.78zm1.09 9.9c-.43-.72-.67-1.55-.72-2.41-.05-.85.12-1.7.48-2.46.36-.77.89-1.44 1.54-1.95.74.88 1.66 1.57 2.69 2.01.48.21.99.36 1.5.46.52.09 1.05.12 1.58.07 1.71-.16 3.29-.93 4.45-2.18l.06-.06c-.32 1.13-.93 2.14-1.77 2.92-.83.78-1.86 1.29-2.98 1.48-1.11.19-2.26.1-3.32-.26a5.75 5.75 0 0 1-3.51-2.62zm10.23.01c-.81.44-1.73.65-2.65.59a5.35 5.35 0 0 1-2.48-.68 5.61 5.61 0 0 1-2-1.76c1.58-.09 3.09-.64 4.38-1.58.7-.51 1.31-1.15 1.78-1.88 1-1.41 1.5-3.1 1.44-4.83l.02-.04c.69.96 1.06 2.12 1.06 3.31 0 1.18-.32 2.34-.92 3.37-.59 1.03-1.46 1.86-2.5 2.39a5.7 5.7 0 0 1-1.13.25c.01-.01.01-.01 0 0zm1.75-5.26c-.84.6-1.85.93-2.88.94h-.05c-1.02.01-2.03-.27-2.9-.81-.88-.54-1.59-1.32-2.04-2.24l-.02-.04c1.13-1.04 1.95-2.4 2.34-3.88.2-.76.29-1.55.25-2.33-.1-1.73-.76-3.37-1.87-4.7l-.07-.08c1.15.11 2.25.55 3.16 1.25.92.7 1.63 1.65 2.05 2.76.43 1.1.58 2.3.46 3.48-.12 1.18-.6 2.29-1.36 3.19a5.55 5.55 0 0 1-1.07.96zm-1.86-8.7c.39.73.62 1.55.65 2.4.04.85-.11 1.7-.45 2.47a5.54 5.54 0 0 1-1.47 1.96c-.75-.9-1.68-1.61-2.73-2.05-.5-.21-1.02-.35-1.55-.44-.52-.09-1.06-.11-1.59-.05-1.7.19-3.26.98-4.41 2.24l-.06.07c.36-1.12.98-2.12 1.84-2.88.85-.75 1.89-1.24 3.01-1.42 1.12-.17 2.27-.06 3.33.3 1.05.37 1.99 1 2.7 1.82a.09.09 0 0 1 .03-.02z" />
  </svg>
);

const SYSTEM_PROMPT = `You are an ultimate "know-it-all" AI assistant. 

Rules:
* You possess vast, expert-level knowledge across all domains: coding, software engineering, science, history, arts, technology, geography, and more.
* Provide accurate, highly detailed, and comprehensive answers.
* When asked about coding or software engineering, write runnable code, follow best practices, and format all code cleanly in markdown blocks.
* If information is missing, ask clarifying questions.
* Format your responses cleanly.`;

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // 768px is the 'md' breakpoint in Tailwind
    }
    return false;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const headerMenuRef = useRef<HTMLDivElement>(null);

  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    storage.getFiles().then(files => {
      setRecentFiles(files);
    }).catch(console.error);

    const savedSettings = localStorage.getItem('codebot-settings');
    if (savedSettings) return JSON.parse(savedSettings);
    return {
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      model: 'llama-3.1-8b-instant',
      thinkingLevel: 'low'
    };
  });

  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileData[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isCodingModeEnabled, setIsCodingModeEnabled] = useState(false);
  
  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isNearBottomRef = useRef(true);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;
      isNearBottomRef.current = distanceToBottom < 80;
      setShowScrollButton(distanceToBottom > 150);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    isNearBottomRef.current = true;
  };

  useEffect(() => {
    loadChats();
    const handleHeaderClickOutside = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setIsHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleHeaderClickOutside);
    return () => document.removeEventListener('mousedown', handleHeaderClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('codebot-settings', JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Load chats from IndexedDB
  const loadChats = async () => {
    const savedChats = await storage.getChats();
    setChats(savedChats);
    if (savedChats.length > 0 && !currentChatId) {
      setCurrentChatId(savedChats[0].id);
    } else if (savedChats.length === 0) {
      handleNewChat();
    }
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    storage.saveChat(newChat);
  };

  const currentChat = chats.find(c => c.id === currentChatId) || null;

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
  };

  const handleDeleteChat = async (id: string) => {
    await storage.deleteChat(id);
    const newChats = chats.filter(c => c.id !== id);
    if (newChats.length === 0) {
      const fallbackChat: Chat = { id: uuidv4(), title: 'New Chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
      await storage.saveChat(fallbackChat);
      setChats([fallbackChat]);
      setCurrentChatId(fallbackChat.id);
    } else {
      setChats(newChats);
      if (currentChatId === id) {
        setCurrentChatId(newChats[0].id);
      }
    }
  };

  const handleRenameChat = async (id: string, newTitle: string) => {
    await updateChat(id, { title: newTitle });
  };

  const handleFileUpload = async (files: FileList) => {
    const newFiles: FileData[] = [];
    const allowedExts = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.json', '.yaml', '.yml', '.md', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf'];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large (max 10MB)`);
        continue;
      }
      const ext = file.name.includes('.') ? '.' + file.name.split('.').pop()?.toLowerCase() : '';
      if (!allowedExts.includes(ext)) {
        alert(`File type ${ext || 'unknown'} is not allowed. Supported: ${allowedExts.join(', ')}`);
        continue;
      }
      try {
        if (file.type.startsWith('image/')) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const newFile = {
            id: uuidv4(),
            name: file.name,
            type: file.type,
            size: file.size,
            content: base64
          };
          newFiles.push(newFile);
          storage.saveFile(newFile).catch(console.error);
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          const typedarray = new Uint8Array(arrayBuffer);
          
          try {
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            let fullText = '';
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              fullText += pageText + '\n\n';
            }
            const newFile = {
              id: uuidv4(),
              name: file.name,
              type: 'text/plain', 
              size: file.size,
              content: fullText.trim() || '[Empty PDF]'
            };
            newFiles.push(newFile);
            storage.saveFile(newFile).catch(console.error);
          } catch (pdfErr: any) {
            console.error('PDF parsing error:', pdfErr);
            alert(`Could not extract text from PDF: ${pdfErr.message}`);
          }
        } else {
          const text = await file.text();
          const newFile = {
            id: uuidv4(),
            name: file.name,
            type: file.type,
            size: file.size,
            content: text
          };
          newFiles.push(newFile);
          storage.saveFile(newFile).catch(console.error);
        }
      } catch (e) {
        console.error(e);
        alert(`Could not read file ${file.name}.`);
      }
    }
    
    // Update local state by fetching latest recent files
    storage.getFiles().then(files => setRecentFiles(files));
    
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleAttachRecentFile = (file: RecentFile) => {
    setAttachedFiles(prev => [...prev, file]);
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateChat = async (id: string, updates: Partial<Chat>) => {
    setChats(prev => {
      const chat = prev.find(c => c.id === id);
      if (chat) {
        const updatedChat = { ...chat, ...updates, updatedAt: Date.now() };
        storage.saveChat(updatedChat).catch(console.error);
        return prev.map(c => c.id === id ? updatedChat : c);
      }
      return prev;
    });
  };

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [currentChat?.messages]);
  const generateResponse = async (chatId: string, newMessages: Message[]) => {
    setIsGenerating(true);
    const assistantMsgId = uuidv4();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };

    const messagesWithAssistant = [...newMessages, assistantMsg];
    await updateChat(chatId, { messages: messagesWithAssistant });

    try {
      let temp = 0.7;
      let extraPrompt = "";
      let targetModel: string = settings.model || 'llama-3.1-8b-instant';
      
      if (isCodingModeEnabled) {
        targetModel = 'qwen/qwen3-32b';
        extraPrompt += "\n\n[SYSTEM DIRECTIVE: CODING MODE]\nYou are an expert senior software engineer. Provide extremely high-quality, bug-free, and optimal code. Do not write unnecessary explanations. Enclose all code in markdown blocks. Think step by step.";
      }

      if (isWebSearchEnabled) {
        setIsGenerating(true);
        const lastUserMsg = newMessages.findLast(m => m.role === 'user')?.content || '';
        if (lastUserMsg) {
          const webResults = await searchWeb(lastUserMsg);
          if (webResults) {
            extraPrompt += `\n\n${webResults}\n\nUse the above web search results to answer the user's query if relevant.`;
          }
        }
      }

      if (settings.thinkingLevel === 'low') {
        temp = 0.2;
        extraPrompt = "\n\nAnswer as concisely and directly as possible. Do not overthink or provide unnecessary explanations. Give a straight answer.";
      } else if (settings.thinkingLevel === 'high') {
        temp = 0.9;
        targetModel = 'openai/gpt-oss-120b';
        setIsGenerating(true);
        const lastUserMsg = newMessages.findLast(m => m.role === 'user')?.content || '';
        if (lastUserMsg) {
          const reasoningContext = await executeAgenticLoop(lastUserMsg);
          extraPrompt = `\n\n[SYSTEM DIRECTIVE: DEEP THINKING MODE]\nBefore answering, your sub-agents have deliberated on the problem and produced the following reasoning log. You MUST follow the optimal path chosen in the critique to answer the user perfectly:\n\n${reasoningContext}`;
        }
      }

      const messagesForModel = [
        { role: 'system', content: SYSTEM_PROMPT + extraPrompt },
        ...newMessages.map(m => {
          let finalContent = m.content;
          if (m.attachments && m.attachments.length > 0) {
            const filesContext = m.attachments.map(f => `File: ${f.name}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n');
            finalContent = `${filesContext}\n\n${m.content}`;
          }

          if (m.images && m.images.length > 0) {
             return {
               role: m.role,
               content: [
                 { type: 'text', text: finalContent },
                 ...m.images.map(img => ({ type: 'image_url', image_url: { url: img } }))
               ]
             };
          }
          return { role: m.role, content: finalContent };
        })
      ];

      // Background title generation
      if (currentChat?.messages.length === 0 && newMessages.length > 0) {
        const firstUserMsgObj = newMessages.find(m => m.role === 'user');
        let titlePromptText = firstUserMsgObj?.content || '';
        if (!titlePromptText && firstUserMsgObj?.attachments && firstUserMsgObj.attachments.length > 0) {
           titlePromptText = `File: ${firstUserMsgObj.attachments[0].name}\n\n${firstUserMsgObj.attachments[0].content.slice(0, 1000)}`;
        }
        if (titlePromptText) {
          generateChatTitle(titlePromptText).then((newTitle) => {
            updateChat(chatId, { title: newTitle });
          }).catch(() => {});
        }
      }

      abortControllerRef.current = new AbortController();
      let fullText = '';
      
      try {
        await streamMessage(messagesForModel, temp, targetModel, (chunkText) => {
          fullText += chunkText;
          const updatedMsgs = [...newMessages];
          updatedMsgs.push({ ...assistantMsg, content: fullText });
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: updatedMsgs, updatedAt: Date.now() } : c));
        }, abortControllerRef.current.signal);
      } catch (streamErr: any) {
        if (streamErr.name === 'AbortError') {
          // Handled via user stop, keep generated text
        } else {
          throw streamErr;
        }
      }

      const finalMsgs = [...newMessages, { ...assistantMsg, content: fullText }];
      await updateChat(chatId, { messages: finalMsgs });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        const updatedMsgs = [...newMessages];
        updatedMsgs.push({ ...assistantMsg, content: err.message || 'Error: Generation failed.' });
        await updateChat(chatId, { messages: updatedMsgs });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || !currentChat) return;

    const imageFiles = attachedFiles.filter(f => f.type.startsWith('image/')).map(f => f.content);
    const textFiles = attachedFiles.filter(f => !f.type.startsWith('image/'));

    const newUserMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      ...(imageFiles.length > 0 && { images: imageFiles }),
      ...(textFiles.length > 0 && { attachments: textFiles.map(f => ({ name: f.name, content: f.content })) })
    };

    const newMessages = [...currentChat.messages, newUserMsg];
    let title = currentChat.title;
    if (currentChat.messages.length === 0) {
      if (input.trim()) {
        title = input.slice(0, 30) + (input.length > 30 ? '...' : '');
      } else if (textFiles.length > 0) {
        title = textFiles[0].name.slice(0, 30);
      } else if (imageFiles.length > 0) {
        title = 'Image Upload';
      } else {
        title = 'New Chat';
      }
    }

    await updateChat(currentChat.id, {
      title,
      messages: newMessages
    });

    setInput('');
    setAttachedFiles([]);
    isNearBottomRef.current = true;
    scrollToBottom();
    await generateResponse(currentChat.id, newMessages);
  };

  const handleRegenerate = async () => {
    if (!currentChat || isGenerating || currentChat.messages.length === 0) return;
    const lastMsg = currentChat.messages[currentChat.messages.length - 1];
    if (lastMsg.role === 'assistant') {
      const newMessages = currentChat.messages.slice(0, -1);
      await generateResponse(currentChat.id, newMessages);
    }
  };

  const handleStop = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  const handleClearChats = async () => {
    await storage.clearChats();
    await storage.clearFiles();
    
    localStorage.removeItem('codebot-settings');
    setSettings({
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      model: 'llama-3.1-8b-instant',
      thinkingLevel: 'low'
    });
    
    const freshChat: Chat = { id: uuidv4(), title: 'New Chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    await storage.saveChat(freshChat);
    setChats([freshChat]);
    setCurrentChatId(freshChat.id);
    
    setRecentFiles([]);
    setAttachedFiles([]);
    setIsSettingsOpen(false);
  };

  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onRenameChat={handleRenameChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col relative h-full max-w-full">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center px-2 md:px-4 justify-between bg-card/90 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-1 md:gap-3 flex-1 min-w-0">
            <button
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <Menu size={24} className="md:hidden" />
              {isSidebarOpen ? <PanelLeftClose size={24} className="hidden md:block" /> : <PanelLeftOpen size={24} className="hidden md:block" />}
            </button>
            {isEditingTitle ? (
              <input 
                autoFocus
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onBlur={() => {
                  setIsEditingTitle(false);
                  if (currentChat && editTitleValue.trim()) {
                    handleRenameChat(currentChat.id, editTitleValue.trim());
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false);
                    if (currentChat && editTitleValue.trim()) {
                      handleRenameChat(currentChat.id, editTitleValue.trim());
                    }
                  } else if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                  }
                }}
                className="bg-transparent border-b border-primary outline-none px-1 py-0.5 text-foreground font-medium text-sm md:text-base w-full max-w-[200px]"
              />
            ) : (
              <span className="font-medium text-foreground ml-1 md:ml-0 truncate max-w-[200px]">{currentChat?.title || "New Chat"}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 relative shrink-0" ref={headerMenuRef}>
            <button
              onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
              className="p-2 -mr-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              title="Menu"
            >
              <MoreVertical size={20} />
            </button>

            {isHeaderMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-popover text-popover-foreground rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => {
                    handleNewChat();
                    setIsHeaderMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} /> New Chat
                </button>
                {currentChat && (
                  <>
                    <button
                      onClick={() => {
                        setIsEditingTitle(true);
                        setEditTitleValue(currentChat.title);
                        setIsHeaderMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                      <Edit2 size={16} /> Rename Chat
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteChat(currentChat.id);
                        setIsHeaderMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-destructive flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} /> Delete Chat
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pb-40 scroll-smooth relative"
        >
          <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
            {currentChat?.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center mt-32 space-y-4">
                <Logo size={56} className="mb-2 shadow-md" />
                <h2 className="text-xl font-medium mt-4 mb-2 text-foreground">How can I help you today?</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your ultimate AI companion with expert-level knowledge across coding, science, history, and beyond.
                </p>
              </div>
            ) : (
              currentChat?.messages.map(msg => (
                <div key={msg.id} className={`group flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
                  {msg.role !== 'user' && (
                    <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-white text-black border border-gray-200 mt-1">
                      <Logo size={18} />
                    </div>
                  )}
                  <div className={`flex flex-col min-w-0 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`${msg.role === 'user' ? 'bg-muted px-5 py-3 rounded-3xl inline-block max-w-full text-left' : 'w-full'}`}>
                      {msg.content === '' && msg.role === 'assistant' && isGenerating ? (
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      ) : (
                        <>
                          <MarkdownMessage content={msg.content} />
                          {msg.images && msg.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {msg.images.map((img, idx) => (
                                <img key={idx} src={img} alt="Attached" className="max-w-[200px] max-h-[200px] rounded-lg object-contain bg-background/50 border border-border/50" />
                              ))}
                            </div>
                          )}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {msg.attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-background/50 border border-border/50 rounded-lg text-xs font-mono text-muted-foreground">
                                  <span className="w-4 h-4 flex items-center justify-center shrink-0">📄</span>
                                  <span className="truncate max-w-[150px]">{file.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Action Toolbar */}
                    <div className={`flex items-center gap-2 mt-1 ${msg.role === 'user' ? 'pr-3 opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}>
                      {msg.role === 'assistant' && (
                        <>
                          <button onClick={() => handleCopy(msg.id, msg.content)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" title="Copy">
                            {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          {currentChat?.messages[currentChat.messages.length - 1].id === msg.id && (
                             <button onClick={handleRegenerate} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" title="Regenerate">
                               <RotateCw size={14} />
                             </button>
                          )}
                        </>
                      )}
                      {msg.role === 'user' && (
                        <button onClick={() => setInput(msg.content)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" title="Edit">
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Scroll Button */}
        {showScrollButton && (
          <button 
            onClick={scrollToBottom}
            className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 p-2 bg-card border border-border shadow-md rounded-full text-foreground hover:bg-muted transition-colors"
            title="Scroll to latest"
          >
            <ArrowDown size={18} />
          </button>
        )}

        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background via-background to-transparent pt-6 px-0 md:px-8">
          <div className="max-w-3xl mx-auto">
            <Composer
              input={input}
              setInput={setInput}
              onSubmit={handleSubmit}
              isGenerating={isGenerating}
              onStop={handleStop}
              onFileUpload={handleFileUpload}
              attachedFiles={attachedFiles}
              onRemoveFile={handleRemoveFile}
              recentFiles={recentFiles}
              onAttachRecent={handleAttachRecentFile}
              isWebSearchEnabled={isWebSearchEnabled}
              setIsWebSearchEnabled={setIsWebSearchEnabled}
              isCodingModeEnabled={isCodingModeEnabled}
              setIsCodingModeEnabled={setIsCodingModeEnabled}
              settings={settings}
              updateSettings={updateSettings}
            />
            <div className="text-center text-[9px] md:text-xs tracking-tight text-muted-foreground/60 mb-2 md:mb-4 px-1 md:px-4">
              AI models can make mistakes. Consider verifying important information.
            </div>
          </div>
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={s => setSettings({ ...settings, ...s })}
        onClearChats={handleClearChats}
      />
    </div>
  );
}
