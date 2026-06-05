import React, { useRef, useEffect, useState, ChangeEvent, KeyboardEvent } from 'react';
import { Send, StopCircle, Paperclip, X, Mic, MicOff } from 'lucide-react';
import { FileData } from '../types';

interface ComposerProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  onStop: () => void;
  onFileUpload: (files: FileList) => void;
  attachedFiles: FileData[];
  onRemoveFile: (id: string) => void;
}

export function Composer({
  input,
  setInput,
  onSubmit,
  isGenerating,
  onStop,
  onFileUpload,
  attachedFiles,
  onRemoveFile
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

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
    <div className="flex flex-col bg-muted rounded-3xl p-2 px-3 md:px-4 shadow-[0_0_15px_rgba(0,0,0,0.1)] mx-2 md:mx-4 mb-2 md:mb-6 relative">
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachedFiles.map(file => (
            <div key={file.id} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg text-sm">
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button 
                onClick={() => onRemoveFile(file.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center gap-2 py-1">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-foreground/60 hover:text-foreground rounded-full transition-colors"
          title="Upload files"
        >
          <Paperclip size={20} />
        </button>
        
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          // support directory upload optionally by adding webkitdirectory?
          // Webkitdirectory is a boolean attribute, we can use a separate button if needed, but let's just allow file multiple for now.
        />
        
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening... Speak now" : "Message CodeBot..."}
            className="w-full max-h-[200px] min-h-[24px] bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground py-2"
            rows={1}
          />
        </div>
        
        {isGenerating ? (
          <button
            onClick={onStop}
            className="p-2 bg-foreground text-background hover:opacity-80 rounded-full transition-colors flex items-center justify-center h-8 w-8"
            title="Stop generation"
          >
            <StopCircle size={16} />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={toggleListening}
              className={`p-2 rounded-full transition-colors flex items-center justify-center h-8 w-8 ${isListening ? 'bg-red-500 text-white' : 'text-foreground/60 hover:text-foreground hover:bg-muted'}`}
              title={isListening ? "Stop listening" : "Voice dictation"}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              onClick={onSubmit}
              disabled={!input.trim() && attachedFiles.length === 0}
              className="p-2 bg-foreground text-background hover:opacity-80 disabled:opacity-20 disabled:bg-foreground/50 rounded-full transition-all flex items-center justify-center h-8 w-8"
              title="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
