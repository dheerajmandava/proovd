'use client';

import { useState } from 'react';
import { UserData, WebsiteData } from '@/app/lib/hooks';
import { toast } from 'react-hot-toast';

interface SettingsTabProps {
  websiteId: string;
  initialWebsite: WebsiteData;
  initialUserData: UserData;
}

export default function SettingsTab({ websiteId, initialWebsite, initialUserData }: SettingsTabProps) {
  const [newDomain, setNewDomain] = useState('');
  const [allowedDomains, setAllowedDomains] = useState<string[]>(initialWebsite?.allowedDomains || []);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    defaultTheme: initialWebsite?.settings?.theme || 'light',
    defaultPosition: initialWebsite?.settings?.position || 'bottom-right',
  });

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/websites/${websiteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            theme: settings.defaultTheme,
            position: settings.defaultPosition,
          },
          allowedDomains
        })
      });

      if (!res.ok) throw new Error('Failed to save settings');
      toast.success('Settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddDomain() {
    if (!newDomain.trim()) return;
    const domain = newDomain.trim().toLowerCase();
    if (allowedDomains.includes(domain)) {
      toast.error('Domain already added');
      return;
    }
    setAllowedDomains([...allowedDomains, domain]);
    setNewDomain('');
  }

  function handleRemoveDomain(domain: string) {
    setAllowedDomains(allowedDomains.filter(d => d !== domain));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Campaign Defaults */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Campaign Defaults</h2>
            <p className="text-sm text-base-content/70 mb-4">
              Default settings for new campaigns. Individual campaigns can override these.
            </p>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Default Theme</span>
                </label>
                <select
                  value={settings.defaultTheme}
                  onChange={(e) => setSettings({ ...settings, defaultTheme: e.target.value })}
                  className="select select-bordered"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Default Position</span>
                </label>
                <select
                  value={settings.defaultPosition}
                  onChange={(e) => setSettings({ ...settings, defaultPosition: e.target.value })}
                  className="select select-bordered"
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="top">Top Bar</option>
                  <option value="bottom">Bottom Bar</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Allowed Domains */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Allowed Domains</h2>
            <p className="text-sm text-base-content/70 mb-4">
              Your widget will only load on {initialWebsite?.domain}. Add additional domains if needed.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <div className="badge badge-outline badge-lg">{initialWebsite?.domain} (primary)</div>
              {allowedDomains.map((domain) => (
                <div key={domain} className="badge badge-primary badge-lg gap-2">
                  {domain}
                  <button onClick={() => handleRemoveDomain(domain)} className="btn btn-ghost btn-xs">×</button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="subdomain.example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="input input-bordered flex-grow"
                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
              />
              <button onClick={handleAddDomain} className="btn btn-outline">Add</button>
            </div>
          </div>
        </div>

        {/* Shopify Integration */}
        <div className="card bg-base-100 shadow border-l-4 border-l-[#96bf48]">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2">
              <svg className="w-6 h-6 text-[#96bf48]" viewBox="0 0 24 24" fill="currentColor"><path d="M12.0002 0.000305176C11.5315 0.000305176 11.0844 0.191192 10.7424 0.536691C10.4004 0.882191 10.2082 1.3415 10.2082 1.81231V8.29176H21.2007L16.4805 1.54303C16.3276 1.32569 16.1264 1.14652 15.8953 1.02196C15.6642 0.897405 15.4102 0.831518 15.1565 0.830305H12.0002V0.000305176ZM8.70817 9.79176V2.22256C8.70775 1.95669 8.77884 1.69527 8.91386 1.46618C9.04889 1.23709 9.24278 1.04902 9.47467 0.922055C9.70656 0.795094 9.96767 0.734032 10.2299 0.74543C10.4922 0.756828 10.7456 0.840255 10.9632 0.986805L15.3412 3.92481L23.2372 15.2123C23.5856 15.7107 23.7712 16.3072 23.7712 16.9138C23.7712 18.7913 22.2512 20.3123 20.3752 20.3123H17.8932C17.6186 21.6111 16.4805 22.5838 15.1052 22.5838C13.7297 22.5838 12.5915 21.6111 12.3169 20.3123H8.54117C8.26657 21.6111 7.12842 22.5838 5.75292 22.5838C4.37742 22.5838 3.23927 21.6111 2.96467 20.3123H2.81242C1.25917 20.3123 0 19.0526 0 17.5003V9.79176H8.70817ZM17.2289 18.103H20.375C21.0315 18.103 21.5622 17.5714 21.5622 16.9136C21.5622 16.7018 21.4972 16.4969 21.3757 16.3216L13.8817 5.60156L10.916 9.79105V18.1023L17.2289 18.103ZM15.1042 19.333H12.9794V17.5005H17.2294V19.333H15.1057C15.1053 19.333 15.1049 19.333 15.1042 19.333ZM5.75017 19.333H3.62542V17.5005H7.87542V19.333H5.75017Z" /></svg>
              Shopify Integration
            </h2>
            <p className="text-sm text-base-content/70 mb-4">
              Connect your Shopify store to enable price testing and automatic product syncing.
            </p>

            <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
              <div>
                <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Status</div>
                {initialWebsite.shopify?.shop ? (
                  <div className="font-semibold flex items-center gap-2 text-success">
                    <span className="w-2 h-2 rounded-full bg-success"></span>
                    Connected to {initialWebsite.shopify.shop}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="font-semibold flex items-center gap-2 text-base-content/50">
                      <span className="w-2 h-2 rounded-full bg-base-300"></span>
                      Not Connected
                    </div>
                  </div>
                )}
              </div>
              {initialWebsite.shopify?.shop && (
                <button
                  onClick={async () => {
                    try {
                      toast.loading('Installing widget script...', { id: 'install-script' });
                      const res = await fetch(`/api/websites/${websiteId}/install-script`, {
                        method: 'POST',
                      });
                      const data = await res.json();
                      if (res.ok) {
                        toast.success('Widget script installed! Check your store.', { id: 'install-script' });
                      } else {
                        toast.error(data.error || 'Failed to install script', { id: 'install-script' });
                      }
                    } catch (err) {
                      toast.error('Failed to install script', { id: 'install-script' });
                    }
                  }}
                  className="btn btn-sm btn-success gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Install Widget Script
                </button>
              )}
            </div>

            {/* Manual Connection / Tunnel Override */}
            <div className="mt-4 pt-4 border-t border-base-200">
              <p className="text-xs font-semibold mb-2 text-base-content/70">
                Dev Mode: If you get a "Whitelist" error, enter the Tunnel URL from your terminal below.
              </p>
              <div className="flex flex-col gap-2">
                {!initialWebsite.shopify?.shop && (
                  <input
                    type="text"
                    placeholder="Shop Domain (e.g. store.myshopify.com)"
                    className="input input-sm input-bordered w-full"
                    id="connect-shop-input"
                  />
                )}
                <input
                  type="text"
                  placeholder="Tunnel URL (e.g. https://xxxx.trycloudflare.com)"
                  className="input input-sm input-bordered w-full"
                  id="connect-tunnel-input"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const shopInput = document.getElementById('connect-shop-input') as HTMLInputElement;
                      const tunnelInput = document.getElementById('connect-tunnel-input') as HTMLInputElement;

                      const shop = initialWebsite.shopify?.shop || shopInput?.value;
                      const tunnelUrl = tunnelInput?.value;

                      if (!shop) {
                        toast.error('Please enter your Shopify store domain');
                        return;
                      }

                      let url = `/api/shopify/auth?shop=${shop}&websiteId=${websiteId}`;
                      if (tunnelUrl) {
                        url += `&tunnel_url=${encodeURIComponent(tunnelUrl)}`;
                      }

                      window.location.href = url;
                    }}
                    className="btn btn-sm btn-primary gap-2"
                  >
                    {initialWebsite.shopify?.shop ? 'Reconnect with Options' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Widget Installation */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Widget Installation</h2>
            <p className="text-sm text-base-content/70 mb-4">
              Add this code to your website to enable campaigns.
            </p>

            <div className="mockup-code">
              <pre><code>{`<script src="https://www.proovd.in/api/cdn/w/${websiteId}"></script>`}</code></pre>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
            {isSaving ? <span className="loading loading-spinner"></span> : 'Save Settings'}
          </button>
        </div>
      </div >

      {/* Sidebar */}
      < div className="lg:col-span-1" >
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">About Settings</h2>
            <div className="prose prose-sm">
              <p><strong>Campaign Defaults:</strong> Set default theme and position for new campaigns.</p>
              <p><strong>Allowed Domains:</strong> Control where your widget can load.</p>
              <p><strong>Widget Code:</strong> Install this on every page where you want campaigns to appear.</p>
            </div>

            <div className="alert alert-info mt-4">
              <span>Campaign-specific settings (position, triggers, content) are configured per-campaign in the Campaigns tab.</span>
            </div>
          </div>
        </div>
      </div >
    </div >
  );
}