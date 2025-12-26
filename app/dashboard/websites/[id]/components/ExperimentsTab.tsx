'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { timeAgo } from '@/app/lib/utils';
import { toast } from 'react-hot-toast';

// Campaign interface
interface Campaign {
    _id: string;
    name: string;
    type: string;
    status: string;
    siteId: string;
    impressions: number;
    clicks: number;
    conversions?: number;
    variants?: any[];
    trafficAllocation?: number;
    createdAt: string;
    updatedAt: string;
}

interface Website {
    _id: string;
    name: string;
    domain: string;
}

interface ExperimentsTabProps {
    websiteId: string;
    website: Website;
    initialCampaigns: Campaign[];
}

export default function ExperimentsTab({ websiteId, website, initialCampaigns }: ExperimentsTabProps) {
    const router = useRouter();
    const [experiments, setExperiments] = useState(initialCampaigns);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    async function handleDelete(experimentId: string) {
        if (!confirm('Are you sure you want to delete this experiment?')) return;

        try {
            setDeletingIds(prev => new Set(prev).add(experimentId));

            const res = await fetch(`/api/websites/${websiteId}/campaigns/${experimentId}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('Experiment deleted');
            setExperiments(prev => prev.filter(c => c._id !== experimentId));
        } catch (err) {
            toast.error('Failed to delete experiment');
        } finally {
            setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(experimentId);
                return newSet;
            });
        }
    }

    async function handleToggleStatus(experiment: Campaign) {
        const newStatus = experiment.status === 'running' ? 'paused' : 'running';
        try {
            const res = await fetch(`/api/websites/${websiteId}/campaigns/${experiment._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update');

            toast.success(`Experiment ${newStatus}`);
            setExperiments(prev => prev.map(c =>
                c._id === experiment._id ? { ...c, status: newStatus } : c
            ));
        } catch (err) {
            toast.error('Failed to update experiment');
        }
    }

    const calculateConversionRate = (impressions: number, conversions: number = 0) => {
        if (impressions === 0) return '0%';
        return ((conversions / impressions) * 100).toFixed(1) + '%';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold">A/B Experiments</h2>
                    <p className="text-base-content/70">
                        Optimize {website?.name || 'your website'} with data-driven experiments
                    </p>
                </div>
                <Link href={`/dashboard/websites/${websiteId}/campaigns/new`} className="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    New Experiment
                </Link>
            </div>

            {experiments.length === 0 ? (
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body items-center text-center">
                        <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center text-base-content/40 mb-4">
                            <span className="text-3xl">🧪</span>
                        </div>
                        <h2 className="card-title mb-2">No experiments yet</h2>
                        <p className="mb-4 text-base-content/70">Create your first A/B test to start optimizing conversions</p>
                        <div className="card-actions">
                            <Link href={`/dashboard/websites/${websiteId}/campaigns/new`} className="btn btn-primary">
                                Create Experiment
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Experiment</th>
                                <th>Status</th>
                                <th>Visitors</th>
                                <th>Conversions</th>
                                <th>Conv. Rate</th>
                                <th>Variants</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {experiments.map((experiment) => (
                                <tr key={experiment._id}>
                                    <td>
                                        <div className="font-bold">{experiment.name}</div>
                                        <div className="text-xs text-base-content/60">
                                            Created {timeAgo(new Date(experiment.createdAt))}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <span className={`badge ${experiment.status === 'running' ? 'badge-success' :
                                                    experiment.status === 'paused' ? 'badge-warning' : 'badge-ghost'
                                                }`}>
                                                {experiment.status}
                                            </span>
                                            {experiment.status !== 'draft' && (
                                                <button
                                                    onClick={() => handleToggleStatus(experiment)}
                                                    className="btn btn-ghost btn-xs"
                                                >
                                                    {experiment.status === 'running' ? '⏸️' : '▶️'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td>{experiment.impressions.toLocaleString()}</td>
                                    <td>{(experiment.conversions || 0).toLocaleString()}</td>
                                    <td>{calculateConversionRate(experiment.impressions, experiment.conversions)}</td>
                                    <td>
                                        <div className="badge badge-outline">
                                            {(experiment.variants?.length || 0) + 1} Variations
                                        </div>
                                    </td>
                                    <td className="flex gap-2">
                                        <Link
                                            href={`/dashboard/websites/${websiteId}/campaigns/${experiment._id}`}
                                            className="btn btn-xs btn-outline"
                                        >
                                            Results
                                        </Link>
                                        <Link
                                            href={`/dashboard/websites/${websiteId}/campaigns/${experiment._id}/edit`}
                                            className="btn btn-xs btn-outline"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(experiment._id)}
                                            className="btn btn-xs btn-error btn-outline"
                                            disabled={deletingIds.has(experiment._id)}
                                        >
                                            {deletingIds.has(experiment._id) ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
