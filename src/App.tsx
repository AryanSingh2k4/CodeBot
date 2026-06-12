import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Menu, Info, Loader2, Monitor, Settings, PanelLeftClose, PanelLeftOpen, Copy, Edit2, RotateCw, ArrowDown, Check, ChevronDown, Plus, MoreVertical, Trash2, User, Code2, GraduationCap, Coffee, Lightbulb, Ghost, Pin, X } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { Composer } from './components/Composer';
import { MarkdownMessage } from './components/MarkdownMessage';
import { SettingsModal } from './components/SettingsModal';
import { AboutModal } from './components/AboutModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { streamMessage, generateChatTitle, searchWeb, executeAgenticLoop } from './services/ai';
import { storage } from './lib/storage';
import { cn, getInitials } from './lib/utils';
import { Chat, Message, AppSettings, FileData, RecentFile } from './types';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

import { Logo } from './components/Logo';

const PROMPT_SUGGESTIONS = {
  write: [
    "Write a blog post about ",
    "Draft an email to ",
    "Write a short story about ",
    "Create a marketing copy for "
  ],
  learn: [
    "Explain how quantum computing works ",
    "What is the theory of relativity?",
    "How does the stock market work?",
    "Summarize the history of "
  ],
  code: [
    "Write a React component for a ",
    "How do I sort an array in Python?",
    "Explain this error: ",
    "Write a SQL query to "
  ],
  life: [
    "Give me a healthy recipe for ",
    "Create a 3-day workout plan",
    "What are some good hobbies for ",
    "How can I improve my sleep?"
  ],
  ai: [
    "Surprise me with a fun fact about ",
    "Tell me a joke about ",
    "Give me a random book recommendation",
    "What's an interesting paradox?"
  ]
};

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
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const [openSuggestionDropdown, setOpenSuggestionDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setOpenSuggestionDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [preIncognitoChatId, setPreIncognitoChatId] = useState<string | null>(null);

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

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
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

  const handleNewIncognitoChat = () => {
    if (currentChat && !currentChat.isIncognito) {
      setPreIncognitoChatId(currentChatId);
    }
    const newChat: Chat = {
      id: uuidv4(),
      title: 'Incognito Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isIncognito: true
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
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
        if (!chat.isIncognito) {
          storage.saveChat(updatedChat).catch(console.error);
        }
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
      if (currentChat?.messages.length === 0 && newMessages.length > 0 && !currentChat?.isIncognito) {
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
    if (currentChat.messages.length === 0 && !currentChat.isIncognito) {
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
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        userName={settings.userName}
      />

      <main className="flex-1 flex flex-col relative h-full max-w-full">
        {/* Header */}
        <header className="h-14 flex items-center px-2 md:px-4 justify-between bg-transparent z-10 shrink-0 relative">
          <div className="flex items-center gap-1 md:gap-3 flex-1 min-w-0" ref={headerMenuRef}>
            <button
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0 md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <Menu size={24} />
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
              <div className="relative">
                <button 
                  onClick={() => !currentChat?.isIncognito && setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-foreground font-medium group ${currentChat?.isIncognito ? 'cursor-default' : 'hover:bg-muted'}`}
                >
                  <span className="truncate max-w-[200px]">{currentChat?.title || "New Chat"}</span>
                  {currentChat?.isIncognito && (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-muted-foreground/10 text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                      <Ghost size={12} /> Incognito
                    </span>
                  )}
                  {!currentChat?.isIncognito && (
                    <ChevronDown size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </button>
                
                {isHeaderMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-popover text-popover-foreground rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      onClick={() => {
                        // Implement Pin Chat functionality
                        setIsHeaderMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                      <Pin size={16} /> Pin Chat
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
            )}
          </div>
          
           <div className="flex items-center gap-3 shrink-0 ml-4">
             {currentChat?.isIncognito ? (
               <button 
                 onClick={() => {
                   setChats(prev => prev.filter(c => c.id !== currentChat?.id));
                   
                   if (preIncognitoChatId && chats.some(c => c.id === preIncognitoChatId && !c.isIncognito)) {
                     setCurrentChatId(preIncognitoChatId);
                   } else {
                     const normalChats = chats.filter(c => !c.isIncognito && c.id !== currentChat?.id);
                     if (normalChats.length > 0) {
                       setCurrentChatId(normalChats[0].id);
                     } else {
                       handleNewChat();
                     }
                   }
                   setPreIncognitoChatId(null);
                 }}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-foreground hover:bg-muted transition-colors text-sm font-medium border border-border"
                 title="Turn off Incognito Mode"
               >
                 <Ghost size={16} /> <span className="hidden md:inline">Incognito Active</span>
               </button>
             ) : (
               <button 
                 onClick={handleNewIncognitoChat}
                 className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                 title="Open Incognito Mode"
               >
                 <Ghost size={20} />
               </button>
             )}
          </div>
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={cn("flex-1 overflow-y-auto scroll-smooth relative", currentChat?.messages.length === 0 ? "hidden" : "pb-40")}
        >
          <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
            {currentChat?.messages.map(msg => (
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
            }
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Scroll Button */}
        {showScrollButton && (currentChat?.messages?.length || 0) > 0 && (
          <button 
            onClick={scrollToBottom}
            className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 p-2 bg-card border border-border shadow-md rounded-full text-foreground hover:bg-muted transition-colors"
            title="Scroll to latest"
          >
            <ArrowDown size={18} />
          </button>
        )}

        <div className={cn(
          "w-full transition-all duration-300 px-0 md:px-8",
          currentChat?.messages.length === 0 
            ? "flex-1 flex flex-col items-center justify-center mt-[-5vh]" 
            : "absolute bottom-0 inset-x-0 bg-gradient-to-t from-background via-background to-transparent pt-6"
        )}>
          {currentChat?.messages.length === 0 && (
            <div className="flex flex-col items-center mb-8 px-4 w-full">
              <Logo size={64} className="text-primary mb-6 drop-shadow-sm" />
              <h2 className="text-3xl md:text-4xl font-serif text-foreground font-medium text-center tracking-tight">
                Good {getTimeOfDay()}{settings.userName ? `, ${settings.userName.split(' ')[0]}` : ''}
              </h2>
            </div>
          )}
          <div className="max-w-3xl mx-auto w-full">
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
            <div className={cn("text-center text-[9px] md:text-xs tracking-tight text-muted-foreground/60 px-1 md:px-4", currentChat?.messages.length === 0 ? "mt-4" : "mb-2 md:mb-4")}>
              AI models can make mistakes. Consider verifying important information.
            </div>
            
            {currentChat?.messages.length === 0 && (
              <div ref={suggestionRef} className="mt-6 mx-2 md:mx-4 relative">
                {/* Static Badges Row */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button onClick={() => setOpenSuggestionDropdown('write')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 size={14} /> Write
                  </button>
                  <button onClick={() => setOpenSuggestionDropdown('learn')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <GraduationCap size={14} /> Learn
                  </button>
                  <button onClick={() => setOpenSuggestionDropdown('code')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Code2 size={14} /> Code
                  </button>
                  <button onClick={() => setOpenSuggestionDropdown('life')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Coffee size={14} /> Life stuff
                  </button>
                  <button onClick={() => setOpenSuggestionDropdown('ai')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Lightbulb size={14} /> AI's choice
                  </button>
                </div>

                {/* Absolute Positioning for the Dropdown Panel */}
                {openSuggestionDropdown && (
                  <div className="absolute top-[calc(100%+8px)] inset-x-0 mx-auto w-full z-50">
                    <div className="bg-[#1e1e1e]/95 backdrop-blur-md border border-border/40 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                          {openSuggestionDropdown === 'write' && <Edit2 size={14} />}
                          {openSuggestionDropdown === 'learn' && <GraduationCap size={14} />}
                          {openSuggestionDropdown === 'code' && <Code2 size={14} />}
                          {openSuggestionDropdown === 'life' && <Coffee size={14} />}
                          {openSuggestionDropdown === 'ai' && <Lightbulb size={14} />}
                          <span className="capitalize">{openSuggestionDropdown === 'life' ? 'Life stuff' : openSuggestionDropdown === 'ai' ? "AI's choice" : openSuggestionDropdown}</span>
                        </div>
                        <button onClick={() => setOpenSuggestionDropdown(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex flex-col">
                        {PROMPT_SUGGESTIONS[openSuggestionDropdown as keyof typeof PROMPT_SUGGESTIONS].map((prompt, i) => (
                          <button 
                            key={i} 
                            onClick={() => { setInput(prompt); setOpenSuggestionDropdown(null); }} 
                            className="text-left px-4 py-3 text-sm text-foreground/90 hover:text-foreground hover:bg-muted/50 transition-colors border-b border-border/40 last:border-0"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}
