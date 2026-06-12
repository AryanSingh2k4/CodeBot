import React from 'react';
import { MessageSquare, Plus, Search, Trash2, X, Edit2, Settings, PanelLeftClose, PanelLeftOpen, User, Code2, Shield } from 'lucide-react';
import { Chat } from '../types';
import { cn, getInitials } from '../lib/utils';
import { Logo } from './Logo';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  chats: Chat[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenPrivacy: () => void;
  userName?: string;
}

export function Sidebar({
  isOpen,
  setIsOpen,
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  searchQuery,
  setSearchQuery,
  onOpenSettings,
  onOpenAbout,
  onOpenPrivacy,
  userName
}: SidebarProps) {
  const [editingChatId, setEditingChatId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);

  const filteredChats = chats.filter(c => {
    if (c.isIncognito) return false;
    const q = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.messages.some(m => m.content.toLowerCase().includes(q));
  });

  const groupedChats = {
    'Today': [] as Chat[],
    'Yesterday': [] as Chat[],
    'Previous 7 Days': [] as Chat[],
    'Older': [] as Chat[]
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const previous7Days = today - 7 * 86400000;

  filteredChats.forEach(chat => {
    const chatDate = new Date(chat.updatedAt || chat.createdAt).getTime();
    if (chatDate >= today) {
      groupedChats['Today'].push(chat);
    } else if (chatDate >= yesterday) {
      groupedChats['Yesterday'].push(chat);
    } else if (chatDate >= previous7Days) {
      groupedChats['Previous 7 Days'].push(chat);
    } else {
      groupedChats['Older'].push(chat);
    }
  });

  const submitRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingChatId(null);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={cn(
        "fixed md:static inset-y-0 left-0 z-30 shrink-0 text-foreground transition-all duration-300 overflow-hidden whitespace-nowrap border-r group",
        isOpen ? "translate-x-0 w-72 md:w-[260px] bg-sidebar border-border/50" : "-translate-x-full w-72 md:translate-x-0 md:w-14 bg-sidebar md:bg-transparent border-none md:border-transparent"
      )}>
        <div className="relative w-full h-full">
          {/* Collapsed UI (Desktop Only) */}
          <div className={cn(
            "absolute inset-0 w-14 hidden md:flex flex-col items-center py-3 gap-4 transition-opacity duration-300 z-10",
            isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
          )}>
            <button onClick={() => setIsOpen(true)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Open Sidebar">
              <PanelLeftOpen size={20} strokeWidth={1.5} />
            </button>
            <button onClick={onNewChat} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="New Chat">
              <Edit2 size={20} strokeWidth={1.5} />
            </button>
            <button onClick={() => setIsOpen(true)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Search Chats">
              <Search size={20} strokeWidth={1.5} />
            </button>
            <button onClick={() => setIsOpen(true)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Recent Chats">
              <MessageSquare size={20} strokeWidth={1.5} />
            </button>
            <div className="flex-1" />
            <div className="flex flex-col items-center mt-auto pb-5">
            <div className="relative">
              {isProfileMenuOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-popover text-popover-foreground rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <button
                    onClick={() => { onOpenSettings(); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <button
                    onClick={() => { onOpenAbout(); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    <Code2 size={16} /> About
                  </button>
                  <button
                    onClick={() => { onOpenPrivacy(); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    <Shield size={16} /> Privacy Policy
                  </button>
                </div>
              )}
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} 
                className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs hover:bg-primary/20 transition-colors border border-primary/20 shrink-0" 
                title="Profile"
              >
                {userName ? getInitials(userName) : <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center"><User size={16} /></div>}
              </button>
            </div>
          </div>
          </div>

          {/* Expanded UI */}
          <div className={cn(
            "absolute inset-0 w-72 md:w-[260px] flex flex-col h-full transition-opacity duration-300",
            !isOpen ? "opacity-0 md:pointer-events-none" : "opacity-100"
          )}>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 px-2">
                <Logo size={22} className="text-primary mt-1" />
                <span className="font-serif text-xl font-medium text-foreground tracking-tight mt-1">CodeBot</span>
              </div>
              <div className="flex items-center">
                <button 
                  className="hidden md:flex p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                  title="Close Sidebar"
                >
                  <PanelLeftClose size={20} />
                </button>
                <button 
                  className="md:hidden p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="px-3 mt-4 mb-2 relative">
              <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search chats..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-muted border-none rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary transition-colors text-foreground"
              />
            </div>

            <div className="px-3 mb-4 mt-2">
              <button 
                onClick={() => {
                  onNewChat();
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
                className="w-full flex items-center text-foreground hover:bg-muted bg-transparent px-3 py-2 rounded-lg transition-colors font-medium text-sm gap-2"
              >
                <Plus size={16} /> New Chat
              </button>
            </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {Object.entries(groupedChats).map(([group, groupChats]) => (
            groupChats.length > 0 && (
              <div key={group} className="mb-4">
                <div className="text-xs font-semibold text-muted-foreground/70 px-3 mb-2 tracking-wider uppercase">
                  {group}
                </div>
                {groupChats.map(chat => (
                  <div 
                    key={chat.id}
                    className={cn(
                      "group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border",
                      currentChatId === chat.id ? "bg-muted text-foreground border-border/60 shadow-sm" : "border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => {
                      onSelectChat(chat.id);
                    }}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <MessageSquare size={16} className="shrink-0" />
                      {editingChatId === chat.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitRename(chat.id);
                            if (e.key === 'Escape') setEditingChatId(null);
                          }}
                          onBlur={() => submitRename(chat.id)}
                          className="flex-1 bg-background border border-border rounded px-2 py-0.5 text-sm outline-none w-full text-foreground"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate text-sm font-medium">{chat.title}</span>
                      )}
                    </div>
                    
                    {!editingChatId && (
                      <div className={`flex items-center gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100 ${currentChatId === chat.id ? 'opacity-100' : 'opacity-0'}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChatId(chat.id);
                            setEditTitle(chat.title);
                          }}
                          className="p-1 hover:bg-black/10 rounded text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                          className="p-1 hover:bg-black/10 rounded text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ))}
          {filteredChats.length === 0 && (
            <div className="text-center text-sm text-muted-foreground mt-10">
              No chats found.
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border/40 flex flex-col gap-1.5 bg-background/30 shrink-0 relative">
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-3 mb-2 w-[calc(100%-24px)] bg-popover text-popover-foreground rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={() => {
                  onOpenSettings();
                  setIsProfileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
              >
                <Settings size={16} /> Settings
              </button>
              <button
                onClick={() => {
                  onOpenAbout();
                  setIsProfileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
              >
                <Code2 size={16} /> About
              </button>
              <button
                onClick={() => {
                  onOpenPrivacy();
                  setIsProfileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
              >
                <Shield size={16} /> Privacy Policy
              </button>
            </div>
          )}
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full flex items-center gap-2.5 pl-1 pr-3 py-2 text-sm font-medium rounded-lg text-muted-foreground border border-transparent hover:text-foreground hover:bg-muted hover:border-border/60 hover:shadow-sm transition-all duration-200"
          >
            {userName ? (
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                {getInitials(userName)}
              </div>
            ) : (
              <div className="w-8 h-8 shrink-0 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                <User size={16} />
              </div>
            )}
            <span className="truncate text-foreground font-medium">{userName || "Guest User"}</span>
          </button>
        </div>
        </div>
        </div>
      </div>
    </>
  );
}
