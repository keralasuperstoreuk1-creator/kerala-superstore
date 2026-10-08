'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  MapPin, 
  Truck, 
  ShoppingBag, 
  Phone, 
  ChevronRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  suggestions?: string[];
}

const COMMON_FAQS = [
  { label: '🚚 Delivery Charges & Free Delivery', query: 'What are your delivery charges and how do I get free UK delivery?' },
  { label: '📍 Store Location & Parking', query: 'Where is your store located and is there customer parking?' },
  { label: '🌾 Matta Rice & Spices in Stock', query: 'Do you have Palakkadan Matta Rice and authentic Kerala spices in stock?' },
  { label: '🍗 Fresh Dum Biriyani Specials', query: 'Is fresh Thalassery Dum Biriyani available today?' },
  { label: '💬 Order on WhatsApp', query: 'Can I order groceries directly through WhatsApp?' },
  { label: '🏷️ Discount Coupons & Offers', query: 'Are there any promo coupons or special discount codes active?' },
];

export default function AiCustomerChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: "Namaskaram! 🙏 Welcome to **Kerala Superstore Manchester** AI Smart Assistant. How can I help with your grocery shopping, stock, or UK delivery today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'What are delivery charges?',
        'Store location & parking',
        'Check Matta Rice stock',
        'Order on WhatsApp'
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      });

      if (res.ok) {
        const json = await res.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: json.reply || "I am glad to help! Please let me know if you need any other grocery assistance.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: json.suggestions || []
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('API failed');
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: "We are located at **Unit 2, 73 Old Market Street, Manchester, M9 8DX** with fast UK delivery (Free over £50). For urgent questions, you can message our team directly on WhatsApp at **+44 7749 132122**.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: ['Store Address', 'Delivery info', 'Chat on WhatsApp']
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Launcher Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3.5 rounded-full shadow-2xl shadow-emerald-900/40 border border-emerald-400/40 transition-all transform hover:scale-105 active:scale-95"
          aria-label="Open AI Customer Assistant"
        >
          {/* Animated Glow Ring */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-30 blur-sm group-hover:opacity-60 transition duration-500 animate-pulse"></span>

          <div className="relative w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-amber-300">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>

          <div className="relative text-left pr-1">
            <div className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider leading-none">
              24/7 AI Smart Assistant
            </div>
            <div className="text-xs font-black text-white leading-tight mt-0.5">
              Ask Kerala Superstore
            </div>
          </div>
        </button>
      )}

      {/* Interactive Chat Window Modal */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[410px] h-[580px] max-h-[85vh] bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm text-white leading-none">KSS Smart Assistant</h3>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/30">
                    Gemini AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>Unit 2, 73 Old Market St, M9 8DX</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick FAQ Chips Bar (Top Scrollable) */}
          <div className="bg-slate-900/90 border-b border-slate-800/80 px-3 py-2.5 overflow-x-auto no-scrollbar flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Quick FAQs:
            </span>
            {COMMON_FAQS.map((faq, i) => (
              <button
                key={i}
                onClick={() => handleSend(faq.query)}
                className="flex-shrink-0 text-[11px] font-semibold bg-slate-800 hover:bg-emerald-900/60 hover:text-emerald-200 text-slate-300 border border-slate-700 hover:border-emerald-500/40 px-2.5 py-1 rounded-full transition-all"
              >
                {faq.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/80">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-xl bg-emerald-700/60 text-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[82%] space-y-2`}>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none font-medium'
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none font-normal'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(sug)}
                          className="text-[10px] font-bold bg-slate-900/90 hover:bg-slate-800 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-lg transition-all text-left"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`text-[9px] text-slate-500 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-xs text-slate-400">
                <div className="w-7 h-7 rounded-xl bg-emerald-700/60 text-emerald-200 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom WhatsApp Handoff Strip */}
          <div className="bg-slate-900/60 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Need direct human support?</span>
            <a
              href="https://wa.me/447749132122?text=Hello%20Kerala%20Superstore,%20I%20have%20an%20enquiry"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
            >
              <Phone className="w-3 h-3" /> WhatsApp Live (+44 7749 132122)
            </a>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about stock, prices, delivery..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center transition-all flex-shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
