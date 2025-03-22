'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  KeyIcon, 
  PlusIcon, 
  TrashIcon, 
  ClipboardIcon, 
  CheckIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface ApiKey {
  id: string;
  key: string;
  name: string;
  allowedOrigins: string[];
  createdAt: string;
  lastUsed?: string;
}

interface Website {
  id: string;
  name: string;
  domain: string;
  apiKeys: ApiKey[];
  status: string;
}

export default function ApiKeysPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [website, setWebsite] = useState<Website | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyData, setNewKeyData] = useState<ApiKey | null>(null);
  const [keyVisibility, setKeyVisibility] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<Record<string, boolean>>({});
  
  // New key form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyOrigin, setNewKeyOrigin] = useState('');
  const [newKeyOrigins, setNewKeyOrigins] = useState<string[]>([]);
  
  // Fetch website data
  useEffect(() => {
    async function fetchWebsite() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/websites/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch website data');
        }
        
        const data = await response.json();
        setWebsite(data.website);
        
        // Initialize key visibility
        const visibility: Record<string, boolean> = {};
        data.website.apiKeys.forEach((key: ApiKey) => {
          visibility[key.id] = false;
        });
        setKeyVisibility(visibility);

        // Check if website is verified, if not redirect to verification page
        if (data.website.verification.status !== 'verified' && data.website.status !== 'verified') {
          setError('This website needs to be verified before you can manage API keys.');
          // Redirect to verification page after a short delay
          setTimeout(() => {
            router.push(`/dashboard/websites/${params.id}/verify`);
          }, 3000);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchWebsite();
  }, [params.id, router]);
  
  // Handle adding a new origin to the list
  function handleAddOrigin() {
    if (!newKeyOrigin || newKeyOrigins.includes(newKeyOrigin)) {
      return;
    }
    
    setNewKeyOrigins([...newKeyOrigins, newKeyOrigin]);
    setNewKeyOrigin('');
  }
  
  // Handle removing an origin from the list
  function handleRemoveOrigin(origin: string) {
    setNewKeyOrigins(newKeyOrigins.filter(o => o !== origin));
  }
  
  // Handle creating a new API key
  async function handleCreateKey() {
    if (!newKeyName.trim()) {
      setError('API key name is required');
      return;
    }
    
    try {
      setIsCreating(true);
      setError(null);
      
      const response = await fetch(`/api/websites/${params.id}/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newKeyName.trim(),
          allowedOrigins: newKeyOrigins.length > 0 ? newKeyOrigins : [website?.domain || ''],
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create API key');
      }
      
      // Set the newly created key data for display
      setNewKeyData(data.apiKey);
      setShowNewKey(true);
      
      // Reset form
      setNewKeyName('');
      setNewKeyOrigin('');
      setNewKeyOrigins([]);
      
      // Refresh website data to include the new key
      const websiteResponse = await fetch(`/api/websites/${params.id}`);
      const websiteData = await websiteResponse.json();
      setWebsite(websiteData.website);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  }
  
  // Handle deleting an API key
  async function handleDeleteKey(keyId: string) {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/websites/${params.id}/api-keys/${keyId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete API key');
      }
      
      // Refresh website data to reflect the deleted key
      const websiteResponse = await fetch(`/api/websites/${params.id}`);
      const websiteData = await websiteResponse.json();
      setWebsite(websiteData.website);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  }
  
  // Toggle API key visibility
  function toggleKeyVisibility(keyId: string) {
    setKeyVisibility({
      ...keyVisibility,
      [keyId]: !keyVisibility[keyId],
    });
  }
  
  // Format date for display
  function formatDate(dateString?: string) {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
  // Copy API key to clipboard
  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess({ ...copySuccess, [id]: true });
        setTimeout(() => {
          setCopySuccess({ ...copySuccess, [id]: false });
        }, 2000);
      })
      .catch(() => {
        setError('Failed to copy to clipboard');
      });
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">API Keys</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/dashboard/websites">Websites</Link></li>
            <li><Link href={`/dashboard/websites/${params.id}`}>{website?.name}</Link></li>
            <li>API Keys</li>
          </ul>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}
      
      {/* Display newly created API key */}
      {showNewKey && newKeyData && (
        <div className="alert alert-success mb-6">
          <div className="flex flex-col items-start">
            <div className="font-semibold mb-2">API key created successfully!</div>
            <div className="bg-base-200 p-2 rounded-lg flex items-center justify-between w-full">
              <code className="text-sm">{newKeyData.key}</code>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => copyToClipboard(newKeyData.key, 'new')}
              >
                {copySuccess['new'] ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <ClipboardIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="text-sm mt-2">
              <strong>Important:</strong> This is the only time you&apos;ll see this key. Save it in a secure location.
            </div>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={() => setShowNewKey(false)}>
            Dismiss
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        {/* Create new API key card */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title flex items-center">
              <KeyIcon className="w-5 h-5 mr-2" />
              Create New API Key
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">API Key Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Production, Development"
                  className="input input-bordered"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
                <label className="label">
                  <span className="label-text-alt">A friendly name to identify this API key</span>
                </label>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Allowed Origins</span>
                </label>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="e.g., example.com, *.example.com"
                    className="input input-bordered flex-grow"
                    value={newKeyOrigin}
                    onChange={(e) => setNewKeyOrigin(e.target.value)}
                  />
                  <button
                    className="btn btn-primary ml-2"
                    onClick={handleAddOrigin}
                    disabled={!newKeyOrigin}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
                <label className="label">
                  <span className="label-text-alt">Domains allowed to use this API key (leave empty for all)</span>
                </label>
              </div>
            </div>
            
            {/* Display added origins */}
            {newKeyOrigins.length > 0 && (
              <div className="mt-2">
                <label className="label">
                  <span className="label-text">Added Origins:</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {newKeyOrigins.map(origin => (
                    <div key={origin} className="badge badge-primary badge-outline gap-2">
                      {origin}
                      <button onClick={() => handleRemoveOrigin(origin)}>
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-primary"
                onClick={handleCreateKey}
                disabled={isCreating || !newKeyName.trim()}
              >
                {isCreating && <span className="loading loading-spinner loading-xs"></span>}
                Create API Key
              </button>
            </div>
          </div>
        </div>
        
        {/* Existing API keys */}
        {website && website.apiKeys.length > 0 && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Your API Keys</h2>
              
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>API Key</th>
                      <th>Origins</th>
                      <th>Created</th>
                      <th>Last Used</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {website.apiKeys.map(key => (
                      <tr key={key.id}>
                        <td className="font-medium">{key.name}</td>
                        <td>
                          <div className="flex items-center">
                            <code className="max-w-[150px] truncate">
                              {keyVisibility[key.id] ? key.key : key.key.replace(/^(spfy_[a-z0-9]{4}).*([a-z0-9]{4})$/, '$1...$2')}
                            </code>
                            <button
                              className="btn btn-ghost btn-xs ml-2"
                              onClick={() => toggleKeyVisibility(key.id)}
                            >
                              {keyVisibility[key.id] ? (
                                <EyeSlashIcon className="w-4 h-4" />
                              ) : (
                                <EyeIcon className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => copyToClipboard(key.key, key.id)}
                            >
                              {copySuccess[key.id] ? (
                                <CheckIcon className="w-4 h-4" />
                              ) : (
                                <ClipboardIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td>
                          {key.allowedOrigins && key.allowedOrigins.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {key.allowedOrigins.map(origin => (
                                <div key={origin} className="badge badge-sm">
                                  {origin}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">All domains</span>
                          )}
                        </td>
                        <td>{formatDate(key.createdAt)}</td>
                        <td>{formatDate(key.lastUsed)}</td>
                        <td>
                          {/* Only allow deleting non-primary keys */}
                          {website.apiKeys.indexOf(key) > 0 && (
                            <button
                              className="btn btn-error btn-xs"
                              onClick={() => handleDeleteKey(key.id)}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-sm">
                <p className="text-warning">
                  <strong>Note:</strong> Your primary API key cannot be deleted. If it has been compromised,
                  please contact support to have it rotated.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Using Your API Keys</h2>
            
            <div className="text-sm space-y-4">
              <p>
                Your API key is used to authenticate requests to the Proovd API.
                Keep your API keys secure and never share them in public repositories or client-side code.
              </p>
              
              <div>
                <h3 className="font-semibold mb-2">Include your API key in requests</h3>
                <p className="mb-2">You can include your API key in one of two ways:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>As a query parameter: <code>?apiKey=spfy_your_key</code></li>
                  <li>As a header: <code>x-api-key: spfy_your_key</code></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Domain Restrictions</h3>
                <p>
                  If you&apos;ve specified allowed origins, API requests will only be accepted from those domains.
                  This helps prevent unauthorized use of your API key.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Rate Limits</h3>
                <p>
                  Each API key has a rate limit of 100 requests per minute.
                  If you need higher limits, please contact support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 