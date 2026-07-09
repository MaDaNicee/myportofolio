'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { FiUser, FiMail, FiMessageSquare, FiSend } from 'react-icons/fi';

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    setIsSending(true);

    // GANTI DENGAN ID DARI EMAILJS DASHBOARD KAMU
    // Nanti kamu harus daftar di emailjs.com (Gratis)
    const SERVICE_ID = 'YOUR_SERVICE_ID';  
    const TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; 
    const PUBLIC_KEY = 'YOUR_PUBLIC_KEY';   

    emailjs
      .sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, {
        publicKey: PUBLIC_KEY,
      })
      .then(
        () => {
          setIsSending(false);
          setStatus('success');
          formRef.current?.reset();
          setTimeout(() => setStatus('idle'), 5000); // Reset status setelah 5 detik
        },
        (error) => {
          console.error('FAILED...', error.text);
          setIsSending(false);
          setStatus('error');
        },
      );
  };

  return (
    <div className="w-full max-w-lg mx-auto">
        <form ref={formRef} onSubmit={sendEmail} className="flex flex-col gap-6">
            
            {/* Input Name */}
            <div className="relative group">
                <FiUser className="absolute left-4 top-4 text-text-light-muted dark:text-text-dark-muted group-focus-within:text-accent-primary transition-colors" />
                <input
                    type="text"
                    name="user_name"
                    placeholder="Your Name"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-light-surface/50 dark:bg-dark-surface/50 border border-light-border dark:border-dark-border focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all placeholder:text-text-light-muted/50 dark:placeholder:text-text-dark-muted/50"
                />
            </div>

            {/* Input Email */}
            <div className="relative group">
                <FiMail className="absolute left-4 top-4 text-text-light-muted dark:text-text-dark-muted group-focus-within:text-accent-primary transition-colors" />
                <input
                    type="email"
                    name="user_email"
                    placeholder="Your Email"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-light-surface/50 dark:bg-dark-surface/50 border border-light-border dark:border-dark-border focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all placeholder:text-text-light-muted/50 dark:placeholder:text-text-dark-muted/50"
                />
            </div>

            {/* Input Message */}
            <div className="relative group">
                <FiMessageSquare className="absolute left-4 top-4 text-text-light-muted dark:text-text-dark-muted group-focus-within:text-accent-primary transition-colors" />
                <textarea
                    name="message"
                    placeholder="Your Message"
                    rows={4}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-light-surface/50 dark:bg-dark-surface/50 border border-light-border dark:border-dark-border focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all resize-none placeholder:text-text-light-muted/50 dark:placeholder:text-text-dark-muted/50"
                />
            </div>

            {/* Submit Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSending}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                    isSending 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-accent-primary to-accent-secondary hover:shadow-accent-primary/25'
                }`}
            >
                {isSending ? (
                    'Sending...'
                ) : (
                    <>
                        Send Message <FiSend />
                    </>
                )}
            </motion.button>

            {/* Status Messages */}
            {status === 'success' && (
                <motion.p 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="text-green-500 text-center text-sm font-medium bg-green-500/10 py-2 rounded-lg"
                >
                    ✅ Message sent successfully! I'll get back to you soon.
                </motion.p>
            )}
            {status === 'error' && (
                <motion.p 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="text-red-500 text-center text-sm font-medium bg-red-500/10 py-2 rounded-lg"
                >
                    ❌ Failed to send message. Please try again later.
                </motion.p>
            )}
        </form>
    </div>
  );
}