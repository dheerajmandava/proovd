import React from 'react';
import NotificationBuilder from '@/app/dashboard/websites/[id]/notifications/components/NotificationBuilder';
import { getNotificationById } from '@/app/lib/services/notification.service';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/app/lib/database/connection';

interface EditNotificationPageProps {
  params: {
    id: string; // websiteId
    notificationId: string;
  };
}

async function EditNotificationPage({ params }: EditNotificationPageProps) {
  const { id: websiteId, notificationId } = params;

  let notificationData = null;
  try {
    await connectToDatabase();
    notificationData = await getNotificationById(notificationId);
  } catch (error) {
    console.error("Failed to fetch notification for editing:", error);
  }

  if (!notificationData) {
    notFound();
  }

  const plainNotificationData = JSON.parse(JSON.stringify(notificationData));

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Notification</h1>
      <NotificationBuilder 
        websiteId={websiteId} 
        initialNotificationData={plainNotificationData}
        isEditing={true}
      />
    </div>
  );
}

export default EditNotificationPage; 