import Link from 'next/link';

interface WebsiteTabsProps {
  websiteId: string;
  activeTab: 'overview' | 'notifications' | 'settings' | 'setup';
}

export default function WebsiteTabs({ websiteId, activeTab }: WebsiteTabsProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', href: `/dashboard/websites/${websiteId}` },
    { id: 'notifications', label: 'Notifications', href: `/dashboard/websites/${websiteId}/notifications` },
    { id: 'settings', label: 'Settings', href: `/dashboard/websites/${websiteId}/settings` },
    { id: 'setup', label: 'Setup', href: `/dashboard/websites/${websiteId}/setup` },
  ];

  return (
    <div className="tabs tabs-bordered mb-6">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
} 