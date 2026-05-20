import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Check, Star, AlertCircle } from 'lucide-react';

export const Premium: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate = () => {} }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const features = [
    { name: 'Host Me Tier', free: 'Locked', paid: 'Max 3/month' },
    { name: 'Travel Mode', free: 'Locked', paid: 'Full access' },
    { name: 'Event Joins', free: '10/day · 50/month', paid: 'Unlimited' },
    { name: 'Nearby Swipes', free: '10/day', paid: 'Unlimited' },
    { name: 'Saved Searches', free: '3 maximum', paid: 'Unlimited' },
    { name: 'Saved Events (Wishlist)', free: '10 maximum', paid: 'Unlimited' },
    { name: 'Posting Events', free: 'Unlimited', paid: 'Unlimited' },
    { name: 'Messaging', free: 'Unlimited', paid: 'Unlimited' },
    { name: 'Emergency SOS', free: 'Always free', paid: 'Always free' },
    { name: 'Venue Bookings', free: 'Pay per booking', paid: 'Pay per booking' },
    { name: 'Celebrity Bookings', free: 'Pay per booking', paid: 'Pay per booking' },
  ];

  const pricingPlans = {
    monthly: {
      price: '₦2,999',
      currency: 'NGN',
      period: 'month',
      savings: 0,
    },
    annual: {
      price: '₦29,990',
      currency: 'NGN',
      period: 'year',
      savings: 3600,
    },
  };

  const currentPlan = pricingPlans[billingCycle];

  return (
    <div className="flex min-h-screen bg-[#0F0F13] text-white">
      <div className="relative z-50">
        <Sidebar activeNav="Premium" setActiveNav={() => {}} onNavigate={onNavigate} />
      </div>
      
      <main className="mobile-page-main flex-1 ml-64 relative overflow-x-hidden">
        {/* Blurred Content */}
        <div className="bg-black text-white min-h-screen pb-20 blur-sm opacity-60 pointer-events-none">
          {/* Header */}
          <div className="sticky top-0 bg-black bg-opacity-95 backdrop-blur border-b border-yellow-500 p-4">
            <h1 className="text-2xl font-bold text-yellow-400">Junto Premium</h1>
            <p className="text-sm text-gray-300">Unlock unlimited outings and exclusive features</p>
          </div>

          <div className="px-4 py-6 space-y-6">
            {/* Coming Soon Banner */}
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 bg-opacity-30 border-2 border-yellow-500 p-4 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm mb-1 text-yellow-300">🚀 Coming Soon!</p>
                  <p className="text-xs text-gray-200">
                    Premium features are launching very soon. Be among the first to unlock unlimited outings, travel mode, and exclusive perks!
                  </p>
                </div>
              </div>
            </div>

            {/* Current Plan Status */}
            <div className="bg-gradient-to-r from-yellow-500 to-amber-600 bg-opacity-15 border border-yellow-600 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm mb-1">You're on the Free Plan</p>
                  <p className="text-xs text-gray-300">
                    Upgrade now to enjoy unlimited outings, travel mode, and more!
                  </p>
                </div>
              </div>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex bg-gray-900 p-1 rounded-lg border border-yellow-600">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition ${
                  billingCycle === 'monthly'
                    ? 'bg-yellow-500 text-black'
                    : 'text-gray-400 hover:text-yellow-400'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition relative ${
                  billingCycle === 'annual'
                    ? 'bg-yellow-500 text-black'
                    : 'text-gray-400 hover:text-yellow-400'
                }`}
              >
                Annual
                {billingCycle === 'annual' && (
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                    Save ₦{currentPlan.savings.toLocaleString()}!
                  </span>
                )}
              </button>
            </div>

            {/* Pricing Card */}
            <div className="bg-gradient-to-br from-yellow-900 via-gray-900 to-black border-2 border-yellow-500 p-6 rounded-lg text-center shadow-lg shadow-yellow-500/20">
              <h2 className="text-lg font-bold mb-2 text-yellow-400">Junto Premium</h2>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-4xl font-bold text-yellow-300">{currentPlan.price}</span>
                <div className="text-left">
                  <p className="text-xs text-gray-300">{currentPlan.currency}</p>
                  <p className="text-xs text-gray-300">per {currentPlan.period}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPurchasing(true)}
                disabled={isPurchasing}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:opacity-90 disabled:opacity-50 text-black font-bold py-3 rounded-lg transition shadow-lg shadow-yellow-500/30"
              >
                {isPurchasing ? 'Processing...' : 'Subscribe Now'}
              </button>
              <p className="text-xs text-gray-400 mt-4">
                Cancel anytime. Autorenews {billingCycle === 'monthly' ? 'monthly' : 'annually'}.
              </p>
            </div>

            {/* Features Comparison */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg">What You Get</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="text-left py-3 px-3">Feature</th>
                      <th className="text-center py-3 px-3">Free</th>
                      <th className="text-center py-3 px-3">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-800 hover:bg-gray-900 hover:bg-opacity-50"
                      >
                        <td className="py-3 px-3 text-left">{feature.name}</td>
                        <td className="py-3 px-3 text-center text-xs text-gray-400">
                          {feature.free === 'Locked' ? (
                            <span className="text-red-400">✕</span>
                          ) : feature.free === 'Unlimited' ? (
                            <span className="text-green-400">✓</span>
                          ) : (
                            feature.free
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-xs">
                          {feature.paid === 'Unlimited' ? (
                            <span className="text-green-400 font-bold">✓</span>
                          ) : (
                            <span className="text-green-400 font-bold">{feature.paid}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Why Choose Premium */}
            <div className="space-y-3 bg-gray-900 bg-opacity-50 border border-gray-800 p-4 rounded-lg">
              <h3 className="font-bold flex items-center gap-2">
                <Star size={18} className="text-yellow-400" />
                Why Upgrade?
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Join unlimited events every day</span>
                </li>
                <li className="flex gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Explore events in 10 cities with Travel Mode</span>
                </li>
                <li className="flex gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Use the Host Me billing tier up to 3 times per month</span>
                </li>
                <li className="flex gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Unlimited saved searches and event bookmarks</span>
                </li>
                <li className="flex gap-2">
                  <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Swipe unlimited nearby matches</span>
                </li>
              </ul>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3 bg-gray-900 bg-opacity-50 border border-gray-800 p-4 rounded-lg">
              <h3 className="font-bold text-sm">Payment Methods</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button className="border border-gray-700 hover:bg-gray-800 p-3 rounded-lg transition flex items-center justify-center gap-2">
                  <span>💳 Card</span>
                </button>
                <button className="border border-gray-700 hover:bg-gray-800 p-3 rounded-lg transition flex items-center justify-center gap-2">
                  <span>🏦 Bank Transfer</span>
                </button>
                <button className="border border-gray-700 hover:bg-gray-800 p-3 rounded-lg transition flex items-center justify-center gap-2">
                  <span>📱 USSD</span>
                </button>
                <button className="border border-gray-700 hover:bg-gray-800 p-3 rounded-lg transition flex items-center justify-center gap-2">
                  <span>💰 PayPal</span>
                </button>
              </div>
            </div>

            {/* FAQs */}
            <div className="space-y-3 bg-gray-900 bg-opacity-50 border border-gray-800 p-4 rounded-lg">
              <h3 className="font-bold text-sm mb-4">FAQs</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-300 mb-1">When will I be charged?</p>
                  <p className="text-gray-400 text-xs">
                    You'll be charged immediately when you subscribe, and then on your renewal date.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-300 mb-1">Can I cancel anytime?</p>
                  <p className="text-gray-400 text-xs">
                    Yes! You can cancel your subscription at any time from your settings.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-300 mb-1">What if I change my mind?</p>
                  <p className="text-gray-400 text-xs">
                    We offer a 7-day money-back guarantee if you're not satisfied.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-10">
          <div className="text-center">
            <h2 className="text-6xl font-bold text-yellow-400 mb-4">Coming Soon</h2>
            <p className="text-2xl text-yellow-300 mb-8">Premium features launching very soon!</p>
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Premium;
