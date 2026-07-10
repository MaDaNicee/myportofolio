'use client';

import { AnimatePresence, motion } from "framer-motion";

type CvPreviewModalProps = {
  cvUrl: string;
  onClose: () => void;
};

export default function CvPreviewModal({ cvUrl, onClose }: CvPreviewModalProps) {
  return (
    <AnimatePresence>
      {cvUrl ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="bg-light-card/95 dark:bg-dark-card/95 border border-white/20 rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl relative flex flex-col ring-1 ring-white/10 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <h3 className="font-bold text-lg text-text-light-primary dark:text-text-dark-primary pl-2">Curriculum Vitae</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
                aria-label="Close CV preview"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-grow bg-gray-100 dark:bg-gray-900 w-full h-full relative">
              <iframe src={cvUrl} className="w-full h-full border-none" title="CV Preview" />
            </div>

            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border border-light-border dark:border-white/10 hover:bg-light-surface dark:hover:bg-white/5 transition-colors"
              >
                Close
              </button>
              <a
                href={cvUrl}
                download="CV_Muhammad_Nur_Ramadhan.pdf"
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-accent-primary text-white hover:bg-accent-hover transition-colors flex items-center gap-2 shadow-lg shadow-accent-primary/25"
              >
                <span>Download File</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
