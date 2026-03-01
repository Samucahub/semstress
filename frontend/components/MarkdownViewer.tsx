'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  return (
    <div className={`max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headers
          h1: ({ node, ...props }) => <h1 className="text-4xl font-bold mt-8 mb-4 text-gray-900" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-3xl font-bold mt-7 mb-4 text-gray-800 border-b-2 border-gray-200 pb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-2xl font-bold mt-6 mb-3 text-gray-800" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-xl font-bold mt-5 mb-3 text-gray-700" {...props} />,
          h5: ({ node, ...props }) => <h5 className="text-lg font-bold mt-4 mb-2 text-gray-700" {...props} />,
          h6: ({ node, ...props }) => <h6 className="text-base font-bold mt-4 mb-2 text-gray-700" {...props} />,

          // Paragraphs and text
          p: ({ node, ...props }) => <p className="mb-4 text-gray-700 leading-7" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-gray-700" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,

          // Lists
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1 text-gray-700" {...props} />,

          // Code
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');
            
            const isShortLine = codeContent.length < 100 && !codeContent.includes('\n');

            if (inline || isShortLine) {
              return (
                <code 
                  className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded-md font-mono text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="my-4 rounded-lg overflow-hidden border border-gray-200">
                <div className="bg-gray-800 text-gray-100 px-4 py-2 text-xs font-semibold">
                  {match ? match[1] : 'code'}
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match ? match[1] : 'text'}
                  PreTag="div"
                  className="!m-0 !bg-gray-900 !p-4"
                  showLineNumbers={false}
                  {...props}
                >
                  {codeContent}
                </SyntaxHighlighter>
              </div>
            );
          },
          pre: ({ node, ...props }) => <pre className="mb-4" {...props} />,

          // Links
          a: ({ node, ...props }: any) => (
            <a 
              className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors" 
              target="_blank" 
              rel="noopener noreferrer"
              {...props} 
            />
          ),

          // Images
          img: ({ node, ...props }: any) => (
            <img 
              className="max-w-full h-auto rounded-lg my-4 border border-gray-200 shadow-sm" 
              {...props} 
            />
          ),

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className="border-l-4 border-gray-400 pl-4 py-2 italic text-gray-600 my-4 bg-gray-50 rounded" 
              {...props} 
            />
          ),

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-t-2 border-gray-300" {...props} />
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 border border-gray-200 rounded-lg">
              <table className="w-full" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100 border-b border-gray-200" {...props} />
          ),
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => <tr className="border-b border-gray-200 hover:bg-gray-50" {...props} />,
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left font-bold text-gray-900 border-r border-gray-200 last:border-r-0" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 text-gray-700 border-r border-gray-200 last:border-r-0" {...props} />
          ),

          // Checkbox lists
          input: ({ node, type, checked, ...props }: any) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 cursor-default accent-blue-600 w-4 h-4"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
