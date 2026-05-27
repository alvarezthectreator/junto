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
      content: `By accessing and using Junto ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`,
    },
    {
      title: '2. Use License',
      content: `Permission is granted to temporarily download one copy of the materials (information or software) on Junto for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
      
• Modifying or copying the materials
• Using the materials for any commercial purpose or for any public display
• Attempting to decompile or reverse engineer any software contained on Junto
• Removing any copyright or other proprietary notations from the materials
• Transferring the materials to another person or "mirroring" the materials on any other server
• Violating any applicable laws or regulations`,
    },
    {
      title: '3. Disclaimer',
      content: `The materials on Junto's website are provided on an 'as is' basis. Junto makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.`,
    },
    {
      title: '4. Limitations',
      content: `In no event shall Junto or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Junto, even if Junto or an authorized representative has been notified orally or in writing of the possibility of such damage.`,
    },
    {
      title: '5. Accuracy of Materials',
      content: `The materials appearing on Junto could include technical, typographical, or photographic errors. Junto does not warrant that any of the materials on its website are accurate, complete, or current. Junto may make changes to the materials contained on its website at any time without notice.`,
    },
    {
      title: '6. Materials on Website',
      content: `Junto has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Junto of the site. Use of any such linked website is at the user's own risk.`,
    },
    {
      title: '7. Modifications',
      content: `Junto may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.`,
    },
    {
      title: '8. Governing Law',
      content: `These terms and conditions are governed by and construed in accordance with the laws of Nigeria, and you irrevocably submit to the exclusive jurisdiction of the courts located in Lagos, Nigeria.`,
    },
    {
      title: '9. User Conduct',
      content: `You agree not to use Junto to:
      
• Post or transmit abusive, obscene, profane, or sexually-oriented material
• Harass, abuse, or harm another person
• Interfere with or disrupt the normal flow of dialogue within our website
• Attempt to gain unauthorized access to our systems
• Engage in any form of discrimination or hate speech
• Violate any applicable laws or regulations`,
    },
    {
      title: '10. Account Responsibility',
      content: `You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. You agree to notify Junto immediately of any unauthorized use of your account or password. Junto shall not be liable for any loss or damage arising from your failure to comply with this provision.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <div className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => onNavigate('Settings')}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Settings
            </button>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold">Terms of Service</h1>
            </div>
            <p className="text-slate-400 text-sm">Last updated: May 22, 2026</p>
          </motion.div>

          {/* Content */}
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

            {/* Contact Section */}
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
                <p className="font-semibold">Email: legal@junto.com</p>
                <p className="font-semibold">Support: support@junto.com</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Acceptance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (sections.length + 1) * 0.05 }}
            className="mt-8 p-6 bg-white/5 border border-white/10 rounded-xl text-center"
          >
            <p className="text-sm text-slate-400 mb-4">
              By using Junto, you agree to these Terms of Service
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('Settings')}
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
