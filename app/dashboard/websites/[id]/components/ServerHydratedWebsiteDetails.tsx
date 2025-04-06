import { getServerSideWebsite } from '@/app/lib/server/data-fetchers';
import WebsiteDetailsPage from './WebsiteDetailsPage';
import { notFound } from 'next/navigation';
import { VerificationStatus } from '@/app/lib/domain-verification';

// Define the type expected by WebsiteDetailsPage
interface WebsiteDetailsClientType {
  _id: string;
  name: string;
  domain: string;
  userId: string;
  status: string;
  verification?: {
    status: VerificationStatus;
    code?: string;
    verifiedAt?: string;
  };
  settings?: {
    position: string;
    delay: number;
    displayDuration: number;
    maxNotifications: number;
    theme: string;
    displayOrder: string;
    randomize: boolean;
    initialDelay: number;
    loop: boolean;
    customStyles: string;
  };
  allowedDomains?: string[];
  analytics?: {
    totalImpressions: number;
    totalClicks: number;
    conversionRate: number;
  };
  createdAt: string;
  updatedAt: string;
}


export default async function ServerHydratedWebsiteDetails({ websiteId, searchParams }: { websiteId: string, searchParams: { tab: string } }) {

  const website = await getServerSideWebsite(websiteId);
  
  if (!website) {
    return notFound();
  }
  

  const websiteForClient: WebsiteDetailsClientType = {
    _id: website._id.toString(),
    name: website.name,
    domain: website.domain,
    userId: website.userId.toString(),
    status: website.status,

    verification: {
      status: VerificationStatus.VERIFIED,
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

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };


  return <WebsiteDetailsPage params={{ id: websiteId }} searchParams={searchParams} />;
} 