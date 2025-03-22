import { connectToDatabase } from '../app/lib/db';
import Website from '../app/lib/models/website';
import Notification from '../app/lib/models/notification';

async function createTestNotifications() {
  try {
    await connectToDatabase();
    
    // Find website by API key
    const apiKey = '72ea2d02-2174-40d4-bd45-8db754952570';
    const website = await Website.findOne({ apiKey });
    
    if (!website) {
      console.error('Website not found with API key:', apiKey);
      process.exit(1);
    }

    // Create sample notifications
    const notifications = [
      {
        websiteId: website._id,
        type: 'purchase',
        status: 'active',
        name: 'John D.',
        message: 'Just purchased',
        productName: 'Premium Package',
        url: 'http://localhost:8081/#',
        image: 'https://ui-avatars.com/api/?name=John+D&background=random',
        location: 'global',
        createdAt: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      },
      {
        websiteId: website._id,
        type: 'signup',
        status: 'active',
        name: 'Sarah M.',
        message: 'Just signed up',
        url: 'http://localhost:8081/#',
        image: 'https://ui-avatars.com/api/?name=Sarah+M&background=random',
        location: 'global',
        createdAt: new Date(Date.now() - 10 * 60000), // 10 minutes ago
      },
      {
        websiteId: website._id,
        type: 'purchase',
        status: 'active',
        name: 'Mike R.',
        message: 'Just purchased',
        productName: 'Basic Package',
        url: 'http://localhost:8081/#',
        image: 'https://ui-avatars.com/api/?name=Mike+R&background=random',
        location: 'global',
        createdAt: new Date(Date.now() - 15 * 60000), // 15 minutes ago
      }
    ];

    // Delete existing notifications for this website
    await Notification.deleteMany({ websiteId: website._id });

    // Insert new notifications
    await Notification.insertMany(notifications);

    console.log('Successfully created test notifications!');
    console.log('Website ID:', website._id);
    console.log('Number of notifications created:', notifications.length);

    process.exit(0);
  } catch (error) {
    console.error('Error creating test notifications:', error);
    process.exit(1);
  }
}

createTestNotifications(); 