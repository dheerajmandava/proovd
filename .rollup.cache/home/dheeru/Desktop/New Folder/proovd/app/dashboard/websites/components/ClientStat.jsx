'use client';
import React from 'react';
import { formatNumber } from '@/app/lib/utils';
export default function ClientStat({ title, value, isPercentage = false }) {
    const formattedValue = typeof value === 'number' && !isPercentage
        ? formatNumber(value)
        : value;
    return (<div className="stat bg-base-200 rounded-box p-4">
      <div className="stat-title text-xs">{title}</div>
      <div className="stat-value text-lg">
        {formattedValue}{isPercentage ? '%' : ''}
      </div>
    </div>);
}
