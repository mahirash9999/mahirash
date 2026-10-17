import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, X, Send, User, ChevronDown, RotateCcw, MessageSquare } from 'lucide-react';
import { useStore } from './StoreProvider';

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    text: "Welcome to Mahirash Parfumerie. I am your Olfactory Concierge powered by Google Gemini. How may I guide your fragrance journey today?",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

const SUGGESTIONS = [
  "Recommend an evening oud extrait",
  "What is an Extrait de Parfum?",
  "Best perfume for gifting",
  "What is your delivery timeline?"
];

const FALLBACK_ANSWERS = {
  oud: "Our Royal Cambodian Oud extraits are crafted from rare, sustainably sourced agarwood resin aged for maximum richness. They feature hypnotic animalic, smoky, and warm woody accords that linger for 14+ hours on skin.",
  extrait: "Extrait de Parfum is the highest concentration of fragrance available in haute perfumerie (typically 25% to 40% pure botanical and aromatic oils). It lasts significantly longer and reveals complex base notes gracefully throughout the day.",
  gifting: "For luxury gifting, we recommend our Discovery Sets or signature Extrait de Parfum bottles. Each order is packaged in our signature gold-embossed presentation boxes.",
  delivery: "All online orders are carefully inspected, packaged in tamper-evident luxury containers, and delivered within 4-5 days nationwide across India.",
  default: "Thank you for inquiring with Mahirash Parfumerie. Our collection is handcrafted with rare botanical essences and fine artisanal perfume oils. You can browse our shop or let me know what scent family you enjoy (Oud, Floral, Amber, Woods, Fresh)!"
};

const getSmartFallback = (query) => {
  const q = query.toLowerCase();
  if (q.includes('oud') || q.includes('cambodian')) return FALLBACK_ANSWERS.oud;
  if (q.includes('extrait') || q.includes('concentration') || q.includes('last') || q.includes('longevity')) return FALLBACK_ANSWERS.extrait;
  if (q.includes('gift') || q.includes('present') || q.includes('box')) return FALLBACK_ANSWERS.gifting;
  if (q.includes('delivery') || q.includes('shipping') || q.includes('days') || q.includes('time') || q.includes('tracking')) return FALLBACK_ANSWERS.delivery;
  return FALLBACK_ANSWERS.default;
};

const GeminiChatbot = () => {
  const { siteSettings } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const apiKey = siteSettings?.gemini_api_key || import.meta.env.VITE_GEMINI_API_KEY || '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const userQuery = (textToSend || input).trim();
    if (!userQuery || loading) return;

    const userMessage = {
      role: 'user',
      text: userQuery,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      if (apiKey) {
        // Query Google Gemini API
        const systemPrompt = `You are the official AI Olfactory Concierge for Mahirash Parfumerie (mahirash.com), an ultra-luxury haute fragrance house. Mahirash specializes in rare botanical extraits de parfum, royal Cambodian ouds, and long-lasting bespoke signatures. Be polite, concise, and helpful. Mention that delivery across India is express within 4-5 days. If asked about return policy, mention that due to the personal hygiene of luxury extraits, returns are not accepted once opened, but transit damages are replaced immediately upon contacting concierge. Keep answers elegant and between 2-4 sentences.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: `${systemPrompt}\n\nPatron Question: ${userQuery}` }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 250
              }
            })
          }
        );

        if (!response.ok) {
          throw new Error('Gemini API call failed');
        }

        const data = await response.json();
        const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (replyText) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              text: replyText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setLoading(false);
          return;
        }
      }

      // Graceful Intelligent Fallback if API key is not present or rate limited
      setTimeout(() => {
        const fallbackReply = getSmartFallback(userQuery);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: fallbackReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setLoading(false);
      }, 700);

    } catch (err) {
      console.warn("Gemini chatbot fallback active:", err);
      setTimeout(() => {
        const fallbackReply = getSmartFallback(userQuery);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: fallbackReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setLoading(false);
      }, 500);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[95] font-sans">
      {/* ── CHAT TRIGGER BUTTON ── */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 rounded-full bg-[#0D0D0D] border-2 border-[#B8860B] text-white flex items-center justify-center shadow-[0_12px_30px_rgba(184,134,11,0.35)] hover:shadow-[0_16px_40px_rgba(184,134,11,0.55)] transition-all duration-300 cursor-pointer group"
          aria-label="Open AI Olfactory Concierge"
        >
          {/* Ambient Gold Radial Glow */}
          <div className="absolute inset-0 rounded-full bg-[#B8860B] opacity-20 animate-pulse pointer-events-none" />

          {/* Sparkle & Bot Icon */}
          <div className="relative z-10 flex items-center justify-center">
            <Sparkles size={20} className="text-[#D4AF37] animate-pulse" />
          </div>

          {/* Floating Pill Badge */}
          <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-black font-black text-[9px] uppercase tracking-wider rounded-full shadow-md border border-black/40">
            AI
          </span>
        </motion.button>
      )}

      {/* ── EXPANDED CHAT WINDOW ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[92vw] sm:w-[400px] h-[550px] max-h-[82vh] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[#E5D5B8] flex flex-col overflow-hidden text-zinc-900"
          >
            {/* Header */}
            <div className="bg-[#0D0D0D] p-4 text-white flex items-center justify-between border-b border-[#B8860B]/40 relative">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#B8860B] to-[#D4AF37] text-black flex items-center justify-center font-bold shadow-md">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-white">
                      Mahirash Concierge
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-[#B8860B]/20 text-[#D4AF37] border border-[#B8860B]/30 uppercase tracking-widest">
                      Gemini
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-light flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online • Olfactory AI Assistant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMessages(INITIAL_MESSAGES)}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10"
                  title="Reset conversation"
                  aria-label="Reset chat"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10"
                  aria-label="Close chat"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAF8F5]/60 scrollbar-thin scrollbar-thumb-zinc-200">
              {messages.map((msg, i) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={i}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-[#0D0D0D] text-white rounded-br-none'
                          : 'bg-white text-zinc-800 border border-[#E5D5B8] rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1 px-1">
                      {msg.time}
                    </span>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 p-3 bg-white border border-[#E5D5B8] rounded-2xl rounded-bl-none max-w-[80px]">
                  <span className="w-2 h-2 rounded-full bg-[#B8860B] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#B8860B] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#B8860B] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 bg-white border-t border-zinc-100 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(s)}
                  disabled={loading}
                  className="px-2.5 py-1 text-[11px] bg-zinc-50 border border-zinc-200 hover:border-[#B8860B] hover:text-[#B8860B] text-zinc-600 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about fragrance notes, extraits, gifting..."
                className="flex-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:border-[#B8860B] focus:bg-white transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-[#0D0D0D] hover:bg-[#B8860B] text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-[#0D0D0D] shadow-sm shrink-0"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GeminiChatbot;
