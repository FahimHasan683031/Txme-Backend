# Txme Integration Guide & Feature Summary

এই ডকুমেন্টে নতুন যুক্ত হওয়া ফিচারগুলো কীভাবে কাজ করে এবং কীভাবে ব্যবহার করবেন তা বিস্তারিত বলা হয়েছে।

## ১. স্লট এবং ল্যাঙ্গুয়েজ (Slots & Languages)

### প্রধান পরিবর্তনসমূহ:
- **Hourly Duration:** প্রোভাইডাররা এখন ঘণ্টায় স্লট সেট করতে পারেন (যেমন: ১, ১.৫, ২)।
- **Auto-Validation:** যদি স্লট ডিউরেশন কাজের সময়ের সাথে ম্যাচ না করে, তবে সিস্টেম ইরর দিবে।
- **35+ Languages:** ইউরোপীয় দেশগুলোর প্রধান ভাষাসহ মোট ৩৫+ ভাষা এখন সাপোর্টেড।

### সংশ্লিষ্ট ফাইল:
- [languages.ts](file:///d:/Fahim/Projects/Txme-Backend/src/enums/languages.ts) (সব ভাষার লিস্ট এখানে আছে)
- [generateDailySlots.ts](file:///d:/Fahim/Projects/Txme-Backend/src/util/generateDailySlots.ts)

---

## ২. স্ট্রাইপ কানেক্ট (Stripe Connect) - অটোমেটেড পেমেন্ট ও উইথড্র

এই ফিচারের মাধ্যমে কাস্টমার এবং প্রোভাইডার উভয়ই তাদের ব্যাংক কার্ড কানেক্ট করে সরাসরি টাকা লেনদেন করতে পারবেন।

### ক) কার্ড কানেক্ট করার ফ্লো (Onboarding Flow)
ইউজারকে (Customer/Provider) প্রথমে তার কার্ড কানেক্ট করতে হবে।

1. **API Call:** `POST /api/stripe/onboard`
2. **Response:** একটি `onboardingUrl` পাবেন।
3. **App Task:** এই ইউআরএল-টি অ্যাপের একটি **In-App Browser** বা **WebView**-তে ওপেন করতে হবে।
4. **Action:** ইউজার সেখানে তার কার্ড বা ব্যাংক ডিটেইলস দিয়ে ভেরিফিকেশন শেষ করবেন। 
5. **Success:** ভেরিফিকেশন শেষ হলে সিস্টেম অটোমেটিক ইউজারের প্রোফাইলে `isStripeConnected: true` করে দিবে।

### খ) অ্যাপয়েন্টমেন্ট পেমেন্ট (Split Payment at 0% Commission)
যখন কোনো কাস্টমার কার্ড দিয়ে পেমেন্ট করবেন:
- **প্রসেস:** সিস্টেম অটোমেটিক আপনার প্ল্যাটফর্মের মাধ্যমে **১০০% টাকা** প্রোভাইডারের কানেক্টেড একাউন্টে ট্রান্সফার করে দিবে। 
- **কোড:** [appointment.stripe.service.ts](file:///d:/Fahim/Projects/Txme-Backend/src/app/modules/appointment/appointment.stripe.service.ts)

### গ) অটোমেটেড উইথড্রয়াল (Automated Withdrawal)
ওয়ালেট থেকে টাকা নিজের কার্ডে নেওয়ার জন্য:
1. **API Call:** `POST /api/wallet/withdraw` (বডিতে `amount` দিতে হবে)
2. **Logic:** 
   - যদি ইউজার Stripe-এ কানেক্টেড না থাকেন, তবে এটি আগের মতো **Manual (Pending)** থাকবে।
   - যদি ইউজার Stripe-এ কানেক্টেড থাকেন, তবে সিস্টেম অটোমেটিক **Stripe Payout** ট্রিগার করবে এবং টাকা সরাসরি ইউজারের কার্ডে চলে যাবে।

---

## ৩. গুরুত্বপূর্ণ API লিস্ট

| Feature | Method | Endpoint | Allowed Roles |
| :--- | :--- | :--- | :--- |
| **Onboarding Link** | `POST` | `/api/stripe/onboard` | Customer, Provider |
| **Withdrawal** | `POST` | `/api/wallet/withdraw` | Customer, Provider |
| **Top Up Intent** | `POST` | `/api/wallet/create-payment-intent` | Customer, Provider |
| **Verify Top Up** | `POST` | `/api/wallet/verify-payment` | Customer, Provider |
| **Update Profile** | `PATCH` | `/api/user/update-profile` | Provider (Set hours/languages) |

---

## ডেভেলপার নোট (Developer Notes)
- **Status Update:** Stripe-এর যেকোনো পরিবর্তন (যেমন: ইউজার কার্ড চেঞ্জ করলে) ব্যাকএন্ডে হ্যান্ডেল করার জন্য মেথডগুলো [handleStripeWebhook.ts](file:///d:/Fahim/Projects/Txme-Backend/src/stripe/handleStripeWebhook.ts)-এ যুক্ত করা আছে।
- **Commission:** আপনার অনুরোধে কমিশন **০%** করা হয়েছে, অর্থাৎ প্রোভাইডার সম্পূর্ণ টাকা পাবেন।

এই গাইড অনুযায়ী আপনি এখন ফ্রন্টএন্ড বা অ্যাপে ইন্টিগ্রেশন শুরু করতে পারেন।
