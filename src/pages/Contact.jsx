import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, ArrowUpRight, X, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/Home/PageHeader';
import SEOHead from '../components/SEOHead';

const Contact = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  const communicationChannels = [
    { icon: Mail, label: 'Email Us', val: 'mahirash.help@gmail.com', href: 'mailto:mahirash.help@gmail.com', desc: 'We reply within 24 hours' },
    { icon: Phone, label: 'Call Us', val: '+91 8959041514', href: 'tel:+918959041514', desc: 'Mon–Sat, 10am – 7pm IST' },
    { icon: MapPin, label: 'Online Store', val: 'Worldwide Shipping', href: '#', desc: 'Completely Online & Globally Accessible' }
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
        description="Have questions or need support? Contact Mahirash official support at mahirash.help@gmail.com or call +91 8959041514. Worldwide online store."
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
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-3.5 shadow-2xl flex items-center gap-3"
          >
            <CheckCircle size={14} />
            <p className="text-[14px] font-black uppercase tracking-wider">Message sent! We'll respond shortly.</p>
            <button onClick={() => setFormSubmitted(false)} className="opacity-40 hover:opacity-100 ml-1"><X size={13} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl py-3 mx-auto px-5 md:px-10 lg:px-14 py-14 md:py-20">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* LEFT: Channels */}
          <motion.div {...fadeUp} className="lg:col-span-5 space-y-7">
            <div>
              <span className="text-[10px]   tracking-[0.3em] uppercase text-zinc-500 block mb-4">Reach Out</span>
              <h2 className="text-3xl sm:text-4xl font-light text-zinc-900 tracking-widest leading-[1.05] uppercase">We're Here<br />to Help</h2>
              <p className="text-[14px] text-zinc-600 mt-4 leading-relaxed max-w-sm">
                Whether you have a question about sizing, need styling advice, or want to discuss a bulk order — our team is ready.
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
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#b8860b] mb-0.5">{item.label}</p>
                      <p className="text-[15px]   text-zinc-900 truncate">{item.val}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</p>
                    </div>
                    <ArrowUpRight size={15} className={`text-zinc-400 transition-all duration-300 shrink-0 ${activeChannel === i ? 'rotate-45 text-black' : ''}`} />
                  </a>
                );
              })}
            </div>

            <div className="flex items-start gap-3 p-4 bg-white border border-zinc-200 shadow-sm">
              <Clock size={14} className="text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Business Hours</p>
                <p className="text-[14px] text-zinc-700 font-medium">Monday – Saturday: 10:00 AM – 7:00 PM IST</p>
                <p className="text-[14px] text-zinc-500">Sunday: Closed</p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Form */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="lg:col-span-7">
            <div className="bg-white border border-zinc-200 p-6 sm:p-8 md:p-10 shadow-sm">
              <div className="flex items-center gap-2 mb-7">
                <MessageSquare size={14} className="text-zinc-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Send a Message</h3>
              </div>

              <form className="space-y-4" onSubmit={handleFormSubmit}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Full Name</label>
                    <input type="text" required
                      className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Email Address</label>
                    <input type="email" required
                      className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Subject</label>
                  <select className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors appearance-none cursor-pointer">
                    <option>Order Inquiry</option>
                    <option>Product Question</option>
                    <option>Sizing Help</option>
                    <option>Returns & Exchanges</option>
                    <option>Wholesale / B2B</option>
                    <option>General Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Your Message</label>
                  <textarea rows="5" required
                    className="w-full bg-zinc-50 border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors resize-none placeholder:text-zinc-400"
                    placeholder="Tell us how we can help..."
                  ></textarea>
                </div>

                <button type="submit"
                  className="w-full py-4 bg-black hover:bg-zinc-800 text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2.5 group"
                >
                  <Send size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  Send Message
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
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500   block mb-3">Find Us</span>
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
