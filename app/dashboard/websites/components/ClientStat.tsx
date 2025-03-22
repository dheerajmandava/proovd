'use client';

import React from 'react';
import { formatNumber } from '@/app/lib/utils';

interface ClientStatProps {
  title: string;
  value: number | string;
  isPercentage?: boolean;
}

export default function ClientStat({ title, value, isPercentage = false }: ClientStatProps) {
  const formattedValue = typeof value === 'number' && !isPercentage 
    ? formatNumber(value) 
    : value;

  return (
    <div className="stat bg-base-200 rounded-box p-4">
      <div className="stat-title text-xs">{title}</div>
      <div className="stat-value text-lg">
        {formattedValue}{isPercentage ? '%' : ''}
      </div>
    </div>
  );
} 