# Premium Page Implementation Guide

**Status:** 🟡 Partial (30% → needs 70% more)  
**Priority:** High  
**File:** `src/pages/Premium.tsx`  
**Related Components:** Pricing tiers, feature comparison, payment modal

---

## 📋 Current State vs. Missing Features

### ✅ Already Implemented (30%)
- Page structure
- Pricing tiers layout
- Features comparison

### ❌ Missing Features (70%)
- [ ] Pricing details
- [ ] Feature comparison table
- [ ] Payment integration
- [ ] Subscribe button
- [ ] Benefits description
- [ ] FAQs
- [ ] Current subscription status
- [ ] Cancel/downgrade flow
- [ ] Billing history
- [ ] Discount codes

---

## 🎯 Core Features to Build

### 1. Premium Tier Overview

**Three-Tier Pricing Model:**
```
┌──────────────┬─────────────────┬──────────────┐
│   BASIC      │   PREMIUM       │   ELITE      │
│  (FREE)      │   ($9.99/mo)    │  ($19.99/mo) │
│              │  ⭐ POPULAR     │              │
│              │                 │              │
│ ✓ Access     │ ✓ All Basic +   │ ✓ All +      │
│   to events  │ ✓ Advanced      │ ✓ VIP        │
│ ✓ Browse     │   filters       │   features   │
│ ✓ Create     │ ✓ See who liked │ ✓ Priority   │
│   profile    │ ✓ Message first │   support    │
│              │ ✓ Featured      │              │
│              │   profile       │              │
│              │                 │              │
│    FREE      │  $9.99/month    │  $19.99/mo   │
│   [CURRENT]  │  $99/year       │  $199/year   │
│              │  [Subscribe]    │  [Subscribe] │
└──────────────┴─────────────────┴──────────────┘
```

---

### 2. Feature Comparison Table

**Detailed Features:**
```
┌─────────────────────────────────────────────┐
│ Feature Comparison                          │
├──────────────────┬──────────┬───────┬──────┤
│ Feature          │ Basic    │Premium│Elite │
├──────────────────┼──────────┼───────┼──────┤
│ Browse Events    │ ✓        │ ✓     │ ✓    │
│ Create Profile   │ ✓        │ ✓     │ ✓    │
│ RSVP to Events   │ ✓        │ ✓     │ ✓    │
│ Send Messages    │ Limited* │ ✓     │ ✓    │
│ See Who Liked    │ ✗        │ ✓     │ ✓    │
│ Ad-Free Browse   │ ✗        │ ✓     │ ✓    │
│ Featured Profile │ ✗        │ ✓ 5x  │ ✓ 10x│
│ Priority Support │ ✗        │ ✗     │ ✓    │
│ VIP Event Access │ ✗        │ ✗     │ ✓    │
│ Event Filters    │ Basic    │ Adv.  │ Full │
│ Analytics (Host) │ ✗        │ ✓     │ ✓✓   │
│ Custom Events    │ Limited  │ ✓     │ ✓    │
│ Early Event Info │ ✗        │ ✗     │ ✓    │
│ Phone Support    │ ✗        │ Email │ 24/7 │
└──────────────────┴──────────┴───────┴──────┘

* Basic: 10 messages/day
** Elite: Advanced metrics + export
```

---

### 3. Benefits Description

