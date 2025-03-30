import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getServerSideUserData } from '@/app/lib/server/data-fetchers';
import ProfileContent from './components/ProfileContent';
export default async function ProfilePage() {
    var _a;
    // Get the session and user data
    const session = await auth();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        redirect('/auth/signin');
    }
    // Fetch user data with server components
    const userData = await getServerSideUserData();
    if (!userData) {
        redirect('/auth/signin');
    }
    // Serialize user data to plain object
    const serializedUserData = {
        _id: userData._id.toString(),
        name: userData.name,
        email: userData.email,
        image: userData.image,
        role: userData.role,
        plan: userData.plan,
        lastLogin: userData.lastLogin instanceof Date
            ? userData.lastLogin.toISOString()
            : undefined,
        emailNotifications: userData.emailNotifications,
        notificationDigest: userData.notificationDigest,
        createdAt: userData.createdAt instanceof Date
            ? userData.createdAt.toISOString()
            : undefined,
        updatedAt: userData.updatedAt instanceof Date
            ? userData.updatedAt.toISOString()
            : undefined,
    };
    return (<div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      {/* Pass the serialized data to the client component */}
      <ProfileContent userData={serializedUserData}/>
    </div>);
}
