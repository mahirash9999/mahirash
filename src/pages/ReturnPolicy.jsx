import React from 'react';
import PageHeader from '../components/Home/PageHeader';
import SEOHead from '../components/SEOHead';
import { Package, Truck, RotateCcw, CreditCard, ShieldCheck, Clock, CheckCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReturnPolicy = () => {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-zinc-900">
      <SEOHead
        title="Return, Refund & Cancellation Policy | Mahirash Luxury Perfumes"
        description="Read Mahirash's return and refund policy for luxury fragrances. 7–10 day easy returns for sealed perfume bottles."
        url="https://mahirash.com/return-policy"
      />
      <PageHeader
        title="Return & Refund Policy"
        subtitle="Our commitment to transparent, hassle-free returns and refunds."
        breadcrumbItems={[{ label: 'Home', path: '/' }, { label: 'Return Policy' }]}
      />

      <div className="max-w-5xl mx-auto px-6 md:px-12 py-12 md:py-20 space-y-12">

        {/* Quick Info Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: RotateCcw, title: 'Easy 7–10 Day Returns', sub: 'Raise return within 10 days' },
            { icon: Package, title: 'Condition Applies', sub: 'Unopened with original seal intact' },
            { icon: Truck, title: 'Free Reverse Pickup', sub: 'On eligible pincodes' },
            { icon: CreditCard, title: 'Quick Refund', sub: '7–10 days after receipt' },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="bg-white border border-zinc-200 p-5 shadow-sm hover:border-black/30 transition-all">
              <div className="w-10 h-10 border border-zinc-300 flex items-center justify-center text-zinc-600 mb-3">
                <Icon size={17} strokeWidth={1.5} />
              </div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-900 mb-1">{title}</h3>
              <p className="text-[11px] text-zinc-500">{sub}</p>
            </div>
          ))}
        </section>

        {/* 1. Return Eligibility */}
        <section className="space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-200">
            <span className="w-8 h-8 bg-black text-white text-[11px] font-black flex items-center justify-center">1</span>
            <h2 className="text-xl font-light uppercase tracking-widest text-zinc-900">Return Eligibility</h2>
          </div>
          <ul className="space-y-3 text-[13px] md:text-sm text-zinc-600 leading-relaxed list-none">
            <li className="flex gap-3 items-start">
              <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-1" />
              <span>Returns must be initiated within <strong className="text-zinc-900">7 to 10 calendar days</strong> from the date of product delivery.</span>
            </li>
            <li className="flex gap-3 items-start">
              <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-1" />
              <span>Items must be <strong className="text-zinc-900">unopened, unused, and undamaged</strong> with all original cellophane wrapping, box packaging, and security seals intact.</span>
            </li>
            <li className="flex gap-3 items-start">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-1" />
              <span>Custom / bespoke / made-to-order garments are <strong className="text-zinc-900">non-returnable</strong> unless received with a manufacturing defect.</span>
            </li>
            <li className="flex gap-3 items-start">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-1" />
              <span>Sale / discounted items may have modified return windows – please check the individual product page for details.</span>
            </li>
          </ul>
        </section>

        {/* 2. How to Return */}
        <section className="space-y-5 border-t border-zinc-200 pt-10">
          <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-200">
            <span className="w-8 h-8 bg-black text-white text-[11px] font-black flex items-center justify-center">2</span>
            <h2 className="text-xl font-light uppercase tracking-widest text-zinc-900">How To Return</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {[
              { step: '01', title: 'Request Return', desc: 'Visit My Orders, select the order and "Request Return". Choose a reason and submit.', icon: Package },
              { step: '02', title: 'Reverse Pickup', desc: 'We schedule free pickup at your registered address within 24–48 hours (eligible pincodes).', icon: Truck },
              { step: '03', title: 'Inspect & Refund', desc: 'After quality check at our warehouse, refund is initiated to your original payment method.', icon: CreditCard },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="bg-white border border-zinc-200 p-6 relative">
                <span className="absolute top-4 right-4 text-[9px] font-black tracking-[0.2em] text-[#b8860b]">{step}</span>
                <div className="w-10 h-10 border border-zinc-300 flex items-center justify-center text-zinc-600 mb-4">
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <h3 className="text-[14px] font-semibold uppercase tracking-wider text-zinc-900 mb-2">{title}</h3>
                <p className="text-[14px] text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Refund Timeline & Methods */}
        <section className="space-y-5 border-t border-zinc-200 pt-10">
          <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-200">
            <span className="w-8 h-8 bg-black text-white text-[11px] font-black flex items-center justify-center">3</span>
            <h2 className="text-xl font-light uppercase tracking-widest text-zinc-900">Refund Timeline &amp; Methods</h2>
          </div>
          <div className="bg-white border border-zinc-200 p-6 md:p-8 shadow-sm">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#b8860b]">Processing Timeline</h3>
                <ul className="space-y-3 text-[14px] md:text-sm text-zinc-600">
                  <li className="flex gap-2.5 items-start">
                    <Clock size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                    <span><strong className="text-zinc-900">Quality Check:</strong> 24–48 hours after product is received at our warehouse.</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong className="text-zinc-900">Refund Initiation:</strong> Same day once QC is cleared.</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CreditCard size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                    <span><strong className="text-zinc-900">Refund Credit:</strong> Within 7–10 business days from inspection date, depending on your bank / payment processor.</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#b8860b]">Payment Method Refunds</h3>
                <ul className="space-y-3 text-[14px] md:text-sm text-zinc-600">
                  <li>• <strong>UPI / Cards / Net Banking:</strong> Refund credited back to original source account.</li>
                  <li>• <strong>Wallets (Paytm, PhonePe, GPay):</strong> Refund to wallet within 24–48 hours.</li>
                  <li>• <strong>Cash on Delivery (COD):</strong> Refund processed via UPI or store credit (your choice).</li>
                  <li>• <strong>Shipping Charges:</strong> Original shipping fees are non-refundable unless product was defective or wrong item delivered.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Accepted Payment Methods */}
        <section className="space-y-5 border-t border-zinc-200 pt-10">
          <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-200">
            <span className="w-8 h-8 bg-black text-white text-[11px] font-black flex items-center justify-center">4</span>
            <h2 className="text-xl font-light uppercase tracking-widest text-zinc-900">Payment Methods We Accept</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {[
              { label: 'UPI', desc: 'GPay, PhonePe, Paytm' },
              { label: 'Debit Cards', desc: 'Visa, RuPay, Mastercard' },
              { label: 'Credit Cards', desc: 'All major issuers' },
              { label: 'Net Banking', desc: 'All Indian banks' },
              { label: 'Wallets', desc: 'Paytm, PhonePe, Mobikwik' },
              { label: 'Cash on Delivery', desc: 'Selected pincodes' },
            ].map((m) => (
              <div key={m.label} className="bg-white border border-zinc-200 p-4 flex flex-col items-center text-center hover:border-black/30 transition-colors">
                <ShieldCheck size={18} className="text-[#b8860b] mb-2" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 mb-1">{m.label}</h3>
                <p className="text-[10px] text-zinc-500 leading-snug">{m.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-zinc-500 text-center pt-2">
            All online transactions are secured via Razorpay with 256-bit SSL encryption.
          </p>
        </section>

        {/* 5. Exchanges & Cancellations */}
        <section className="space-y-5 border-t border-zinc-200 pt-10">
          <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-200">
            <span className="w-8 h-8 bg-black text-white text-[11px] font-black flex items-center justify-center">5</span>
            <h2 className="text-xl font-light uppercase tracking-widest text-zinc-900">Exchanges &amp; Order Cancellation</h2>
          </div>
          <div className="space-y-4 text-[13px] md:text-sm text-zinc-600 leading-relaxed">
            <p><strong className="text-zinc-900">Exchanges:</strong> We support bottle volume or fragrance exchanges within the same product line, subject to stock availability and sealed condition. The above return timelines apply.</p>
            <p><strong className="text-zinc-900">Cancellations Before Shipment:</strong> Orders can be cancelled free of charge any time before dispatch from our warehouse. Full refund is processed within 24 hours.</p>
            <p><strong className="text-zinc-900">Cancellations After Shipment:</strong> Once the order has been handed over to the courier partner, cancellation is not possible – please accept delivery and initiate a return instead.</p>
          </div>
        </section>

        {/* 6. Contact */}
        <section className="bg-[#f5f5f5] border border-zinc-200 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#b8860b] mb-2">Need Help With A Return?</h3>
            <p className="text-[13px] md:text-sm text-zinc-600">Reach out to our support team for assistance with returns, exchanges or refund status.</p>
          </div>
          <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3.5 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors shrink-0 self-start md:self-auto">
            Contact Support <ArrowUpRight size={12} />
          </Link>
        </section>

        <p className="text-[11px] text-zinc-400 text-center pt-4">
          Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} • This policy is subject to change without prior notice.
        </p>
      </div>
    </div>
  );
};

export default ReturnPolicy;
