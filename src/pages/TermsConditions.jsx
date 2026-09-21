import React from 'react';
import PageHeader from '../components/Home/PageHeader';
import SEOHead from '../components/SEOHead';

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-zinc-900">
      <SEOHead
        title="Terms & Conditions | Mahirash Parfumerie"
        description="Read the official terms and conditions for using Mahirash Parfumerie online store and placing orders."
        url="https://mahirash.com/terms"
      />
      <PageHeader
        title="Terms & Conditions"
        subtitle="Please read our terms of service carefully before using our atelier services."
        breadcrumbItems={[{ label: 'Home', path: '/' }, { label: 'Terms & Conditions' }]}
      />

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-20 space-y-12">
        {/* Intro */}
        <section className="space-y-4">
          <h2 className="text-xl font-light uppercase tracking-widest text-[#b8860b]">
            1. Overview & Agreement
          </h2>
          <p className="text-[14px] md:text-sm text-zinc-600 leading-relaxed">
            Welcome to MAHIRASH PARFUMERIE. By accessing or browsing our digital platform, placing an order, or utilizing any of our atelier services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you should discontinue use of our platform immediately.
          </p>
        </section>

        {/* Intellectual Property */}
        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <h2 className="text-xl font-light uppercase tracking-widest text-[#b8860b]">
            2. Intellectual Property Rights
          </h2>
          <p className="text-[14px] md:text-sm text-zinc-600 leading-relaxed">
            All content published on this site—including but not limited to brand typography, trademarks, imagery, lookbooks, product designs, graphics, and software—is the exclusive intellectual property of MAHIRASH PARFUMERIE and is protected by international copyright and trademark laws. Unauthorized reproduction or redistribution is strictly prohibited.
          </p>
        </section>

        {/* Orders & Pricing */}
        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <h2 className="text-xl font-light uppercase tracking-widest text-[#b8860b]">
            3. Orders, Pricing & Product Availability
          </h2>
          <p className="text-[14px] md:text-sm text-zinc-600 leading-relaxed">
            All prices listed on our platform are displayed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to modify prices, modify product offerings, or limit order quantities at any time without prior notice.
          </p>
          <p className="text-[14px] md:text-sm text-zinc-600 leading-relaxed">
            Receipt of an order confirmation does not signify our final acceptance of your order. We reserve the right to cancel or refuse any order due to inventory discrepancies, suspected fraudulent activity, or pricing errors.
          </p>
        </section>

        {/* Shipping & Delivery */}
        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <h2 className="text-xl font-light uppercase tracking-widest text-[#b8860b]">
            4. Shipping, Delivery & Transit
          </h2>
          <p className="text-[14px] md:text-sm text-zinc-600 leading-relaxed">
            We strive to dispatch all orders within 24 to 48 working hours. Estimated delivery timelines (typically 3 to 5 business days) are approximate and may vary based on courier performance or remote region transit times. MAHIRASH PARFUMERIE is not liable for delay caused by natural events or logistics disruptions beyond our control.
          </p>
        </section>

        {/* Returns & Refunds */}
        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <h2 className="text-xl font-light uppercase tracking-widest text-[#b8860b]">
            5. Returns, Exchanges & Refunds
          </h2>
          <p className="text-[14px] md:text-sm text-zinc-600 leading-relaxed">
            Items may be returned or exchanged within 7 to 10 calendar days of delivery, provided they remain sealed, unused, and in their original packaging with all security seals intact. Refunds are initiated only after the returned product has been received back at our warehouse and cleared through a quality inspection process.
          </p>
        </section>

        {/* Payment Methods */}
        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <h2 className="text-xl font-light uppercase tracking-widest text-[#b8860b]">
            6. Accepted Payment Methods
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="text-[14px] md:text-sm text-zinc-600 leading-relaxed space-y-2">
              <li>• <strong className="text-zinc-900">UPI:</strong> Google Pay, PhonePe, Paytm, BHIM UPI</li>
              <li>• <strong className="text-zinc-900">Debit &amp; Credit Cards:</strong> Visa, Mastercard, RuPay, American Express</li>
              <li>• <strong className="text-zinc-900">Net Banking:</strong> All major Indian banks (HDFC, SBI, ICICI, Axis, etc.)</li>
            </ul>
            <ul className="text-[14px] md:text-sm text-zinc-600 leading-relaxed space-y-2">
              <li>• <strong className="text-zinc-900">Mobile Wallets:</strong> Paytm, PhonePe, Mobikwik, Amazon Pay</li>
              <li>• <strong className="text-zinc-900">Cash on Delivery (COD):</strong> Available on eligible pincodes</li>
              <li>• <strong className="text-zinc-900">Security:</strong> All online transactions processed via Razorpay 256-bit SSL</li>
            </ul>
          </div>
        </section>

        {/* User Obligations */}
        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <h2 className="text-xl font-light uppercase tracking-widest text-[#b8860b]">
            7. Governing Law & Contact
          </h2>
          <p className="text-[14px] md:text-sm text-zinc-600 leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of India. For any inquiries regarding our terms, please contact our support team at <a href="mailto:help@mahirash.com" className="text-zinc-900 font-semibold underline">help@mahirash.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsConditions;
