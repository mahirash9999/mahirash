import React from 'react';
import PageHeader from '../components/Home/PageHeader';
import SEOHead from '../components/SEOHead';

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-zinc-900">
      <SEOHead
        title="Terms & Conditions | Luxury Perfumes"
        description="Read the official terms and conditions for using Luxury Perfumes online store and placing orders."
        url="https://mahirash.com/terms"
      />
      <PageHeader
        title="Terms & Conditions"
        subtitle="Please read our terms of service carefully before using our store services."
        breadcrumbItems={[{ label: 'Home', path: '/' }, { label: 'Terms & Conditions' }]}
      />

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-20 space-y-12">
        {/* Intro */}
        <section className="space-y-4">
          <h2 className="text-xl font-light uppercase tracking-wider text-[#800020]">
            1. Overview & Agreement
          </h2>
          <p className="text-[14px] md:text-sm text-zinc-600 leading-relaxed">
            Welcome to MAHIRASH. By accessing or browsing our digital platform, placing an order, or utilizing any of our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you should discontinue use of our platform immediately.
          </p>
        </section>

        {/* Intellectual Property */}
        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <h2 className="text-xl font-light uppercase tracking-wider text-[#800020]">
            2. Intellectual Property Rights
          </h2>
          <p className="text-[14px] md:text-sm text-zinc-600 leading-relaxed">
            All content published on this site—including but not limited to brand typography, trademarks, imagery, lookbooks, product designs, graphics, and software—is the exclusive intellectual property of Luxury Perfumes and is protected by international copyright and trademark laws. Unauthorized reproduction or redistribution is strictly prohibited.
          </p>
        </section>

        {/* Orders & Pricing */}
        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <h2 className="text-xl font-light uppercase tracking-wider text-[#800020]">
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
          <h2 className="text-xl font-light uppercase tracking-wider text-[#800020]">
            4. Shipping, Delivery & Transit
          </h2>
          <p className="text-[14px] md:text-sm text-zinc-600 leading-relaxed">
            We strive to dispatch all orders promptly. Delivery timelines are typically 4-5 days across India. All shipments are insured and carefully packaged in tamper-evident luxury containers.
          </p>
        </section>

        {/* Authenticity Guarantee & Quality Commitment */}
        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <h2 className="text-xl font-light uppercase tracking-wider text-[#800020]">
            5. At Mahirash, authenticity is our promise and quality is our commitment.
          </h2>
          <p className="text-[14px] md:text-sm text-zinc-600 leading-relaxed">
            We understand the importance of owning genuine luxury products. That's why we are committed to offering authentic products sourced through trusted suppliers and reliable channels.
            Every product is carefully selected to meet our quality standards. We strive to ensure that our customers receive genuine products in excellent condition, with complete transparency and confidence in every purchase.
            Your trust matters to us, and we believe that luxury is not just about the product you buy, but also about the experience and confidence that come with it.
            With Mahirash, shop with confidence. Authenticity is our priority.
          </p>
        </section>

        {/* Payment Methods */}
        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <h2 className="text-xl font-light uppercase tracking-wider text-[#800020]">
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
              <li>• <strong className="text-zinc-900">Online Prepayment Only:</strong> We exclusively support 100% verified online payments for rapid dispatch and hygiene assurance.</li>
              <li>• <strong className="text-zinc-900">Security:</strong> All online transactions processed via Razorpay 256-bit SSL encryption.</li>
            </ul>
          </div>
        </section>

        {/* User Obligations */}
        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <h2 className="text-xl font-light uppercase tracking-wider text-[#800020]">
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
