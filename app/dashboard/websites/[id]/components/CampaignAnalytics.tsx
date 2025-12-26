'use client';

import { useState, useEffect } from 'react';

interface CampaignStats {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: string;
    conversionRate: string;
}

interface VariantResult {
    id: string;
    name: string;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: string;
}

interface ChartDataPoint {
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
}

interface CampaignAnalyticsProps {
    campaignId: string;
}

export default function CampaignAnalytics({ campaignId }: CampaignAnalyticsProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<CampaignStats | null>(null);
    const [variants, setVariants] = useState<VariantResult[]>([]);
    const [winner, setWinner] = useState<string | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [hasVariants, setHasVariants] = useState(false);

    useEffect(() => {
        fetchStats();
    }, [campaignId]);

    async function fetchStats() {
        try {
            setLoading(true);
            const res = await fetch(`/api/campaigns/${campaignId}/stats`);
            if (!res.ok) throw new Error('Failed to fetch stats');

            const data = await res.json();
            setStats(data.stats);
            setVariants(data.variants || []);
            setWinner(data.winner);
            setChartData(data.chartData || []);
            setHasVariants(data.campaign?.hasVariants || false);
        } catch (err) {
            setError('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stat bg-base-100 rounded-box shadow">
                    <div className="stat-title">Impressions</div>
                    <div className="stat-value text-primary">{stats?.impressions.toLocaleString()}</div>
                </div>
                <div className="stat bg-base-100 rounded-box shadow">
                    <div className="stat-title">Clicks</div>
                    <div className="stat-value text-secondary">{stats?.clicks.toLocaleString()}</div>
                </div>
                <div className="stat bg-base-100 rounded-box shadow">
                    <div className="stat-title">CTR</div>
                    <div className="stat-value text-accent">{stats?.ctr}%</div>
                </div>
                <div className="stat bg-base-100 rounded-box shadow">
                    <div className="stat-title">Conversions</div>
                    <div className="stat-value">{stats?.conversions.toLocaleString()}</div>
                    <div className="stat-desc">{stats?.conversionRate}% rate</div>
                </div>
            </div>

            {/* A/B Test Results */}
            {hasVariants && variants.length > 0 && (
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h3 className="card-title">
                            A/B Test Results
                            {winner && (
                                <span className="badge badge-success ml-2">Winner: {winner === 'control' ? 'Control' : winner}</span>
                            )}
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Variant</th>
                                        <th>Impressions</th>
                                        <th>Clicks</th>
                                        <th>CTR</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variants.map((variant) => (
                                        <tr key={variant.id} className={winner === variant.id ? 'bg-success/10' : ''}>
                                            <td className="font-medium">{variant.name}</td>
                                            <td>{variant.impressions.toLocaleString()}</td>
                                            <td>{variant.clicks.toLocaleString()}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{variant.ctr}%</span>
                                                    <progress
                                                        className={`progress w-16 ${winner === variant.id ? 'progress-success' : 'progress-primary'}`}
                                                        value={parseFloat(variant.ctr)}
                                                        max="20"
                                                    ></progress>
                                                </div>
                                            </td>
                                            <td>
                                                {winner === variant.id ? (
                                                    <span className="badge badge-success">Winner</span>
                                                ) : variant.impressions < 100 ? (
                                                    <span className="badge badge-ghost">Collecting data</span>
                                                ) : (
                                                    <span className="badge badge-ghost">Running</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {!winner && (
                            <div className="alert alert-info mt-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span>Need at least 100 impressions per variant to declare a winner.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Performance Chart (simplified - just showing data table for now) */}
            {chartData.length > 0 && (
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h3 className="card-title">Daily Performance (Last 30 Days)</h3>
                        <div className="overflow-x-auto max-h-64">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Impressions</th>
                                        <th>Clicks</th>
                                        <th>Conversions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chartData.slice(-10).reverse().map((day) => (
                                        <tr key={day.date}>
                                            <td>{day.date}</td>
                                            <td>{day.impressions}</td>
                                            <td>{day.clicks}</td>
                                            <td>{day.conversions}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
