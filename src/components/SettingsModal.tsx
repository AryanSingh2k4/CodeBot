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
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-lg">Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Appearance</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${settings.theme === 'light' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
              >
                <Sun size={18} /> Light
              </button>
              <button 
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${settings.theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
              >
                <Moon size={18} /> Dark
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">AI Settings</h3>
            <div className="bg-background border border-border rounded-lg p-4 space-y-3">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Provider Model</span>
                <div className="grid grid-cols-1 gap-2 mt-1">
                  <button 
                    onClick={() => onUpdateSettings({ model: 'gpt-oss' })}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${(!settings.model || settings.model === 'gpt-oss') ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
                  >
                    <span className="font-mono text-sm">gpt-oss-120b</span>
                    {(!settings.model || settings.model === 'gpt-oss') && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </button>
                  <button 
                    onClick={() => onUpdateSettings({ model: 'llama' })}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${settings.model === 'llama' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
                  >
                    <span className="font-mono text-sm">llama-3.1-8b-instant</span>
                    {settings.model === 'llama' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Storage & Data</h3>
            <div className="space-y-2">
              <button 
                onClick={onClearChats}
                className="w-full text-left px-4 py-3 bg-background border border-border hover:bg-muted rounded-lg text-sm text-destructive transition-colors"
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
