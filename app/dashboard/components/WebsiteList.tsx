'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Website } from '@/app/lib/types';
import { useRouter } from 'next/navigation';

type WebsiteListProps = {
  websites: Website[];
};

export default function WebsiteList({ websites }: WebsiteListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Function to handle website deletion
  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setIsDeleteConfirmOpen(true);
    setDeleteError(null);
  };

  // Function to confirm deletion
  const confirmDelete = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/websites?id=${deletingId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete website');
      }

      // Close modal and refresh data
      setIsDeleteConfirmOpen(false);
      setDeletingId(null);
      router.refresh(); // Refresh the page to get updated data
    } catch (error) {
      console.error('Error deleting website:', error);
      setDeleteError((error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to get status badge class based on status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'verified':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'failed':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };

  if (websites.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-semibold mb-2">No websites yet</h3>
        <p className="mb-4">Get started by adding your first website</p>
        <Link href="/dashboard/websites/add" className="btn btn-primary">
          Add Website
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Store Name</th>
              <th>Domain</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {websites.map((website) => (
              <tr key={website.id} className="hover">
                <td className="font-medium">{website.name}</td>
                <td>{website.domain}</td>
                <td>{format(new Date(website.createdAt), 'MMM d, yyyy')}</td>
                <td>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/websites/${website.id}`}
                      className="btn btn-xs btn-ghost"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(website.id)}
                      className="btn btn-xs btn-ghost btn-error"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal-box p-6 max-w-md bg-base-100 rounded-lg shadow-lg">
            <h3 className="font-bold text-lg">Confirm Deletion</h3>
            <p className="py-4">
              Are you sure you want to delete this website? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="alert alert-error mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{deleteError}</span>
              </div>
            )}

            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 