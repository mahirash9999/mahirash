import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, ArrowUpRight, X, CheckCircle, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/Home/PageHeader';
import SEOHead from '../components/SEOHead';
import { db } from '../components/Firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useStore } from '../components/StoreProvider';
import { cleanPhone, isValidPhone, isValidEmail, isValidName, sanitizeMessage, sanitizeText } from '../utils/validation';

const Contact = () => {
  const { siteSettings } = useStore();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Order Inquiry",
    message: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalVal = value;
    if (name === "phone") {
      finalVal = cleanPhone(value);
    } else if (name === "email") {
      finalVal = value.toLowerCase().trim();
    } else if (name === "name") {
      finalVal = sanitizeText(value, 60);
    }
    setFormData(prev => ({ ...prev, [name]: finalVal }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanName = formData.name.trim();
    if (!cleanName || !isValidName(cleanName)) {
      setError("Please enter a valid full name (letters only, min 2 characters).");
      return;
    }

    const cleanEmail = formData.email.toLowerCase().trim();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    const phoneVal = cleanPhone(formData.phone);
    if (!phoneVal || !isValidPhone(phoneVal)) {
      setError("Please enter a valid 10-digit mobile number (starting with 6, 7, 8, or 9).");
      return;
    }

    const cleanMsg = sanitizeMessage(formData.message);
    if (!cleanMsg || cleanMsg.length < 10) {
      setError("Please provide a message with at least 10 characters.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "inquiries"), {
        name: cleanName,
        email: cleanEmail,
        phone: phoneVal,
        subject: formData.subject,
        message: cleanMsg,
        status: "unread",
        createdAt: serverTimestamp()
      });

      setFormSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "Order Inquiry",
        message: ""
      });
      setTimeout(() => setFormSubmitted(false), 6000);
    } catch (err) {
      console.error("Inquiry submission failed:", err);
      setError("Could not submit your message. Please try again or reach us directly via WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const displayPhone = siteSettings?.phone || "+91 8959041514";
  const rawNumber = siteSettings?.whatsapp_number || "8959041514";
  const displayEmail = siteSettings?.email || "care@mahirash.com";

  const communicationChannels = [
    { icon: Mail, label: 'Email Support', val: displayEmail, href: `mailto:${displayEmail}`, desc: 'Personal response within 24 hours' },
    { icon: Phone, label: 'Support Direct', val: displayPhone, href: `tel:${rawNumber}`, desc: 'Mon–Sat, 10:00 AM – 7:00 PM IST' },
    { icon: MapPin, label: 'Express Shipping', val: 'Express Pan-India Delivery', href: '/shop', desc: 'Securely packaged in royal presentation boxes' }
  ];

  const fadeUp = {
    initial: { opacity: 0, y: 25 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <SEOHead
        title="Contact Us | Mahirash Customer Support"
        description="Have questions or need support? Contact Mahirash official customer care at care@mahirash.com or WhatsApp support. Fast Pan-India delivery."
        url="https://mahirash.com/contact"
        keywords="Mahirash contact, Mahirash customer care, Mahirash email, Mahirash phone number, mahirash.com help"
      />
      <PageHeader
        title="Get In Touch"
        subtitle="We'd love to hear from you. Reach out anytime."
        breadcrumbItems={[{ label: 'Home', path: '/' }, { label: 'Contact' }]}
      />

      {/* Success Toast */}
      <AnimatePresence>
        {formSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-6 py-4 shadow-2xl flex items-center gap-3 border border-[#800020]"
          >
            <CheckCircle size={18} className="text-[#800020]" />
            <div>
              <p className="text-[13px] md:text-[14px] font-bold uppercase tracking-wider text-white">Message Dispatched!</p>
              <p className="text-[12px] text-zinc-300">Our customer support team will contact you within 24 hours.</p>
            </div>
            <button onClick={() => setFormSubmitted(false)} className="opacity-60 hover:opacity-100 ml-3 cursor-pointer"><X size={15} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl py-3 mx-auto px-5 md:px-10 lg:px-14 py-14 md:py-20">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* LEFT: Channels */}
          <motion.div {...fadeUp} className="lg:col-span-5 space-y-7">
            <div>
              <span className="text-[12px] tracking-[0.2em] uppercase text-zinc-500 block mb-4">Reach Out</span>
              <h2 className="text-3xl sm:text-4xl font-light text-zinc-900 tracking-[0.06em] leading-[1.05] uppercase">
                We're Here<br />to Help
              </h2>
              <p className="text-[14px] text-zinc-600 mt-4 leading-relaxed max-w-sm">
                Whether you have a question about fragrance notes, need perfume selection advice, or want to discuss a custom order — our customer support team is at your service.
              </p>
            </div>

            <div className="space-y-2">
              {communicationChannels.map((item, i) => {
                const Icon = item.icon;
                return (
                  <a
                    href={item.href}
                    key={i}
                    onMouseEnter={() => setActiveChannel(i)}
                    onMouseLeave={() => setActiveChannel(null)}
                    className="flex items-center gap-4 p-4 sm:p-5 bg-white border border-zinc-200 hover:border-black/30 transition-all duration-300 group shadow-sm"
                  >
                    <div className="w-10 h-10 border border-zinc-300 text-zinc-600 group-hover:bg-black group-hover:text-white group-hover:border-black flex items-center justify-center transition-all duration-400 shrink-0">
                      <Icon size={16} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] md:text-[13px] font-black uppercase tracking-[0.15em] text-[#800020] mb-0.5">{item.label}</p>
                      <p className="text-[15px] text-zinc-900 truncate">{item.val}</p>
                      <p className="text-[12px] md:text-[13px] text-zinc-500 mt-0.5">{item.desc}</p>
                    </div>
                    <ArrowUpRight size={15} className={`text-zinc-400 transition-all duration-300 shrink-0 ${activeChannel === i ? 'rotate-45 text-black' : ''}`} />
                  </a>
                );
              })}
            </div>

            <div className="flex items-start gap-3 p-4 bg-white border border-zinc-200 shadow-sm">
              <Clock size={16} className="text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] md:text-[13px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Support Hours</p>
                <p className="text-[14px] text-zinc-700 font-medium">Monday – Saturday: 10:00 AM – 7:00 PM IST</p>
                <p className="text-[14px] text-zinc-500">Sunday: Closed</p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Form */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="lg:col-span-7">
            <div className="bg-white border border-zinc-200 p-6 sm:p-8 md:p-10 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-[#800020]" />
                  <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-zinc-700">Send an Inquiry</h3>
                </div>
                <span className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider">* All fields required</span>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-xs font-medium">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleFormSubmit}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-500">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      maxLength={60}
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-black transition-colors placeholder:text-zinc-400"
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-500">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      maxLength={100}
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-black transition-colors placeholder:text-zinc-400"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-500">Mobile Phone (10 digits) *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      maxLength={10}
                      inputMode="numeric"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-black transition-colors placeholder:text-zinc-400 font-mono"
                      placeholder="10-digit phone number"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-500">Subject *</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-black transition-colors appearance-none cursor-pointer"
                    >
                      <option>Order Inquiry</option>
                      <option>Fragrance Consultation</option>
                      <option>Product Question</option>
                      <option>Pre-Order Request</option>
                      <option>Wholesale / B2B</option>
                      <option>General Inquiry</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-500">Your Message *</label>
                    <span className="text-[10px] text-zinc-400 font-mono">{formData.message.length}/1000</span>
                  </div>
                  <textarea
                    rows="5"
                    name="message"
                    required
                    maxLength={1000}
                    value={formData.message}
                    onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                    className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-black transition-colors resize-none placeholder:text-zinc-400"
                    placeholder="Tell us how our fragrance team can assist you..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-black hover:bg-[#800020] text-white font-black text-[12px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2.5 group cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                      Send Inquiry
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* MAP */}
      {/* <section className="bg-[#f5f5f5] py-14 md:py-16 border-t border-zinc-200">
        <div className="max-w-7xl py-3 mx-auto px-5 md:px-10 lg:px-14">
          <div className="mb-8 pb-8 border-b border-zinc-200">
            <span className="text-[12px] uppercase tracking-[0.3em] text-zinc-500   block mb-3">Find Us</span>
            <h2 className="text-2xl font-light text-zinc-900 uppercase tracking-widest">Visit Our Store</h2>
          </div>
          <div className="w-full h-[280px] sm:h-[350px] bg-zinc-100 overflow-hidden border border-zinc-200 shadow-sm">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241317.116396!2d72.74109995!3d19.08219865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c6306644edc1%3A0x5da4ed8f8d648c69!2sMumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%" height="100%"
              style={{ border: 0 }}
              allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              title="Mahirash Parfumerie Store Location"
            ></iframe>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default Contact;
