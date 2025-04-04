'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface ChartData {
  date: string;
  impressions: number;
  clicks: number;
}

interface LineChartProps {
  data: ChartData[];
}

export function LineChart({ data }: LineChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Prepare data for the chart
    const labels = data.map(item => item.date);
    const impressionsData = data.map(item => item.impressions);
    const clicksData = data.map(item => item.clicks);

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Impressions',
            data: impressionsData,
            borderColor: '#4338ca',
            backgroundColor: 'rgba(67, 56, 202, 0.1)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Clicks',
            data: clicksData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true
          }
        }
      }
    });

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <canvas ref={chartRef} className="w-full h-full"></canvas>
  );
} 