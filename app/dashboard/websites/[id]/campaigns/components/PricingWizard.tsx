'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    CurrencyDollarIcon,
    PlusIcon,
    TrashIcon,
    RocketLaunchIcon,
    LinkIcon,
    CheckCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

// Interfaces
interface ShopifyVariant {
    id: string;
    title: string;
    price: string;
    sku: string;
    inventoryQuantity: number;
    availableForSale: boolean;
}

interface ShopifyProduct {
    id: string;
    title: string;
    handle: string;
    variants: ShopifyVariant[];
    featuredImage?: { url: string };
}

interface PricingVariant {
    id: string;
    variantId: string;
    name: string;
    price: number;
    trafficPercent: number;
}

interface PricingFormData {
    name: string;
    type: 'pricing';
    status: 'draft' | 'running' | 'paused';
    // New fields
    testType: 'price_test' | 'split_test';
    pricingConfig: {
        productId: string;
        productHandle: string;
        productUrl: string;
        variants: PricingVariant[];
    };
}

interface PricingWizardProps {
    websiteId: string;
    initialData?: Partial<PricingFormData>;
    campaignId?: string;
    isEditing?: boolean;
}

export default function PricingWizard({ websiteId, initialData, campaignId, isEditing = false }: PricingWizardProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Shopify connection state
    const [shopifyConnected, setShopifyConnected] = useState(false);
    const [shopifyShop, setShopifyShop] = useState('');
    const [products, setProducts] = useState<ShopifyProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [shopDomain, setShopDomain] = useState('');

    // Form State
    const [formData, setFormData] = useState<PricingFormData>({
        name: initialData?.name || '',
        type: 'pricing',
        // Default to price test for backward compat
        testType: (initialData as any)?.testType || 'price_test',
        status: (initialData?.status as any) || 'draft',
        pricingConfig: {
            productId: initialData?.pricingConfig?.productId || '',
            productHandle: initialData?.pricingConfig?.productHandle || '',
            productUrl: initialData?.pricingConfig?.productUrl || '',
            variants: Array.isArray(initialData?.pricingConfig?.variants)
                ? initialData!.pricingConfig!.variants.map((v: any) => ({
                    ...v,
                    id: v.id || v._id || `variant-${Math.random()}`
                }))
                : []
        }
    });

    // Check Shopify connection on mount
    useEffect(() => {
        if (isEditing && initialData) {
            console.log('EDIT MODE: Initial Data:', JSON.stringify(initialData, null, 2));
            setFormData({
                name: initialData.name || '',
                type: 'pricing',
                testType: (initialData as any)?.testType || 'price_test',
                status: (initialData.status as any) || 'draft',
                pricingConfig: {
                    productId: initialData.pricingConfig?.productId || '',
                    productHandle: initialData.pricingConfig?.productHandle || '',
                    productUrl: initialData.pricingConfig?.productUrl || '',
                    variants: Array.isArray(initialData.pricingConfig?.variants)
                        ? initialData.pricingConfig.variants.map((v: any) => ({
                            ...v,
                            id: v.id || v._id || `variant-${Math.random()}`
                        }))
                        : []
                }
            });
        }
        checkShopifyConnection();
    }, [websiteId, initialData, isEditing]);

    const checkShopifyConnection = async () => {
        try {
            setLoadingProducts(true);
            const res = await fetch(`/api/shopify/products?websiteId=${websiteId}`);

            if (!res.ok) {
                // If 400/404, it just means not connected or not found
                if (res.status === 400 || res.status === 404) {
                    setShopifyConnected(false);
                    return;
                }
                throw new Error(`API Error: ${res.status}`);
            }

            const data = await res.json();

            if (data.connected) {
                setShopifyConnected(true);
                setShopifyShop(data.shop);
                setProducts(data.products || []);

                // Restore selected product if editing
                const savedProductId = formData.pricingConfig?.productId;
                if (savedProductId) {
                    const product = (data.products || []).find((p: any) => p.id === savedProductId);
                    if (product) {
                        setSelectedProduct(product);
                    }
                }
            } else {
                setShopifyConnected(false);
            }
        } catch (err) {
            console.error('Failed to check Shopify connection:', err);
            // Don't show error to user for connection check, just show connect UI
            setShopifyConnected(false);
        } finally {
            setLoadingProducts(false);
        }
    };

    const connectShopify = () => {
        if (!shopDomain.includes('.myshopify.com')) {
            setError('Please enter a valid Shopify domain (e.g., your-store.myshopify.com)');
            return;
        }
        // Redirect to OAuth flow
        window.location.href = `/api/shopify/auth?shop=${shopDomain}&websiteId=${websiteId}`;
    };

    // Select product and auto-populate variants
    const handleProductSelect = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setSelectedProduct(product);

        // Auto-populate form with product variants
        // If Price Test: Default to 1st variant (Control) and add 1 fake variant
        // If Split Test: Default to top 2 variants as Control vs B

        let variants: PricingVariant[];

        if (formData.testType === 'split_test') {
            // Split Test: Use real variants
            variants = product.variants.slice(0, 2).map((v, idx) => ({
                id: `variant-${idx}`,
                variantId: v.id.replace('gid://shopify/ProductVariant/', ''),
                name: v.title || `Variant ${idx + 1}`,
                price: parseFloat(v.price) || 0,
                trafficPercent: 50
            }));
            // If only 1 variant exists, add a placeholder
            if (variants.length < 2) {
                variants.push({
                    id: `variant-1`,
                    variantId: '',
                    name: 'Select Variant B',
                    price: 0,
                    trafficPercent: 50
                });
            }
        } else {
            // Price Test: Clone the 1st variant for testing
            const firstVariant = product.variants[0];
            variants = [
                {
                    id: `variant-0`,
                    variantId: firstVariant.id.replace('gid://shopify/ProductVariant/', ''),
                    name: `Original: ${firstVariant.title}`,
                    price: parseFloat(firstVariant.price),
                    trafficPercent: 50
                },
                {
                    id: `variant-1`,
                    variantId: firstVariant.id.replace('gid://shopify/ProductVariant/', ''), // Same ID!
                    name: `Test Price A`,
                    price: (parseFloat(firstVariant.price) * 0.9), // Default 10% off
                    trafficPercent: 50
                }
            ];
        }

        setFormData(prev => ({
            ...prev,
            pricingConfig: {
                productId: product.id,
                productHandle: product.handle,
                productUrl: `https://${shopifyShop}/products/${product.handle}`,
                variants
            }
        }));
    };

    // Update pricingConfig field
    const updatePricingConfig = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            pricingConfig: {
                ...prev.pricingConfig,
                [field]: value
            }
        }));
    };

    // Variant Management
    const addVariant = () => {
        const newVariants = [...formData.pricingConfig.variants];
        const newPercent = Math.floor(100 / (newVariants.length + 1));
        newVariants.forEach(v => v.trafficPercent = newPercent);

        if (formData.testType === 'split_test') {
            // Add empty slot for real variant
            newVariants.push({
                id: `variant-${Date.now()}`,
                variantId: '',
                name: 'Select Variant',
                price: 0,
                trafficPercent: newPercent
            });
        } else {
            // Add price clone of selected product
            // TODO: Ideally allow cloning specific variant if product has multiple
            const basePrice = selectedProduct ? parseFloat(selectedProduct.variants[0].price) : 0;
            const baseId = selectedProduct ? selectedProduct.variants[0].id.replace('gid://shopify/ProductVariant/', '') : '';

            newVariants.push({
                id: `variant-${Date.now()}`,
                variantId: baseId,
                name: `Test Price ${String.fromCharCode(64 + newVariants.length + 1)}`,
                price: basePrice,
                trafficPercent: newPercent
            });
        }
        updatePricingConfig('variants', newVariants);
    };

    const removeVariant = (index: number) => {
        if (formData.pricingConfig.variants.length <= 2) {
            setError('Minimum 2 variants required');
            return;
        }
        const newVariants = formData.pricingConfig.variants.filter((_, i) => i !== index);
        const newPercent = Math.floor(100 / newVariants.length);
        newVariants.forEach(v => v.trafficPercent = newPercent);
        updatePricingConfig('variants', newVariants);
    };

    const updateVariant = (index: number, field: keyof PricingVariant, value: any) => {
        const newVariants = [...formData.pricingConfig.variants];
        (newVariants[index] as any)[field] = value;
        updatePricingConfig('variants', newVariants);
    };

    // Submit
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');

        if (!formData.name.trim()) {
            setError('Experiment name is required');
            setIsSubmitting(false);
            return;
        }

        if (!formData.pricingConfig.productHandle) {
            setError('Please select a product');
            setIsSubmitting(false);
            return;
        }

        const hasEmptyVariantId = formData.pricingConfig.variants.some(v => !v.variantId.trim());
        if (hasEmptyVariantId) {
            setError('All variant IDs are required');
            setIsSubmitting(false);
            return;
        }

        try {
            const payload = {
                name: formData.name,
                type: 'pricing',
                status: formData.status,
                pricingConfig: formData.pricingConfig
            };

            const url = isEditing
                ? `/api/websites/${websiteId}/campaigns/${campaignId}`
                : `/api/websites/${websiteId}/campaigns`;

            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save experiment');
            router.push(`/dashboard/websites/${websiteId}?tab=campaigns`);
        } catch (err: any) {
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    const totalTraffic = formData.pricingConfig.variants.reduce((sum, v) => sum + v.trafficPercent, 0);

    return (
        <div className="max-w-3xl mx-auto pb-24">
            {/* Header */}
            <div className="mb-8 pt-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <CurrencyDollarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{isEditing ? 'Edit' : 'New'} Price Test</h1>
                        <p className="text-base-content/60 text-sm">Test different price points to maximize profit</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-error mb-6 shadow-sm rounded-md">
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-10">
                {/* Section 1: Experiment Details */}
                <section className="relative pl-8 border-l-2 border-base-200">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-base-100"></div>
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">Experiment Details</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label text-xs font-bold uppercase text-base-content/50">Experiment Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="input input-bordered w-full"
                                placeholder="e.g. Premium Widget Price Test"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label text-xs font-bold uppercase text-base-content/50">Test Type</label>
                            <div className="flex gap-4">
                                <label className={`flex-1 border rounded-lg p-4 cursor-pointer hover:border-emerald-500 transition-colors ${formData.testType === 'price_test' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-base-200'}`}>
                                    <input
                                        type="radio"
                                        name="testType"
                                        value="price_test"
                                        checked={formData.testType === 'price_test'}
                                        onChange={() => setFormData(prev => ({ ...prev, testType: 'price_test' }))}
                                        className="sr-only"
                                    />
                                    <div className="font-bold mb-1">Price Test</div>
                                    <div className="text-xs text-base-content/60">Test different prices for the <br />SAME product variant.</div>
                                </label>

                                <label className={`flex-1 border rounded-lg p-4 cursor-pointer hover:border-emerald-500 transition-colors ${formData.testType === 'split_test' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-base-200'}`}>
                                    <input
                                        type="radio"
                                        name="testType"
                                        value="split_test"
                                        checked={formData.testType === 'split_test'}
                                        onChange={() => setFormData(prev => ({ ...prev, testType: 'split_test' }))}
                                        className="sr-only"
                                    />
                                    <div className="font-bold mb-1">Split Test</div>
                                    <div className="text-xs text-base-content/60">Test DIFFERENT variants against each other (A/B).</div>
                                </label>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Shopify Connection */}
                <section className="relative pl-8 border-l-2 border-base-200">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ring-4 ring-base-100 ${shopifyConnected ? 'bg-emerald-500' : 'bg-base-200'}`}></div>
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">Shopify Store</h2>
                        <p className="text-sm text-base-content/50">Connect your store to fetch products</p>
                    </div>

                    {loadingProducts ? (
                        <div className="flex items-center gap-2 text-base-content/60">
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            <span>Checking connection...</span>
                        </div>
                    ) : shopifyConnected ? (
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-emerald-900">Connected to Shopify</p>
                                    <p className="text-sm text-emerald-700">{shopifyShop}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => checkShopifyConnection()}
                                className="btn btn-ghost btn-xs text-emerald-700 hover:bg-emerald-100"
                            >
                                <ArrowPathIcon className="w-3 h-3 mr-1" /> Sync
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="alert alert-info shadow-sm">
                                <RocketLaunchIcon className="w-5 h-5" />
                                <span>Connect your Shopify store to automatically import products.</span>
                            </div>
                            <div className="form-control">
                                <label className="label text-xs font-bold uppercase text-base-content/50">Your Shopify Store Domain</label>
                                <div className="join w-full">
                                    <input
                                        type="text"
                                        value={shopDomain}
                                        onChange={e => setShopDomain(e.target.value)}
                                        className="input input-bordered join-item w-full font-mono text-sm"
                                        placeholder="your-store.myshopify.com"
                                    />
                                    <button
                                        onClick={connectShopify}
                                        className="btn btn-primary join-item gap-2"
                                    >
                                        Connect
                                    </button>
                                </div>
                                <div className="text-center mt-2">
                                    <button
                                        onClick={() => checkShopifyConnection()}
                                        className="btn btn-xs btn-ghost text-base-content/50"
                                    >
                                        <ArrowPathIcon className="w-3 h-3 mr-1" />
                                        Already connected? Check again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Section 3: Product Selection */}
                {shopifyConnected && (
                    <section className="relative pl-8 border-l-2 border-base-200">
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ring-4 ring-base-100 ${selectedProduct ? 'bg-emerald-500' : 'bg-base-200'}`}></div>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">Select Product</h2>
                            <p className="text-sm text-base-content/50">Choose the product to test pricing on</p>
                        </div>

                        <div className="form-control">
                            <select
                                value={selectedProduct?.id || ''}
                                onChange={e => handleProductSelect(e.target.value)}
                                className="select select-bordered w-full"
                            >
                                <option value="">Select a product...</option>
                                {products.map(product => (
                                    <option key={product.id} value={product.id}>
                                        {product.title} ({product.variants.length} variants)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedProduct && (
                            <div className="mt-3 p-3 bg-base-100 rounded-lg border border-base-200">
                                <div className="text-sm">
                                    <span className="font-medium">{selectedProduct.title}</span>
                                    <span className="text-base-content/50 ml-2">• {selectedProduct.variants.length} variants available</span>
                                </div>
                                <div className="text-xs text-base-content/40 mt-1 font-mono">
                                    /{selectedProduct.handle}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Section 4: Price Variants */}
                {(shopifyConnected && selectedProduct) && (
                    <section className="relative pl-8 border-l-2 border-base-200">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-base-200 ring-4 ring-base-100"></div>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">Price Variants</h2>
                            <p className="text-sm text-base-content/50">Configure which variants to test and traffic split</p>
                        </div>

                        <div className="space-y-4">
                            {formData.pricingConfig.variants.map((variant, idx) => (
                                <div key={variant.id} className="p-4 bg-base-50 rounded-lg border border-base-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <input
                                                type="text"
                                                value={variant.name}
                                                onChange={e => updateVariant(idx, 'name', e.target.value)}
                                                className="input input-ghost input-sm font-bold px-1"
                                            />
                                        </div>
                                        {formData.pricingConfig.variants.length > 2 && (
                                            <button onClick={() => removeVariant(idx)} className="btn btn-ghost btn-xs text-error">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="form-control md:col-span-2">
                                            <label className="label text-[10px] font-bold uppercase text-base-content/40">Shopify Variant</label>

                                            {formData.testType === 'split_test' ? (
                                                <select
                                                    value={variant.variantId}
                                                    onChange={e => {
                                                        const v = selectedProduct.variants.find(v => v.id.endsWith(e.target.value));
                                                        if (v) {
                                                            updateVariant(idx, 'variantId', e.target.value);
                                                            updateVariant(idx, 'name', v.title);
                                                            updateVariant(idx, 'price', parseFloat(v.price));
                                                        }
                                                    }}
                                                    className="select select-sm select-bordered font-mono"
                                                    disabled={formData.status === 'running'}
                                                >
                                                    <option value="">Select a variant...</option>
                                                    {selectedProduct.variants.map((pv) => {
                                                        const cleanId = pv.id.replace('gid://shopify/ProductVariant/', '');
                                                        return (
                                                            <option key={pv.id} value={cleanId}>
                                                                {pv.title} - ${pv.price}
                                                            </option>
                                                        )
                                                    })}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={variant.variantId}
                                                    readOnly
                                                    className="input input-sm input-bordered font-mono bg-base-200 cursor-not-allowed text-base-content/50"
                                                    title="Price tests use the same variant ID"
                                                />
                                            )}
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-[10px] font-bold uppercase text-base-content/40">Price (₹)</label>
                                            <input
                                                type="number"
                                                value={variant.price || ''}
                                                onChange={e => updateVariant(idx, 'price', parseFloat(e.target.value) || 0)}
                                                className="input input-sm input-bordered"
                                                disabled={formData.status === 'running'} // Price can be edited in Price Test mode
                                            />
                                        </div>

                                    </div>

                                    <div className="mt-4">
                                        <label className="label text-[10px] font-bold uppercase text-base-content/40">Traffic Split</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={variant.trafficPercent}
                                                onChange={e => updateVariant(idx, 'trafficPercent', parseInt(e.target.value))}
                                                className="range range-xs range-success flex-1"
                                            />
                                            <span className="font-mono font-bold w-12 text-right">{variant.trafficPercent}%</span>
                                        </div>
                                    </div>


                                </div>
                            ))}

                            {totalTraffic !== 100 && (
                                <div className="alert alert-warning text-sm">
                                    Traffic split must equal 100%. Current total: {totalTraffic}%
                                </div>
                            )}

                            <button
                                onClick={addVariant}
                                className="btn btn-ghost btn-sm text-base-content/60 gap-2 pl-0 hover:bg-transparent hover:text-emerald-600"
                            >
                                <PlusIcon className="w-4 h-4" /> Add another price variant
                            </button>
                        </div>
                    </section>
                )}

                {/* Section 5: Target Audience (Placeholder for now) */}
                <section className="relative pl-8 border-l-2 border-base-200 opacity-50">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-base-200 ring-4 ring-base-100"></div>
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">Target Audience</h2>
                        <p className="text-sm text-base-content/50">Who should see this test?</p>
                    </div>
                    <div className="p-4 bg-base-50 rounded-lg border border-base-200 italic text-sm">
                        Audience targeting coming soon (Country, Device, User Type)
                    </div>
                </section>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-base-200 p-4 z-50">
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <select
                            value={formData.status}
                            onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                            className={`select select-sm select-bordered ${formData.status === 'running' ? 'text-emerald-600 font-bold' : ''}`}
                        >
                            <option value="draft">Draft</option>
                            <option value="running">Active (Running)</option>
                            <option value="paused">Paused</option>
                        </select>
                        <span className="text-xs text-base-content/40 hidden md:inline">
                            {formData.pricingConfig.variants.length} variations • {totalTraffic}% traffic details
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => router.back()} className="btn btn-sm btn-ghost">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            className={`btn btn-sm btn-success px-6 gap-2 ${isSubmitting ? 'loading' : ''}`}
                            disabled={isSubmitting || totalTraffic !== 100 || !shopifyConnected}
                        >
                            <RocketLaunchIcon className="w-4 h-4" />
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Test' : 'Launch Experiment')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
