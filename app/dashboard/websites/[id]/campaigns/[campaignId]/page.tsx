import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getCampaignById, getWebsiteById } from '@/app/lib/services';
import CampaignAnalytics from '../../components/CampaignAnalytics';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string; campaignId: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/api/auth/signin');
    }

    const { id: websiteId, campaignId } = await params;

    const [website, campaign] = await Promise.all([
        getWebsiteById(websiteId),
        getCampaignById(campaignId)
    ]);

    if (!website || website.userId.toString() !== session.user.id) {
        redirect('/dashboard/websites');
    }

    if (!campaign) {
        redirect(`/dashboard/websites/${websiteId}`);
    }

    // Type badge colors
    const typeBadgeClass: Record<string, string> = {
        'popup': 'badge-primary',
        'sticky-bar': 'badge-secondary',
        'slide-in': 'badge-accent',
        'inline-banner': 'badge-info',
        'custom': 'badge-ghost'
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <div className="breadcrumbs text-sm mb-2">
                        <ul>
                            <li><Link href="/dashboard/websites">Websites</Link></li>
                            <li><Link href={`/dashboard/websites/${websiteId}`}>{website.name}</Link></li>
                            <li>Campaigns</li>
                            <li>{campaign.name}</li>
                        </ul>
                    </div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        {campaign.name}
                        <span className={`badge ${typeBadgeClass[campaign.type as string] || 'badge-ghost'}`}>
                            {campaign.type}
                        </span>
                        <span className={`badge ${campaign.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                            {campaign.status}
                        </span>
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/dashboard/websites/${websiteId}/campaigns/${campaignId}/edit`}
                        className="btn btn-outline"
                    >
                        Edit Campaign
                    </Link>
                </div>
            </div>

            {/* Campaign Content Preview */}
            <div className="card bg-base-100 shadow mb-6">
                <div className="card-body">
                    <h3 className="card-title text-lg">Content</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-base-content/70">Title</div>
                            <div className="font-medium">{campaign.content?.title || campaign.message || '—'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-base-content/70">Body</div>
                            <div>{campaign.content?.body || '—'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-base-content/70">CTA Text</div>
                            <div>{campaign.content?.ctaText || '—'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-base-content/70">CTA URL</div>
                            <div className="truncate">{campaign.content?.ctaUrl || campaign.url || '—'}</div>
                        </div>
                    </div>

                    {/* A/B Test Variants */}
                    {campaign.variants && campaign.variants.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-base-300">
                            <div className="text-sm text-base-content/70 mb-2">A/B Test Variants</div>
                            <div className="badge badge-info">{campaign.variants.length + 1} variants (including control)</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Analytics */}
            <CampaignAnalytics campaignId={campaignId} />
        </div>
    );
}
