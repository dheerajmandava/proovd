'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession();
  
  return (
    <header className="sticky top-0 z-30 w-full bg-base-100 border-b border-base-200 shadow-sm">
      <div className="navbar container mx-auto px-4 py-3">
        <div className="flex-1">
          <label htmlFor="drawer-toggle" className="btn btn-square btn-ghost drawer-button lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </label>
          <div className="text-xl font-semibold ml-2 lg:hidden">Proovd</div>
        </div>
        
        <div className="flex-none gap-3">
          <div className="dropdown dropdown-end">
            <div className="indicator">
              <button className="btn btn-ghost btn-circle">
                <BellIcon className="h-5 w-5" />
                <span className="badge badge-sm badge-primary indicator-item">3</span>
              </button>
            </div>
          </div>
          
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                {session?.user?.image ? (
                  <img src={session.user.image} alt="Profile" />
                ) : (
                  <div className="bg-primary text-primary-content flex items-center justify-center h-full">
                    <span className="text-lg font-bold">
                      {session?.user?.name ? session.user.name.charAt(0) : 'U'}
                    </span>
                  </div>
                )}
              </div>
            </label>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow-lg menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li>
                <Link href="/dashboard/profile" className="justify-between">
                  Profile
                  <span className="badge badge-primary">New</span>
                </Link>
              </li>
              <li><Link href="/dashboard/settings">Settings</Link></li>
              <li><button onClick={() => signOut({ callbackUrl: '/' })}>Logout</button></li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
} 