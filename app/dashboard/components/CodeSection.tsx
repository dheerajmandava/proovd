'use client';

import { useState } from 'react';
import { CheckIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

interface CodeSectionProps {
  websiteId: string;
}

export default function CodeSection({ websiteId }: CodeSectionProps) {
  const [isCopied, setIsCopied] = useState(false);
  
  // Get base URL from environment or use a default
  const baseUrl = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.proovd.in';
  
  // Generate the installation code
  const code = `<script src="${baseUrl}/w/${websiteId}.js"></script>`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  return (
    <div className="relative rounded-lg bg-black p-4 overflow-x-auto">
      <button 
        onClick={copyToClipboard}
        className="absolute right-2 top-2 rounded-md bg-white/10 p-2 hover:bg-white/20"
        aria-label="Copy code"
      >
        {isCopied ? (
          <CheckIcon className="h-5 w-5 text-green-400" />
        ) : (
          <DocumentDuplicateIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>
      <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
} 