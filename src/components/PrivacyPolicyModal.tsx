import React from 'react';
import { X, Shield } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            Privacy Policy
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4 text-sm text-muted-foreground max-h-[60vh] overflow-y-auto">
          <p className="font-medium text-foreground">Your Privacy is Important</p>
          <p>
            At CodeBot, we take your privacy seriously. This application is designed to keep your data under your control.
          </p>
          <p className="font-medium text-foreground mt-2">Data Storage</p>
          <p>
            All your chat history, preferences, and uploaded files are stored securely on your local device. We do not store your personal conversations on our servers.
          </p>
          <p className="font-medium text-foreground mt-2">API Usage</p>
          <p>
            When you send a message, the contents of your prompt and relevant chat history are securely transmitted to the chosen AI model provider to generate a response. No data is retained by us for training purposes.
          </p>
          <p className="font-medium text-foreground mt-2">Incognito Mode</p>
          <p>
            Using Incognito Mode ensures that your chat session is completely ephemeral. It will not be saved to your local storage and will disappear entirely once you navigate away or close the chat.
          </p>
        </div>
      </div>
    </div>
  );
}
