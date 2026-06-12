import React from 'react';
import { X, Code2 } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Code2 size={20} className="text-primary" />
            About CodeBot
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4 text-sm text-muted-foreground">
          <p>
            CodeBot is a powerful, AI-driven programming assistant designed to help developers write, debug, and understand code more efficiently. 
          </p>
          <p>
            Built with modern web technologies, CodeBot offers a seamless, distraction-free environment tailored for coding and productivity.
          </p>
          <div className="pt-4 mt-4 border-t border-border/50 flex flex-col gap-1 text-xs">
            <span>Version: 1.0.0</span>
            <span>© 2026 CodeBot. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
