'use client';
import React, { useState } from 'react';
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
export default function CopyButton({ textToCopy, className = "bg-gray-200 rounded-r-md border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-300 focus:outline-none", iconClassName = "h-5 w-5", label }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        // Reset after 2 seconds
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };
    return (<button className={className} onClick={handleCopy} aria-label="Copy to clipboard">
      {copied ? (<>
          <CheckIcon className={iconClassName}/>
          {label && 'Copied!'}
        </>) : (<>
          <DocumentDuplicateIcon className={iconClassName}/>
          {label && label}
        </>)}
    </button>);
}
