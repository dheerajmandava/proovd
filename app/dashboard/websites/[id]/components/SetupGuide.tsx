'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, ClipboardIcon } from '@heroicons/react/24/outline';

interface SetupGuideProps {
  websiteId: string;
}

export default function SetupGuide({ websiteId }: SetupGuideProps) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Script tag that needs to be added to the customer's website
  const scriptTag = `<script src="${origin}/api/cdn/n/${websiteId}"></script>`;

  // Installation steps
  const steps = [
    {
      title: '1. Add the Script',
      description: 'Copy and paste this script tag just before the closing </body> tag of your website:',
      code: scriptTag
    },
    {
      title: '2. Verify Installation',
      description: 'After adding the script, your notifications will automatically appear on your website based on your settings.',
      subtext: 'You can test the installation by creating a notification in the Notifications tab.'
    },
    {
      title: '3. Configure Settings',
      description: 'Customize the appearance and behavior of your notifications in the Settings tab:',
      bullets: [
        'Position (top-right, bottom-right, etc.)',
        'Display duration',
        'Theme (light/dark)',
        'Timing and delays'
      ]
    }
  ];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Setup Guide</h2>
        <p className="text-gray-500">Follow these steps to add notifications to your website</p>
      </div>

      <div className="grid gap-6">
        {steps.map((step, index) => (
          <Card key={index} className="p-6">
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-gray-600 mb-4">{step.description}</p>
            
            {step.code && (
              <div className="relative">
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                  {step.code}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(step.code)}
                >
                  {copied ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <ClipboardIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
            
            {step.subtext && (
              <p className="text-sm text-gray-500 mt-2">{step.subtext}</p>
            )}
            
            {step.bullets && (
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                {step.bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
        <p className="text-gray-600">
          If you're having trouble setting up notifications or have any questions, our support team is here to help.
        </p>
        <div className="mt-4">
          <Button variant="default">Contact Support</Button>
        </div>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Make sure to add the script to all pages where you want notifications to appear. 
          The script is lightweight and won't affect your website's performance.
        </p>
      </div>
    </div>
  );
} 