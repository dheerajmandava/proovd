'use client';

import { useRef, useState } from 'react';

interface CodeSectionProps {
  code: string;
  language: string;
}

export default function CodeSection({ code, language }: CodeSectionProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const handleCopy = () => {
    if (codeRef.current) {
      navigator.clipboard.writeText(code)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy code:', err);
        });
    }
  };

  return (
    <div className="relative">
      <pre 
        ref={codeRef}
        className="bg-base-300 rounded-lg p-4 overflow-x-auto font-mono text-sm"
      >
        <code className={`language-${language}`}>
          {code}
        </code>
      </pre>
      
      <button 
        onClick={handleCopy}
        className="absolute top-2 right-2 btn btn-sm btn-square"
        aria-label="Copy code"
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        )}
      </button>
    </div>
  );
} 