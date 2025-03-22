'use client';

import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface CopyCodeButtonProps {
  apiKey: string;
  baseUrl: string;
  websiteId: string;
}

export default function CopyCodeButton({ apiKey, baseUrl, websiteId }: CopyCodeButtonProps) {
  const [showToast, setShowToast] = useState(false);

  const handleCopy = () => {
    const code = `<script>
  window.ProovdOptions = {
    apiKey: "${apiKey}",
    websiteId: "${websiteId}"
  };
</script>
<script src="${baseUrl}/api/websites/${websiteId}/widget.js"></script>`;
    
    navigator.clipboard.writeText(code);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <>
      <button
        className="btn btn-primary"
        onClick={handleCopy}
      >
        <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
        Copy Code
      </button>
      
      {/* Toast for copy confirmation */}
      {showToast && (
        <div className="toast toast-end">
          <div className="alert alert-success">
            <span>Code copied to clipboard!</span>
          </div>
        </div>
      )}
    </>
  );
} 