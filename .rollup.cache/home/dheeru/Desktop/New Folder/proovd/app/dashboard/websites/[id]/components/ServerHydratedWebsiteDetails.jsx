import { getServerSideWebsite } from '@/app/lib/server/data-fetchers';
import WebsiteDetailsPage from './WebsiteDetailsPage';
import { notFound } from 'next/navigation';
import { VerificationStatus } from '@/app/lib/domain-verification';
// This component fetches data on the server and passes it to the client component
export default async function ServerHydratedWebsiteDetails({ websiteId }) {
    // Fetch website data on the server
    const website = await getServerSideWebsite(websiteId);
    if (!website) {
        return notFound();
    }
    // Convert to expected format for WebsiteDetailsPage with explicit type
    const websiteForClient = {
        _id: website._id.toString(),
        name: website.name,
        domain: website.domain,
        userId: website.userId.toString(),
        status: website.status,
        // Add default properties that might not exist in the server model
        verification: {
            status: VerificationStatus.VERIFIED, // Use enum value instead of string
        },
        settings: website.settings || {
            position: 'bottom-left',
            delay: 5,
            displayDuration: 5,
            maxNotifications: 5,
            theme: 'light',
            displayOrder: 'newest',
            randomize: false,
            initialDelay: 5,
            loop: false,
            customStyles: '',
        },
        allowedDomains: website.allowedDomains || [],
        analytics: website.analytics || {
            totalImpressions: 0,
            totalClicks: 0,
            conversionRate: 0,
        },
        // Use current date for timestamps if not available
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    // Pass the data to the client component
    return <WebsiteDetailsPage website={websiteForClient}/>;
}