**Expanded Benefits Section:**
```
┌─────────────────────────────────────────────┐
│ Why Go Premium?                             │
├─────────────────────────────────────────────┤
│                                             │
│ 🎯 PREMIUM ($9.99/month)                   │
│ ─────────────────────────────                │
│ • See who's interested in your profile     │
│   Find connection matches faster            │
│                                             │
│ • Unlimited messaging                      │
│   Connect with more hosts & guests         │
│                                             │
│ • Advanced event filters                   │
│   Find exactly what you're looking for     │
│                                             │
│ • Featured profile 5x per month            │
│   50% more visibility among users          │
│                                             │
│ • Browse without ads                       │
│   Cleaner, distraction-free experience    │
│                                             │
│ 👑 ELITE ($19.99/month)                    │
│ ──────────────────────────                  │
│ Everything in Premium, plus:                │
│                                             │
│ • VIP event access                         │
│   Invitation-only exclusive events         │
│                                             │
│ • Featured profile 10x per month           │
│   Up to 100% more visibility               │
│                                             │
│ • Advanced hosting analytics               │
│   See detailed event performance metrics   │
│                                             │
│ • Priority 24/7 support                    │
│   Get help anytime via phone/chat          │
│                                             │
│ • Early access to new events               │
│   See listings before others               │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 4. Current Subscription Status

**Status Display (if logged in):**
```
┌──────────────────────────────────┐
│ Your Subscription                │
├──────────────────────────────────┤
│                                  │
│ Current Plan: PREMIUM            │
│ ✓ Active Since: April 15, 2026   │
│                                  │
│ Billing Cycle:                   │
│ • Renewal Date: June 15, 2026    │
│ • Amount: $9.99/month            │
│ • Auto-renews: Yes               │
│                                  │
│ Benefits Active:                 │
│ ✓ Unlimited messaging            │
│ ✓ Featured profile 5x/month      │
│ ✓ Advanced filters               │
│ ✓ See who likes you              │
│ ✓ Ad-free experience             │
│                                  │
│ [View Billing History]           │
│ [Upgrade to Elite]               │
│ [Cancel Subscription]            │
│                                  │
└──────────────────────────────────┘
```

**For Free Users:**
```
┌──────────────────────────────────┐
│ Your Subscription                │
├──────────────────────────────────┤
│                                  │
│ Current Plan: BASIC (Free)       │
│                                  │
│ You're enjoying core features:   │
│ ✓ Browse events                  │
│ ✓ Create profile                 │
│ ✓ RSVP to events                 │
│ ✓ Limited messaging (10/day)     │
│                                  │
│ Unlock more with Premium:        │
│ • Unlimited messaging            │
│ • See who's interested           │
│ • Featured profile               │
│ • Advanced filters               │
│ • Ad-free experience             │
│                                  │
│ [Upgrade Now]                    │
│                                  │
└──────────────────────────────────┘
```

---

### 5. FAQ Section

**Common Questions:**
```
┌──────────────────────────────────────────┐
│ Frequently Asked Questions               │
├──────────────────────────────────────────┤
│                                          │
│ Q: Can I cancel anytime?                │
│ A: Yes! Cancel your subscription with    │
│    no penalties. Access continues until  │
│    your renewal date.                    │
│                                          │
│ Q: What payment methods do you accept?  │
│ A: We accept all major credit cards,     │
│    PayPal, and Apple Pay/Google Pay.     │
│                                          │
│ Q: Will my data be deleted if I cancel? │
│ A: No! Your profile, messages, and       │
│    event history remain intact.          │
│                                          │
│ Q: Can I switch between plans?          │
│ A: Yes! Upgrade or downgrade anytime.    │
│    Changes take effect next billing.     │
│                                          │
│ Q: Is there a free trial?               │
│ A: Yes! Get 7 days free on any plan.    │
│    No credit card required.              │
│                                          │
│ Q: How do discounts work?               │
│ A: Annual plans save 20% vs monthly.     │
│    Check for seasonal promotions.        │
│                                          │
│ [More FAQs] [Contact Support]           │
│                                          │
└──────────────────────────────────────────┘
```

---

### 6. Payment Integration

**Payment Modal:**
```
┌──────────────────────────────────────────┐
│ Subscribe to Premium                     │
├──────────────────────────────────────────┤
│                                          │
│ Plan: PREMIUM ($9.99/month)             │
│ Billing: Monthly                         │
│ Renewal: Auto-renews on June 15         │
│                                          │
│ Email: john@email.com                   │
│                                          │
│ Payment Method:                          │
│ [💳 Enter card details]                 │
│ • Name on card: [________]              │
│ • Card number: [__ __ __ __]           │
│ • Exp: [__/__]  CVC: [___]             │
│ • Country: [Select]                     │
│                                          │
│ Promo Code (optional):                  │
│ [SAVE20] Apply                          │
│                                          │
│ Terms:                                   │
│ ☑ I agree to the Subscription Terms     │
│ ☑ Allow auto-renewal                    │
│                                          │
│ Total: $9.99                            │
│                                          │
│ [Cancel] [Subscribe Now]                │
│                                          │
│ Secured by Stripe 🔒                   │
│                                          │
└──────────────────────────────────────────┘
```

---

### 7. Subscribe Button & CTAs

**Call-to-Action Placement:**
```
Primary Location: Under each tier
- [Subscribe] button
- Clear pricing
- "Popular" badge on premium

Secondary Locations:
- Top nav (premium badge if subscribed)
- After applying for event (upsell)
- In messaging (limited messages warning)
- Profile (after reaching filter limit)
```

**Button States:**
```typescript
// Not Subscribed
<button className="bg-accent px-6 py-3 rounded-full">
  Subscribe Now
</button>

// Already Subscribed
<button className="bg-green-500 px-6 py-3 rounded-full" disabled>
  ✓ Subscribed
</button>

// Upgrade Available
<button className="bg-accent px-6 py-3 rounded-full">
  Upgrade to Elite
