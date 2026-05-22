import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';

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
      content: `We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with other users. This may include:

• Name, email address, and phone number
• Date of birth and gender identity
• Profile photo and bio
• Location and travel information
• Payment information (processed securely)
• Communication preferences
• Event interests and preferences`,
    },
    {
      title: '2. How We Use Your Information',
      content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Personalize your experience on Junto
• Facilitate connections between users
• Process transactions and send related information
• Send promotional communications (with your consent)
• Respond to your inquiries and support requests
• Monitor and analyze trends and usage
• Comply with legal obligations
• Prevent fraud and ensure security`,
    },
    {
      title: '3. Information Sharing',
      content: `We do not sell your personal information. We may share your information with:

• Other users (as necessary to provide the service)
• Service providers who assist in operating our website and conducting our business
• Legal authorities when required by law
• Partners and third parties with your explicit consent

Your profile information may be visible to other users as part of the service.`,
    },
    {
      title: '4. Data Security',
      content: `We implement appropriate technical and organizational measures designed to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is completely secure. We encourage you to use strong passwords and keep your account information confidential.`,
    },
    {
      title: '5. Your Privacy Rights',
      content: `You have the right to:

• Access the personal information we hold about you
• Request correction of inaccurate information
• Request deletion of your information
• Opt-out of promotional communications
• Port your data to another service
• Withdraw your consent at any time

To exercise these rights, please contact us using the information provided below.`,
    },
    {
      title: '6. Location Information',
      content: `Junto may collect and use your location information to:

• Show nearby events and users
• Provide travel mode functionality
• Improve our services
• Ensure safety features work properly

You can control location sharing through your device settings and Junto preferences. Some features may be limited if location sharing is disabled.`,
    },
    {
      title: '7. Cookies and Tracking',
      content: `We use cookies and similar tracking technologies to enhance your experience. You can control cookie settings through your browser. Some features may not function properly if cookies are disabled.

We may use analytics tools to understand how users interact with our service.`,
    },
    {
      title: '8. Third-Party Links',
      content: `Junto may contain links to third-party websites and services that are not operated by us. This Privacy Policy does not apply to these external services, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party services before providing your information.`,
    },
    {
      title: '9. Children\'s Privacy',
      content: `Junto is not intended for users under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that a child under 18 has provided us with personal information, we will take steps to delete such information and terminate the child's account.`,
    },
    {
      title: '10. Changes to This Policy',
      content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of Junto following the posting of revised Privacy Policy means that you accept and agree to the changes.`,
    },
    {
      title: '11. International Data Transfers',
      content: `Your information may be transferred to, stored in, and processed in countries other than your country of residence. These countries may have data protection laws that differ from your home country. By using Junto, you consent to the transfer of your information to countries outside of your country of residence.`,
    },
    {
      title: '12. Do Not Track',
      content: `Some browsers include a "Do Not Track" feature. Currently, there is no industry standard for recognizing Do Not Track signals, and Junto does not respond to Do Not Track browser signals. However, you can use other tools to control data collection and use.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <Sidebar activeNav="Settings" setActiveNav={setActiveNav} onNavigate={onNavigate} onCloseSidebar={onCloseSidebar} />

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
              <Shield className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-slate-400 text-sm">Last updated: May 22, 2026</p>
          </motion.div>

          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white/5 border border-white/10 rounded-xl mb-6"
          >
            <p className="text-slate-300 leading-relaxed">
              At Junto, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and otherwise process personal information in connection with our services.
            </p>
          </motion.div>

          {/* Content */}
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

            {/* Contact Section */}
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
                <p className="font-semibold">Data Protection Officer: dpo@junto.com</p>
                <p className="font-semibold">Privacy Team: privacy@junto.com</p>
                <p className="font-semibold">Address: Lagos, Nigeria</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Acknowledgment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (sections.length + 3) * 0.05 }}
            className="mt-8 p-6 bg-white/5 border border-white/10 rounded-xl text-center"
          >
            <p className="text-sm text-slate-400 mb-4">
              By using Junto, you acknowledge that you have read and understood this Privacy Policy
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('Settings')}
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
