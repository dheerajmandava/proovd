'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Sample notification actions
const notificationActions = [
  {
    action: 'purchased Premium Plan',
    link: '/pricing'
  },
  {
    action: 'joined the community',
    link: '/auth/signup'
  },
  {
    action: 'made a new transaction',
    link: '/dashboard'
  },
  {
    action: 'upgraded their account',
    link: '/pricing'
  }
];

// Secondary notification actions
const secondaryNotificationActions = [
  {
    action: 'started a free trial',
    link: '/pricing'
  },
  {
    action: 'completed checkout',
    link: '/dashboard'
  },
  {
    action: 'signed up for newsletter',
    link: '/auth/signup'
  },
  {
    action: 'made first purchase',
    link: '/dashboard'
  }
];

interface SampleNotificationProps {
  secondaryNotification?: boolean;
}

export default function SampleNotification({ secondaryNotification = false }: SampleNotificationProps) {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);
  
  // Choose data source based on prop
  const data = secondaryNotification ? secondaryNotificationActions : notificationActions;
  
  // Person details remain constant - only the action changes
  const person = {
    avatar: secondaryNotification ? 'E' : 'J',
    avatarColor: secondaryNotification ? 'bg-teal-100 text-teal-600' : 'bg-blue-100 text-blue-600',
    name: secondaryNotification ? 'Emma from Chicago' : 'John from California',
    time: 'just now'
  };
  
  // Current target text and link
  const currentActionObj = data[currentIndex];
  const currentAction = currentActionObj.action;
  const currentLink = currentActionObj.link;
  
  // Typing effect
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    // Deleting phase
    if (isDeleting) {
      if (displayText.length === 0) {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % data.length);
        setTypingSpeed(130); // slightly faster typing than deleting
      } else {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 50); // backspace faster than typing
      }
    } 
    // Typing phase
    else {
      if (displayText === currentAction) {
        // Full text displayed - wait before deleting
        timeout = setTimeout(() => {
          setIsDeleting(true);
          setTypingSpeed(50);
        }, 2000);
      } else {
        // Still typing
        timeout = setTimeout(() => {
          setDisplayText(currentAction.slice(0, displayText.length + 1));
        }, typingSpeed);
      }
    }
    
    return () => clearTimeout(timeout);
  }, [displayText, currentAction, isDeleting, data.length, currentIndex, typingSpeed]);
  
  return (
    <Link 
      href={currentLink}
      className={`block bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-72 transform ${secondaryNotification ? '-rotate-1' : 'rotate-1'} hover:shadow-xl`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${person.avatarColor} flex items-center justify-center font-bold text-sm`}>
          {person.avatar}
        </div>
        <div>
          <div className="font-medium text-sm">{person.name}</div>
          <div className="text-xs text-base-content/70 h-4">
            {displayText}
            <span className="ml-0.5 inline-block w-1 h-3 bg-gray-400 animate-blink"></span>
          </div>
          <div className="text-xs text-base-content/50">{person.time}</div>
        </div>
      </div>
    </Link>
  );
}