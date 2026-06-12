import React from 'react';
import { X, Moon, Sun, Monitor } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onClearChats: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearChats
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background w-full max-w-md rounded-xl shadow-lg border border-border flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-lg">Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <section>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Profile</h3>
            <div className="flex flex-col gap-2">
              <label htmlFor="userName" className="text-sm font-medium ml-1">Your Name</label>
              <input
                id="userName"
                type="text"
                placeholder="How should we call you?"
                value={settings.userName || ''}
                onChange={(e) => onUpdateSettings({ userName: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary transition-colors text-foreground"
              />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Appearance</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border border-border bg-card transition-all ${settings.theme === 'light' ? 'ring-2 ring-primary text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground shadow-sm'}`}
              >
                <Sun size={18} /> Light
              </button>
              <button 
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border border-border bg-card transition-all ${settings.theme === 'dark' ? 'ring-2 ring-primary text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground shadow-sm'}`}
              >
                <Moon size={18} /> Dark
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">AI Engine Architecture</h3>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/80 transition-colors">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-foreground">GPT-oss-120b</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">Best Model & Finalizer</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/80 transition-colors">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-foreground">Llama-3.3-70b-versatile</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">Reasoning Judge</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/80 transition-colors">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-foreground">Qwen3-32b</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">Coding Specialist</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/80 transition-colors">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-foreground">Llama-4-scout-17b-16e-instruct</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">Brainstormer</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/80 transition-colors">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-foreground">Llama-3.1-8b-instant</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">Default Engine & Fast Fallback</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Data & Storage</h3>
            <div className="space-y-2">
              <button 
                onClick={onClearChats}
                className="w-full flex items-center justify-center py-2.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg text-sm font-medium transition-colors"
              >
                Clear all chats and files
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
