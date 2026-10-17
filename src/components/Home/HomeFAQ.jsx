import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { collection, query, orderBy, onSnapshot, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../Firebase";

export const DEFAULT_FAQS = [
  {
    id: "faq-1",
    question: "What makes Mahirash Extrait de Parfum different from regular perfumes?",
    answer:
      "Our Extrait de Parfum formulations feature an exceptional 25%–30% concentration of pure artisanal perfume oils and aged Cambodian agarwood. This high concentration ensures rich multi-layered projection, 12+ hours of longevity, and an undeniable sillage that evolves uniquely with your body chemistry.",
    category: "Fragrance & Artisanship",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "faq-2",
    question: "How should I store my luxury perfume to preserve its olfactory notes?",
    answer:
      "We recommend storing your fragrance bottles in a cool, dark place away from direct sunlight, excessive heat, and bathroom humidity. Keeping your flacons at a stable room temperature prevents the delicate top notes like bergamot and pink pepper from oxidizing.",
    category: "Fragrance Care",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "faq-3",
    question: "Are Mahirash fragrances unisex or gender-specific?",
    answer:
      "Haute perfumerie celebrates personal resonance over boundaries. While we curate masculine woods, regal ouds, and graceful florals, our compositions are crafted so that anyone can wear them. The fragrance interacts with individual skin warmth to create a truly bespoke signature.",
    category: "Scent Selection",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "faq-4",
    question: "Can I try sample discovery sets or miniatures before buying a full flacon?",
    answer:
      "Yes. We offer Pocket Luxury Miniatures (5ml–10ml) as well as curated Discovery Sets. This allows you to experience our rare extraits, explore how each note develops throughout the day, and choose your true signature scent.",
    category: "Discovery & Sampling",
    sort_order: 4,
    is_active: true,
  },
  {
    id: "faq-5",
    question: "What is your shipping and delivery timeline for online orders?",
    answer:
      "We offer complimentary express shipping across India on orders over ₹1999. All fragrances are safely dispatched in temperature-controlled luxury packaging and delivered within 4-5 days.",
    category: "Shipping & Delivery",
    sort_order: 5,
    is_active: true,
  },
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
          } else {
            setFaqs(DEFAULT_FAQS);
          }
        } else {
          // Auto-seed default FAQs into Firestore if empty
          DEFAULT_FAQS.forEach(async (faq) => {
            try {
              await setDoc(doc(db, "faqs", faq.id), faq);
            } catch {
              // Ignore seed error
            }
          });
          setFaqs(DEFAULT_FAQS);
        }
      },
      (err) => {
        console.warn("Could not listen to faqs collection:", err);
        setFaqs(DEFAULT_FAQS);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="faq" className="bg-[#FAF8F5] py-16 md:py-24 border-t border-[#EAE3D8] text-[#111111]">
      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* Left Column: Heading and Context */}
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-[0.15em] text-[#0D0D0D] uppercase leading-tight">
              FREQUENTLY ASKED <span className="text-[#B8860B] italic font-serif">QUESTIONS</span>
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base font-light leading-relaxed max-w-md pt-2">
              Everything you need to know about our handcrafted artisanal extraits, fragrance care, longevity, and worldwide concierge shipping.
            </p>
          </div>

          {/* Right Column: Accordion Questions */}
          <div className="lg:col-span-7 space-y-0 divide-y divide-zinc-200 border-y border-zinc-200">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={faq.id || index} className="py-5 sm:py-6 transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between gap-4 text-left group cursor-pointer"
                  >
                    <span className="font-serif text-base sm:text-lg text-zinc-900 group-hover:text-[#B8860B] transition-colors leading-snug">
                      {faq.question}
                    </span>
                    <div className="w-8 h-8 rounded-full border border-zinc-300 group-hover:border-[#B8860B] flex items-center justify-center shrink-0 text-zinc-600 group-hover:text-[#B8860B] transition-all">
                      {isOpen ? (
                        <Minus size={15} strokeWidth={2} />
                      ) : (
                        <Plus size={15} strokeWidth={2} />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-zinc-600 text-sm sm:text-[14.5px] font-light leading-relaxed pt-4 pr-6">
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