</button>
```

---

### 8. Cancel/Downgrade Flow

**Downgrade Modal:**
```
┌──────────────────────────────────┐
│ Downgrade to Basic?              │
├──────────────────────────────────┤
│ We're sorry to see you go!       │
│                                  │
│ Before you downgrade:            │
│ • You'll lose messaging benefits │
│ • Profile will no longer be      │
│   featured                       │
│ • Advanced filters will be       │
│   limited                        │
│                                  │
│ What's the reason? (optional)    │
│ ☑ Too expensive                 │
│ ☐ Don't need features           │
│ ☐ Other: [________]             │
│                                  │
│ Special Offer:                   │
│ 40% OFF for 3 months!           │
│ Was: $9.99/month                │
│ Now: $5.99/month                │
│ [Accept Offer] [Continue Downgrade]
│                                  │
└──────────────────────────────────┘
```

**Cancel Modal:**
```
┌──────────────────────────────────┐
│ Cancel Subscription?             │
├──────────────────────────────────┤
│ Your current plan will:          │
│                                  │
│ • End on: June 15, 2026         │
│ • Refund: Not available*         │
│ • Data: Stays with you forever   │
│                                  │
│ We'll miss you! 😢              │
│                                  │
│ [Cancel Anyway]                  │
│ [Keep Premium]                   │
│ [Downgrade Instead]              │
│                                  │
│ * You can request a refund       │
│ within 30 days of purchase       │
│                                  │
└──────────────────────────────────┘
```

---

### 9. Billing History

**Payment Records:**
```
┌────────────────────────────────────┐
│ Billing History                    │
├────────────────────────────────────┤
│                                    │
│ Date       │ Description │ Amount │
│ Jun 15, 26 │ Premium     │ $9.99  │
│ May 15, 26 │ Premium     │ $9.99  │
│ Apr 15, 26 │ Premium     │ $9.99  │
│                                    │
│ [Download Invoice]                 │
│ [Contact Support About Charge]     │
│                                    │
└────────────────────────────────────┘
```

---

### 10. Discount Codes

**Promo Code Input:**
```
Subscription Applied Automatically:
- Annual plans: 20% discount
- First 3 months: FIRST3MONTHS (30% off)
- Referral bonus: REFER25 (25% off)
- Student: STUDENT (40% off)

Manual Entry:
[Promo Code] [Apply]

Example: SAVE20
Discount: 20% off ($1.99 savings)
New Total: $7.99/month
```

---

## 📱 Full Page Layout

**Mobile:**
```
┌──────────────────────┐
│ Premium              │
├──────────────────────┤
│ [Tier 1]             │
│ FREE                 │
│ [Features]           │
│                      │
│ [Tier 2]             │
│ PREMIUM (Featured)   │
│ [Features]           │
│ [Subscribe Button]   │
│                      │
│ [Tier 3]             │
│ ELITE                │
│ [Features]           │
│ [Subscribe Button]   │
│                      │
│ [Feature Table]      │
│ [FAQs]               │
│                      │
└──────────────────────┘
```

**Desktop:**
```
┌──────────────────────────────────────────┐
│ Premium Membership                       │
├──────────────────────────────────────────┤
│                                          │
│ [Tier 1] [Tier 2 Featured] [Tier 3]     │
│                                          │
│ Feature Comparison Table (full width)    │
│                                          │
│ FAQs                                     │
│                                          │
└──────────────────────────────────────────┘
```

---

## 💾 Mock Data

```typescript
interface PremiumTier {
  id: string;
  name: 'basic' | 'premium' | 'elite';
  displayName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  featured: boolean;
  features: string[];
  maxMessages: number | null;
}

interface UserSubscription {
  userId: string;
  tier: 'basic' | 'premium' | 'elite';
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  renewalDate: Date;
  paymentMethod: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
}

const mockTiers: PremiumTier[] = [
  {
    id: 'tier_1',
    name: 'basic',
    displayName: 'Basic',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Everything you need to get started',
    featured: false,
    features: [
      'Browse events',
      'Create profile',
      'RSVP to events',
      'Limited messaging (10/day)',
      'Basic search'
    ],
    maxMessages: 10
  },
  {
    id: 'tier_2',
    name: 'premium',
    displayName: 'Premium',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    description: 'All basic features plus premium perks',
    featured: true,
    features: [
      'Unlimited messaging',
      'See who liked you',
      'Advanced filters',
      'Featured profile (5x/month)',
      'Ad-free experience',
      'Email support'
    ],
    maxMessages: null
  },
  {
    id: 'tier_3',
    name: 'elite',
    displayName: 'Elite',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    description: 'Premium features plus VIP benefits',
    featured: false,
    features: [
      'All premium features',
      'VIP event access',
      'Featured profile (10x/month)',
      'Advanced analytics (for hosts)',
      'Early access to new events',
      '24/7 priority phone support'
    ],
    maxMessages: null
  }
];

const mockSubscription: UserSubscription = {
  userId: 'user_1',
  tier: 'premium',
  status: 'active',
  startDate: new Date('2026-04-15'),
  renewalDate: new Date('2026-06-15'),
  paymentMethod: '****1234',
  amount: 9.99,
  billingCycle: 'monthly'
};
```

---

## 🎨 Animation Specs

1. **Tier cards:** Hover lift + highlight
2. **Feature table:** Fade in rows
3. **Payment form:** Smooth transitions
4. **Success state:** Checkmark + bounce

---

## 📊 Implementation Checklist

- [ ] Create pricing tier cards
- [ ] Build feature comparison table
- [ ] Implement payment form
- [ ] Add subscription status display
- [ ] Create FAQ section
- [ ] Build current subscription view
- [ ] Implement upgrade/downgrade flow
- [ ] Add billing history
- [ ] Create discount code system
- [ ] Build cancel flow with retention offers
- [ ] Add animations
- [ ] Responsive design
- [ ] Payment gateway integration (Stripe)
- [ ] Email receipts system

---

**Next Step:** Build the pricing tier cards and comparison table first.
