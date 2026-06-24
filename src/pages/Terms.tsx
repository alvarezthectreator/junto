import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';

interface TermsProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
}

export function Terms({
  onNavigate = () => {},
  setActiveNav = () => {},
  onCloseSidebar = () => {},
}: TermsProps) {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing or using wantuu ("Service"), you agree to these Terms of Service and any policies referenced here. If you do not agree, you should not use the service.`,
    },
    {
      title: '2. Use License',
      content: `wantuu grants you a limited, revocable, non-exclusive license to access and use the materials on the service for personal, non-commercial purposes. This license does not transfer ownership. Under this license, you may not:

• Modify or copy the materials
• Use the materials for commercial purposes or public display
• Decompile or reverse engineer software contained on wantuu
• Remove copyright or proprietary notices
• Transfer, mirror, or host the materials on another service
• Violate any applicable laws or regulations`,
    },
    {
      title: '3. Disclaimer',
      content: `The materials on wantuu are provided on an "as is" basis. wantuu makes no warranties, expressed or implied, and disclaims all other warranties, including implied warranties or conditions of merchantability, fitness for a particular purpose, and non-infringement.`,
    },
    {
      title: '4. Limitations',
      content: `In no event shall wantuu or its suppliers be liable for any damages, including loss of data, loss of profit, or business interruption, arising from the use or inability to use the materials on wantuu, even if wantuu or an authorized representative has been notified of the possibility of such damage.`,
    },
    {
      title: '5. Accuracy of Materials',
      content: `The materials appearing on wantuu may include technical, typographical, or photographic errors. wantuu does not warrant that any of the materials on its website are accurate, complete, or current, and may make changes to the materials at any time without notice.`,
    },
    {
      title: '6. Third-Party Links',
      content: `wantuu has not reviewed all of the sites linked to its website and is not responsible for the contents of any linked site. The inclusion of any link does not imply endorsement by wantuu. Use of any third-party website is at your own risk.`,
    },
    {
      title: '7. Modifications',
      content: `wantuu may revise these Terms of Service at any time without notice. By continuing to use the service, you agree to be bound by the current version of these terms.`,
    },
    {
      title: '8. Governing Law',
      content: `These Terms of Service are governed by and construed in accordance with the laws of Nigeria, and you irrevocably submit to the exclusive jurisdiction of the courts located in Lagos, Nigeria.`,
    },
    {
      title: '9. User Conduct',
      content: `You agree not to use wantuu to:

• Post or transmit abusive, obscene, profane, or sexually oriented material
• Harass, abuse, or harm another person
• Interfere with or disrupt the normal flow of the service
• Attempt to gain unauthorized access to our systems
• Engage in discrimination or hate speech
• Violate any applicable laws or regulations`,
    },
    {
      title: '10. Account Responsibility',
      content: `You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. You agree to notify wantuu immediately of any unauthorized use of your account or password. wantuu shall not be liable for any loss or damage arising from your failure to comply with this provision.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <div className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Settings
            </button>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold">Terms of Service</h1>
            </div>
            <p className="text-slate-400 text-sm">Last updated: June 24, 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-invert max-w-none space-y-6"
          >
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors"
              >
                <h2 className="text-xl font-bold mb-3 text-blue-400">{section.title}</h2>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm">
                  {section.content}
                </p>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sections.length * 0.05 }}
              className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl mt-8"
            >
              <h2 className="text-xl font-bold mb-3">Questions?</h2>
              <p className="text-slate-300 text-sm mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="text-sm text-blue-400">
                <p className="font-semibold">Email: legal@wantuu.com</p>
                <p className="font-semibold">Support: support@wantuu.com</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (sections.length + 1) * 0.05 }}
            className="mt-8 p-6 bg-white/5 border border-white/10 rounded-xl text-center"
          >
            <p className="text-sm text-slate-400 mb-4">
              By using wantuu, you agree to these Terms of Service
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('settings')}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors"
            >
              I Understand
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
