import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../Firebase";

export const DEFAULT_FAQS = [
  {
    id: "faq-1",
    question: "What makes Mahirash perfumes unique?",
    answer:
      "Our Extrait de Parfum formulations feature an exceptional 25%–30% concentration of pure artisanal perfume oils and aged agarwood, ensuring rich projection and 12+ hours of longevity that evolves with your body chemistry."
  },
  {
    id: "faq-2",
    question: "How long do your fragrances last?",
    answer:
      "Due to our high oil concentration (Extrait de Parfum grade), Mahirash fragrances typically last between 10 to 14+ hours on skin and up to 24 hours on fabrics."
  },
  {
    id: "faq-3",
    question: "Do you offer international shipping?",
    answer:
      "Yes, we provide international courier shipping with secure tracking to select global destinations, alongside complimentary express shipping across India."
  },
  {
    id: "faq-4",
    question: "Can I return or exchange a product?",
    answer:
      "Due to personal hygiene and the nature of luxury artisanal fragrances, opened flacons cannot be returned. However, damaged or defective items are promptly replaced."
  },
  {
    id: "faq-5",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, RuPay), UPI, Net Banking, and select digital wallets through our 100% secure encrypted gateway."
  }
];

const HomeFAQ = () => {
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "faqs"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((item) => item.is_active !== false)
            .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
          if (list.length > 0) {
            setFaqs(list);
          }
        }
      },
      (err) => {
        console.warn("Could not listen to faqs collection:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="faq" className="bg-[#FCF9F4] py-10 sm:py-14 border-t border-[#E9DCCB]/60 text-[#30231F]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Left Column: Heading and Context matching screenshot */}
          <div className="lg:col-span-5 space-y-2.5">
            <h2 className="text-2xl sm:text-3xl font-serif tracking-tight text-[#30231F] uppercase leading-tight font-normal">
              FREQUENTLY <span className="text-[#800020]">ASKED</span>
              <br />
              QUESTIONS
            </h2>
            <p className="text-[#75665D] text-[12px] sm:text-[13px] font-normal leading-relaxed max-w-sm pt-1">
              Find quick answers to the most common queries about our perfumes, shipping, payments and more.
            </p>
          </div>

          {/* Right Column: Clean Boxed Accordion items */}
          <div className="lg:col-span-7 space-y-2">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={faq.id || index}
                  className="bg-white rounded-md border border-[#E9E0D6] overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFAQ(index)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left group cursor-pointer"
                  >
                    <span className="text-[12px] sm:text-[13px] font-medium text-[#30231F] group-hover:text-[#800020] transition-colors leading-snug">
                      {faq.question}
                    </span>
                    <span className="text-[#75665D] group-hover:text-[#800020] transition-colors text-sm shrink-0">
                      {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-[#75665D] text-[11.5px] sm:text-[12px] font-normal leading-relaxed px-4 pb-3.5 pt-0 border-t border-zinc-100/80">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};

export default HomeFAQ;
