import React, { useRef, useEffect, useState, ChangeEvent, KeyboardEvent } from 'react';
import { Send, StopCircle, Plus, X, Mic, MicOff, ChevronDown, Check } from 'lucide-react';
import { FileData, AppSettings } from '../types';

interface ComposerProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  onStop: () => void;
  onFileUpload: (files: FileList) => void;
  attachedFiles: FileData[];
  onRemoveFile: (id: string) => void;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

export function Composer({
  input,
  setInput,
  onSubmit,
  isGenerating,
  onStop,
  onFileUpload,
  attachedFiles,
  onRemoveFile,
  settings,
  updateSettings
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setInput(currentTranscript);
        };
        
        recognitionRef.current.onerror = () => setIsListening(false);
        recognitionRef.current.onend = () => setIsListening(false);
      }
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const toggleListening = () => {
    if (!recognitionRef.current) return alert('Voice dictation is not supported in your browser.');
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || attachedFiles.length > 0) {
        onSubmit();
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col bg-muted rounded-2xl p-2 px-3 md:px-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)] mx-2 md:mx-4 mb-2 md:mb-5 relative">
      
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachedFiles.map(file => (
            <div key={file.id} className="flex items-center gap-2 bg-muted px-2.5 py-1 rounded-lg text-xs">
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button 
                onClick={() => onRemoveFile(file.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Textarea Input area */}
      <div className="w-full relative px-1 flex items-center">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening... Speak now" : "Write a message..."}
          className={`w-full max-h-[140px] md:max-h-[200px] min-h-[24px] bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground py-1 text-[15px] md:text-base ${isListening ? 'pr-28' : ''}`}
          rows={1}
        />
        
        {isListening && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 shadow-sm z-10 select-none">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            <span className="text-[9px] text-red-500 font-semibold tracking-wider uppercase">Listening</span>
            <div className="flex items-center gap-0.5 h-2.5">
              <span className="w-[1.5px] h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
              <span className="w-[1.5px] h-2.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
              <span className="w-[1.5px] h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
            </div>
          </div>
        )}
      </div>
      
      {/* Toolbar actions area */}
      <div className="flex items-center justify-between mt-1 px-1">
        <div className="flex items-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 text-foreground/60 hover:text-foreground hover:bg-background/40 rounded-full transition-colors flex items-center justify-center h-8 w-8"
            title="Upload files"
          >
            <Plus size={18} />
          </button>
          
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Combined Settings Dropdown */}
          <div className="relative flex items-center" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg hover:bg-background/80 transition-colors text-[11px] font-medium text-muted-foreground hover:text-foreground bg-background/30 border border-border/30"
              title="Model & Reasoning Settings"
            >
              <span className="truncate max-w-[120px] font-mono">{settings.model === 'llama' ? 'llama-3.1-8b-instant' : 'gpt-oss-120b'}</span>
              <span className="capitalize opacity-80">{settings.thinkingLevel || 'medium'}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 opacity-70 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute bottom-[calc(100%+8px)] right-0 w-56 bg-popover text-popover-foreground rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Model</div>
                {(['gpt-oss', 'llama'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      updateSettings({ model: m });
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                      (settings.model || 'gpt-oss') === m 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <span className="font-mono">{m === 'gpt-oss' ? 'gpt-oss-120b' : 'llama-3.1-8b-instant'}</span>
                    {(settings.model || 'gpt-oss') === m && <Check size={12} />}
                  </button>
                ))}

                <div className="h-px bg-border my-1.5" />

                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Reasoning Effort</div>
                {(['low', 'medium', 'high'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => {
                      updateSettings({ thinkingLevel: level });
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                      (settings.thinkingLevel || 'medium') === level 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <span className="capitalize">{level}</span>
                    {(settings.thinkingLevel || 'medium') === level && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleListening}
            className={`p-1 rounded-full transition-colors flex items-center justify-center h-8 w-8 ${
              isListening 
                ? 'bg-red-500 text-white' 
                : 'text-foreground/60 hover:text-foreground hover:bg-background/40'
            }`}
            title={isListening ? "Stop listening" : "Voice dictation"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Send / Stop Buttons */}
          {isGenerating ? (
            <button
              onClick={onStop}
              className="p-1 bg-foreground text-background hover:opacity-80 rounded-full transition-colors flex items-center justify-center h-8 w-8"
              title="Stop generation"
            >
              <StopCircle size={16} />
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={!input.trim() && attachedFiles.length === 0}
              className="p-1 bg-foreground text-background hover:opacity-80 disabled:opacity-20 disabled:bg-foreground/50 rounded-full transition-all flex items-center justify-center h-8 w-8"
              title="Send message"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
