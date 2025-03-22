'use client';

import React from 'react';
import { 
  ShieldCheckIcon, 
  ShieldExclamationIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

type VerificationStatus = 'pending' | 'verified' | 'failed';

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md';
}

export default function VerificationStatusBadge({ 
  status, 
  size = 'sm' 
}: VerificationStatusBadgeProps) {
  // Default styles based on size
  const baseClasses = "inline-flex items-center rounded-full font-medium";
  const iconClasses = size === 'sm' ? "h-3.5 w-3.5 mr-1" : "h-4 w-4 mr-1.5";
  const textClasses = size === 'sm' ? "text-xs" : "text-sm";
  const paddingClasses = size === 'sm' ? "px-2 py-0.5" : "px-2.5 py-1";
  
  // Status specific styles
  let statusClasses = '';
  let icon = null;
  let label = '';
  
  switch (status) {
    case 'verified':
      statusClasses = "bg-green-100 text-green-800";
      icon = <ShieldCheckIcon className={iconClasses} />;
      label = "Verified";
      break;
    case 'failed':
      statusClasses = "bg-red-100 text-red-800";
      icon = <ShieldExclamationIcon className={iconClasses} />;
      label = "Failed";
      break;
    case 'pending':
    default:
      statusClasses = "bg-yellow-100 text-yellow-800";
      icon = <ClockIcon className={iconClasses} />;
      label = "Pending";
      break;
  }
  
  return (
    <span className={`${baseClasses} ${paddingClasses} ${statusClasses} ${textClasses}`}>
      {icon}
      {label}
    </span>
  );
} 