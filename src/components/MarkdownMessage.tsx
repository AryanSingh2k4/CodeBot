import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import { cn } from '../lib/utils';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={cn("prose prose-invert max-w-none break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline && language) {
              return (
                <CodeBlock 
                  language={language} 
                  value={String(children).replace(/\n$/, '')} 
                />
              );
            }
            return (
              <code className={cn("bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono", className)} {...props}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 border border-border rounded-lg">
                <table className="w-full text-sm text-left">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="bg-muted/50 px-4 py-2 font-medium">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2 border-t border-border">{children}</td>;
          },
          a({ children, href }) {
            const safeHref = href?.startsWith('javascript:') ? '#' : href;
            return (
              <a href={safeHref} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">
                {children}
              </a>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
