'use client';

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Certificate } from "@/lib/data";

type CertificateModalProps = {
  certificate: Certificate | null;
  onClose: () => void;
};

export default function CertificateModal({ certificate, onClose }: CertificateModalProps) {
  return (
    <AnimatePresence>
      {certificate ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="bg-light-card/95 dark:bg-dark-card/95 border border-white/20 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/10"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-light-surface dark:bg-dark-surface hover:bg-red-500 hover:text-white transition-colors z-10"
              aria-label="Close certificate preview"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col gap-6 overflow-y-auto">
              <div className="pr-10">
                <h3 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                  {certificate.name}
                </h3>
                <div className="flex gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  <span className="font-semibold text-accent-primary">{certificate.issuer}</span>
                  <span>•</span>
                  <span>{certificate.date}</span>
                </div>
              </div>

              <div className="w-full rounded-xl overflow-hidden bg-light-surface dark:bg-dark-surface border border-light-border dark:border-white/10 flex items-center justify-center">
                {certificate.imageUrl ? (
                  <Image
                    src={certificate.imageUrl}
                    alt={certificate.name}
                    width={0}
                    height={0}
                    sizes="(min-width: 768px) 672px, calc(100vw - 2rem)"
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                ) : (
                  <div className="text-center p-12 opacity-50">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Preview image not available</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-light-border dark:border-white/10 hover:bg-light-surface dark:hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
                <a
                  href={certificate.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-accent-primary text-white hover:bg-accent-hover transition-colors flex items-center gap-2 shadow-lg shadow-accent-primary/25"
                >
                  <span>Verify Credential</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
