'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// Campaign Types (Simplified)
const CAMPAIGN_TYPES = [
  { id: 'ab-test', name: 'A/B Experiment', description: 'Test changes against original content', icon: '🧪' },
];

// Variant interface
interface Variant {
  id: string;
  name: string;
  content: {
    selector: string;
    action: string;
    body: string; // Replacement content
    attributeName?: string;
    attributeValue?: string;
  };
}

// Form state interface
interface CampaignFormData {
  name: string;
  type: 'ab-test';
  status: 'draft' | 'running' | 'paused';
  trafficAllocation: number; // 0-100
  targetUrl: string; // The URL where the experiment runs (for visual editor)
  targeting: {
    urlOperator: 'contains' | 'is' | 'regex';
    urlValue: string;
    device: 'all' | 'desktop' | 'mobile';
    visitor: 'all' | 'new' | 'returning';
  };
  variants: Variant[];
}

export default function NewCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const websiteId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Visual Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    type: 'ab-test',
    status: 'draft',
    trafficAllocation: 100,
    targetUrl: '',
    targeting: {
      urlOperator: 'contains',
      urlValue: '',
      device: 'all',
      visitor: 'all',
    },
    variants: [
      // Start with one variant (Variant B)
      {
        id: 'variant-b',
        name: 'Variant B',
        content: {
          selector: '',
          action: 'replaceText',
          body: '',
        }
      }
    ],
  });

  // Update form field
  function updateField(path: string, value: any) {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        if (Array.isArray(current[keys[i]])) {
          current = current[keys[i]];
        } else {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  }

  // Variant Management
  function addVariant() {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: `variant-${prev.variants.length + 2}`, // +2 because +1 for 0-index and +1 for next char (roughly)
          name: `Variant ${String.fromCharCode(66 + prev.variants.length)}`, // B, C, D...
          content: {
            selector: '',
            action: 'replaceText',
            body: '',
          }
        }
      ]
    }));
  }

  function removeVariant(index: number) {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  }

  function updateVariant(index: number, field: string, value: any) {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      const variant = { ...newVariants[index] };

      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        variant.content = { ...variant.content, [child]: value };
      } else {
        (variant as any)[field] = value;
      }

      newVariants[index] = variant;
      return { ...prev, variants: newVariants };
    });
  }

  // Visual Editor Logic
  function openVisualEditor(variantIndex: number) {
    const url = formData.targetUrl;
    if (!url) {
      alert('Please enter a Target URL first');
      return;
    }

    // Store which variant we are editing
    // We'll use a temporary ID or index to know where to put the result
    setActiveVariantId(formData.variants[variantIndex].id);

    const separator = url.includes('?') ? '&' : '?';
    window.open(`${url}${separator}proovd_editor=true`, '_blank', 'width=1200,height=800');
    setIsEditorOpen(true);
  }

  // Listen for messages from visual editor
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PROOVD_ELEMENT_SELECTED') {
        const { selector, tagName, text } = event.data;

        if (activeVariantId) {
          setFormData(prev => {
            const newVariants = prev.variants.map(v => {
              if (v.id === activeVariantId) {
                return {
                  ...v,
                  content: {
                    ...v.content,
                    selector,
                    // Auto-fill body if empty
                    body: v.content.body || text
                  }
                };
              }
              return v;
            });
            return { ...prev, variants: newVariants };
          });

          alert(`Element Selected: ${selector}`);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeVariantId]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Experiment name is required');
      return;
    }

    if (!formData.targetUrl.trim()) {
      setError('Target URL is required');
      return;
    }

    // Build campaign data
    const campaignData = {
      name: formData.name,
      type: 'ab-test',
      status: formData.status,
      trafficAllocation: formData.trafficAllocation,
      // Map targeting to triggers format expected by backend
      triggers: [
        {
          type: 'pageUrl',
          operator: formData.targeting.urlOperator,
          value: formData.targeting.urlValue || formData.targetUrl, // Fallback to target URL if rule is empty
          enabled: true
        },
        {
          type: 'device',
          operator: 'is',
          value: formData.targeting.device,
          enabled: formData.targeting.device !== 'all'
        },
        {
          type: 'isReturning',
          value: formData.targeting.visitor === 'returning',
          enabled: formData.targeting.visitor !== 'all'
        }
      ].filter(t => t.enabled),
      // Base content (Control) - usually empty or just metadata
      content: {
        title: 'Control',
        body: 'Original Content'
      },
      // Variants
      variants: formData.variants.map(v => ({
        id: v.id,
        content: v.content
      }))
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/websites/${websiteId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create experiment');
      }

      router.push(`/dashboard/websites/${websiteId}?tab=campaigns`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Create A/B Experiment</h1>
        <p className="text-base-content/60">
          Test changes against your original content to optimize conversions
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Experiment Info */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-lg">Experiment Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Experiment Name</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., Homepage Hero Test"
                  className="input input-bordered"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Status</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="select select-bordered"
                  disabled={isSubmitting}
                >
                  <option value="draft">Draft</option>
                  <option value="running">Running</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text font-medium">Traffic Allocation ({formData.trafficAllocation}%)</span>
                <span className="label-text-alt">Percentage of visitors included in experiment</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.trafficAllocation}
                onChange={(e) => updateField('trafficAllocation', parseInt(e.target.value))}
                className="range range-primary"
              />
            </div>
          </div>
        </div>

        {/* Targeting */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-lg">Targeting Rules</h2>
            <p className="text-base-content/60 text-sm">Where should this experiment run?</p>

            <div className="space-y-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Target URL</span>
                </label>
                <div className="join">
                  <select
                    value={formData.targeting.urlOperator}
                    onChange={(e) => updateField('targeting.urlOperator', e.target.value)}
                    className="select select-bordered join-item"
                  >
                    <option value="contains">URL Contains</option>
                    <option value="is">URL Is Exactly</option>
                  </select>
                  <input
                    type="text"
                    value={formData.targetUrl}
                    onChange={(e) => {
                      updateField('targetUrl', e.target.value);
                      updateField('targeting.urlValue', e.target.value);
                    }}
                    placeholder="https://example.com/pricing"
                    className="input input-bordered join-item flex-1"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Device</span>
                  </label>
                  <select
                    value={formData.targeting.device}
                    onChange={(e) => updateField('targeting.device', e.target.value)}
                    className="select select-bordered"
                  >
                    <option value="all">All Devices</option>
                    <option value="desktop">Desktop Only</option>
                    <option value="mobile">Mobile Only</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Visitor Type</span>
                  </label>
                  <select
                    value={formData.targeting.visitor}
                    onChange={(e) => updateField('targeting.visitor', e.target.value)}
                    className="select select-bordered"
                  >
                    <option value="all">All Visitors</option>
                    <option value="new">New Visitors Only</option>
                    <option value="returning">Returning Visitors Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Variations */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title text-lg">Variations</h2>
              <button
                type="button"
                onClick={addVariant}
                className="btn btn-sm btn-outline"
              >
                + Add Variant
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {/* Control - Always present */}
              <div className="card bg-base-200 border-l-4 border-base-content/20">
                <div className="card-body p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">Control (Original)</h3>
                      <p className="text-sm text-base-content/60">The original version of your page</p>
                    </div>
                    <div className="badge badge-ghost">Reference</div>
                  </div>
                </div>
              </div>

              {/* Dynamic Variants */}
              {formData.variants.map((variant, index) => (
                <div key={variant.id} className="card bg-base-200 border-l-4 border-primary">
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, 'name', e.target.value)}
                          className="input input-sm input-ghost font-bold text-lg px-0 w-40"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openVisualEditor(index)}
                          className="btn btn-sm btn-primary"
                        >
                          🎨 Open Visual Editor
                        </button>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="btn btn-sm btn-ghost text-error"
                          disabled={formData.variants.length <= 1}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Manual Edit Fallback */}
                    <div className="collapse collapse-arrow bg-base-100 rounded-box">
                      <input type="checkbox" />
                      <div className="collapse-title text-sm font-medium">
                        Advanced / Manual Edit
                      </div>
                      <div className="collapse-content">
                        <div className="form-control mt-2">
                          <label className="label">
                            <span className="label-text">CSS Selector</span>
                          </label>
                          <input
                            type="text"
                            value={variant.content.selector}
                            onChange={(e) => updateVariant(index, 'content.selector', e.target.value)}
                            placeholder="#hero-title"
                            className="input input-bordered input-sm font-mono"
                          />
                        </div>
                        <div className="form-control mt-2">
                          <label className="label">
                            <span className="label-text">Action</span>
                          </label>
                          <select
                            value={variant.content.action}
                            onChange={(e) => updateVariant(index, 'content.action', e.target.value)}
                            className="select select-bordered select-sm"
                          >
                            <option value="replaceText">Replace Text</option>
                            <option value="replaceHtml">Replace HTML</option>
                            <option value="addClass">Add Class</option>
                            <option value="style">Change Style</option>
                          </select>
                        </div>
                        <div className="form-control mt-2">
                          <label className="label">
                            <span className="label-text">Content / Value</span>
                          </label>
                          <textarea
                            value={variant.content.body}
                            onChange={(e) => updateVariant(index, 'content.body', e.target.value)}
                            className="textarea textarea-bordered h-20 font-mono text-sm"
                            placeholder="New content..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Link href={`/dashboard/websites/${websiteId}?tab=campaigns`} className="btn btn-ghost">
            Cancel
          </Link>
          <button
            type="submit"
            className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Launch Experiment'}
          </button>
        </div>
      </form>
    </div>
  );
}