import React from 'react';
import { MessageSquare, Plus, Search, Trash2, X, Edit2 } from 'lucide-react';
import { Chat } from '../types';
import { cn } from '../lib/utils';

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
  setSearchQuery
}: SidebarProps) {
  const [editingChatId, setEditingChatId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

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
        "fixed md:static inset-y-0 left-0 z-30 shrink-0 bg-sidebar text-foreground transition-all duration-300 flex flex-col overflow-hidden whitespace-nowrap border-r border-border/50",
        isOpen ? "translate-x-0 w-72 md:w-[260px]" : "-translate-x-full w-72 md:w-0 border-none"
      )}>
        <div className="p-4 flex gap-2">
          <button 
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            className="flex-1 flex items-center text-foreground hover:bg-muted bg-background border border-border/50 shadow-sm px-3 py-2.5 rounded-lg transition-colors font-medium text-sm gap-2"
          >
            <Plus size={16} /> New Chat
          </button>
          <button 
            className="md:hidden p-2 hover:bg-black/10 rounded-lg"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 mb-4 relative">
          <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search chats..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-muted border-none rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary transition-colors text-foreground"
          />
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
                      "group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                      currentChatId === chat.id ? "bg-muted text-foreground" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => {
                      onSelectChat(chat.id);
                      if (window.innerWidth < 768) setIsOpen(false);
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
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </div>
    </>
  );
}
