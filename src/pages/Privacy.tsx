import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';

interface PrivacyProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
}

export function Privacy({
  onNavigate = () => {},
  setActiveNav = () => {},
  onCloseSidebar = () => {},
}: PrivacyProps) {
  const sections = [
    {
      title: '1. Information We Collect',
      content: `We collect information you provide directly to us, such as when you create an account, update your profile, contact support, or interact with other users. This may include:

• Name, email address, and phone number
• Date of birth and gender identity
• Profile photo, bio, and preferences
• Location and travel information
• Payment-related information processed securely by our providers
• Communication preferences
• Event interests and activity history`,
    },
    {
      title: '2. How We Use Your Information',
      content: `We use the information we collect to:

• Provide, maintain, and improve wantuu
• Personalize your experience on wantuu
• Help users connect, join, and manage activities
• Process transactions and send related information
• Send communications with your consent
• Respond to inquiries and support requests
• Monitor usage, performance, and product trends
• Comply with legal obligations
• Prevent fraud and help keep the service secure`,
    },
    {
      title: '3. Information Sharing',
      content: `We do not sell your personal information. We may share information with:

• Other users, as needed to provide the service
• Service providers that help us operate wantuu
• Legal authorities when required by law
• Partners and third parties with your explicit consent

Some profile information may be visible to other users as part of the service.`,
    },
    {
      title: '4. Data Security',
      content: `We use technical and organizational safeguards designed to protect your personal information against unauthorized access, alteration, disclosure, or destruction. No internet transmission is fully secure, so we encourage you to use strong passwords and keep your account details private.`,
    },
    {
      title: '5. Your Privacy Rights',
      content: `Depending on where you live, you may have the right to:

• Access the personal information we hold about you
• Request correction of inaccurate information
• Request deletion of your information
• Opt out of promotional communications
• Request a copy of your data
• Withdraw consent where applicable

To exercise these rights, please contact us using the details below.`,
    },
    {
      title: '6. Location Information',
      content: `wantuu may collect and use your location information to:

• Show nearby events and users
• Support travel mode and safety features
• Improve matching and recommendations
• Provide location-aware product experiences

You can control location sharing through your device settings and wantuu preferences. Some features may be limited if location sharing is disabled.`,
    },
    {
      title: '7. Cookies and Tracking',
      content: `We use cookies and similar technologies to improve your experience, remember preferences, and understand how the service is used. You can control cookie settings through your browser, although some features may not function properly if cookies are disabled. We may also use analytics tools to measure performance and usage patterns.`,
    },
    {
      title: '8. Third-Party Links',
      content: `wantuu may contain links to third-party websites and services that are not operated by us. This Privacy Policy does not apply to those services, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party service before providing your information.`,
    },
    {
      title: '9. Children\'s Privacy',
      content: `wantuu is not intended for users under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that a child under 18 has provided personal information, we will take steps to delete it and terminate the account.`,
    },
    {
      title: '10. Changes to This Policy',
      content: `We may update this Privacy Policy from time to time. If we do, we will post the revised policy on this page and update the "Last updated" date. Your continued use of wantuu after a revision becomes effective means that you accept the updated policy.`,
    },
    {
      title: '11. International Data Transfers',
      content: `Your information may be transferred to, stored in, and processed in countries other than your country of residence. Those countries may have data protection laws that differ from your home country. By using wantuu, you consent to the transfer of your information as described in this policy.`,
    },
    {
      title: '12. Do Not Track',
      content: `Some browsers include a "Do Not Track" feature. There is currently no universal standard for interpreting these signals, and wantuu does not respond to them. You can still use browser and device tools to manage data collection preferences.`,
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
              <Shield className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-slate-400 text-sm">Last updated: June 24, 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white/5 border border-white/10 rounded-xl mb-6"
          >
            <p className="text-slate-300 leading-relaxed">
              At wantuu, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and otherwise process personal information in connection with our services.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (index + 2) * 0.05 }}
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
              transition={{ delay: (sections.length + 2) * 0.05 }}
              className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl mt-8"
            >
              <h2 className="text-xl font-bold mb-3">Privacy Questions?</h2>
              <p className="text-slate-300 text-sm mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="text-sm text-blue-400">
                <p className="font-semibold">Data Protection Officer: dpo@wantuu.com</p>
                <p className="font-semibold">Privacy Team: privacy@wantuu.com</p>
                <p className="font-semibold">Address: Lagos, Nigeria</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (sections.length + 3) * 0.05 }}
            className="mt-8 p-6 bg-white/5 border border-white/10 rounded-xl text-center"
          >
            <p className="text-sm text-slate-400 mb-4">
              By using wantuu, you acknowledge that you have read and understood this Privacy Policy
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('settings')}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors"
            >
              Got it
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
