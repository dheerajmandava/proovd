'use client';

import React from 'react';
import { formatNumber } from '@/app/lib/utils';
import { 
  ArrowTrendingUpIcon, 
  ArrowUpIcon, 
  BellIcon, 
  ChartBarIcon, 
  CodeBracketIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  KeyIcon,
  CursorArrowRippleIcon
} from '@heroicons/react/24/outline';

interface ClientStatsCardProps {
  title?: string;
  value?: number | string;
  iconName?: string;
  description?: string;
  valueFormatting?: boolean;
  // Keep backward compatibility
  stat?: {
    name: string;
    value: number | string;
    iconName: string;
    color: string;
  };
  index?: number;
}

export default function ClientStatsCard({ 
  title, 
  value, 
  iconName, 
  description,
  valueFormatting = true,
  stat,
  index
}: ClientStatsCardProps) {
  // Support both new props and old stat prop for backward compatibility
  const displayTitle = title || (stat?.name || '');
  const displayValue = value !== undefined ? value : (stat?.value || 0);
  const displayIcon = iconName || (stat?.iconName || 'chart-bar');
  const displayColor = stat?.color || 'primary';
  
  // Format the number if it's a numeric value and formatting is enabled
  const formattedValue = (typeof displayValue === 'number' && valueFormatting)
    ? formatNumber(displayValue) 
    : displayValue;

  // Map icon name to actual icon component
  const IconComponent = getIconByName(displayIcon);

  // If using the old stat prop format, render with the old design
  if (stat) {
    return (
      <div className={`stats shadow bg-base-100`}>
        <div className={`stat`}>
          <div className={`stat-figure text-${displayColor}`}>
            <IconComponent className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="stat-title">{displayTitle}</div>
          <div className={`stat-value text-${displayColor} text-2xl`}>{formattedValue}</div>
          {index === 2 && (
            <div className="stat-desc">
              {(typeof displayValue === 'string' && Number(String(displayValue).replace('%', '')) > 5) 
                ? '↗︎ Good performance' 
                : '↘︎ Needs improvement'}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // New design for direct props
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="p-3 rounded-md bg-blue-50 text-blue-600 mr-4">
          <IconComponent className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{displayTitle}</p>
          <p className="text-2xl font-semibold">{formattedValue}</p>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
    </div>
  );
}

// Helper function to return the appropriate icon component based on name
function getIconByName(iconName: string) {
  switch (iconName) {
    case 'BellIcon':
    case 'bell':
      return BellIcon;
    case 'ChartBarIcon':
    case 'chart-bar':
      return ChartBarIcon;
    case 'ArrowTrendingUpIcon':
    case 'arrow-trending-up':
      return ArrowTrendingUpIcon;
    case 'ArrowUpIcon':
    case 'arrow-up':
      return ArrowUpIcon;
    case 'CodeBracketIcon':
    case 'code-bracket':
      return CodeBracketIcon;
    case 'CurrencyDollarIcon':
    case 'currency-dollar':
      return CurrencyDollarIcon;
    case 'UserGroupIcon':
    case 'user-group':
      return UserGroupIcon;
    case 'GlobeAltIcon':
    case 'globe-alt':
      return GlobeAltIcon;
    case 'CursorArrowRippleIcon':
    case 'cursor-click':
      return CursorArrowRippleIcon;
    case 'DocumentTextIcon':
    case 'document-text':
      return DocumentTextIcon;
    case 'KeyIcon':
    case 'key':
      return KeyIcon;
    default:
      return ChartBarIcon; // Fallback icon
  }
} 