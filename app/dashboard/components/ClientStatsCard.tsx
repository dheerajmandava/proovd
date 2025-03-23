'use client';

import React, { ReactNode } from 'react';
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
  title: string;
  value: number | string;
  description: string;
  icon: ReactNode;
}

export default function ClientStatsCard({ title, value, description, icon }: ClientStatsCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="mt-2.5">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
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