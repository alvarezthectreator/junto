import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";

interface HelpProps {
  onNavigate?: (page: string) => void;
  isLightMode?: boolean;
}

function FaqItem({ faq, index, isExpanded, onToggle, isLightMode = false }: { faq: any; index: number; isExpanded: boolean; onToggle: () => void; isLightMode?: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50 + index * 40);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      style={{
        background: isLightMode ? "#fffaf2" : "#0a0a0a",
        border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1c1c1c",
        borderRadius: 12,
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!isExpanded) {
          (e.currentTarget as any).style.borderColor = "#F69D11";
        }
      }}
      onMouseLeave={(e) => {
        if (!isExpanded) {
          (e.currentTarget as any).style.borderColor = isLightMode ? "rgba(36,27,16,0.1)" : "#1c1c1c";
        }
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          background: isExpanded ? (isLightMode ? "rgba(245,158,11,0.08)" : "rgba(246,157,17,0.05)") : (isLightMode ? "#fffaf2" : "#0a0a0a"),
          border: "none",
          borderBottom: isExpanded ? (isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a") : "none",
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#F69D11", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            {faq.category}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: isLightMode ? "#241b10" : "#fff", lineHeight: 1.3 }}>{faq.question}</div>
        </div>
        <div
          style={{
            fontSize: 18,
            marginLeft: 16,
            transition: "transform 0.3s ease",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </div>
      </button>

      {isExpanded && (
        <div
          style={{
            background: isLightMode ? "#f7f3ea" : "#050505",
            padding: "16px",
            borderTop: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
            fontSize: 13,
            color: isLightMode ? "#7a674f" : "#aaa",
            lineHeight: 1.6,
            animation: "slideDown 0.3s ease",
          }}
        >
          {faq.answer}
        </div>
      )}
    </div>
  );
}

function ResourceCard({ icon, title, description, delay, isLightMode = false }: { icon: string; title: string; description: string; delay: number; isLightMode?: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <button
      style={{
        width: "100%",
        textAlign: "left",
        background: isLightMode ? "#fffaf2" : "#0a0a0a",
        border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1c1c1c",
        borderRadius: 12,
        padding: "16px",
        cursor: "pointer",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "all 0.4s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as any).style.borderColor = "#F69D11";
        (e.currentTarget as any).style.backgroundColor = isLightMode ? "rgba(245,158,11,0.06)" : "rgba(246,157,17,0.03)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as any).style.borderColor = isLightMode ? "rgba(36,27,16,0.1)" : "#1c1c1c";
        (e.currentTarget as any).style.backgroundColor = isLightMode ? "#fffaf2" : "#0a0a0a";
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: isLightMode ? "#241b10" : "#fff" }}>{title}</p>
      <p style={{ margin: 0, fontSize: 11, color: isLightMode ? "#8d7758" : "#888" }}>{description}</p>
    </button>
  );
}

export const Help: React.FC<HelpProps> = ({ onNavigate = () => {}, isLightMode = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeaderVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const faqs = [
    {
      id: "1",
      category: "Getting Started",
      question: "How does TagAlong work?",
      answer:
        "TagAlong is a social platform for finding and joining activities with people near you. Hosts post events they're planning, and you can browse, save, and join events that match your interests. All payments happen at the venue only - never online.",
    },
    {
      id: "2",
      category: "Getting Started",
      question: "How do I set up my profile?",
      answer:
        "During onboarding, you'll select your interests, location, and add photos. Your first photo becomes your avatar. You can edit everything later from your Profile tab. We recommend adding multiple photos for better match visibility.",
    },
    {
      id: "3",
      category: "Billing",
      question: "What are the billing tiers?",
      answer:
        "TagAlong has 4 billing tiers: HOST_ALL (host covers everything), HOST_NO_TRANSPORT (~75% covered), SPLIT (50/50), and HOST_ME (you cover both). The host chooses the tier when creating an event.",
    },
    {
      id: "4",
      category: "Billing",
      question: "When do I pay?",
      answer:
        "All payments happen AT THE VENUE only. Never send money to the host before the event. There are no online payments for outings - you pay in cash or card when you arrive.",
    },
    {
      id: "5",
      category: "Safety",
      question: "How does check-in work?",
      answer:
        "When you join an event, a Check-In button appears on event day. Tap it to record your GPS location. Both parties must check in within 30 minutes for the outing to be confirmed. This verifies you're both at the same location.",
    },
    {
      id: "6",
      category: "Safety",
      question: "What is the Reliability Score?",
      answer:
        "Your Reliability Score shows how trustworthy you are (0-100%). It goes up when you complete outings and get good ratings. It goes down if you cancel inside the cancellation window (-10) or don't show up (-25).",
    },
    {
      id: "7",
      category: "Safety",
      question: "How do I verify my identity?",
      answer:
        "Go to your Profile and tap 'Verify Your Identity'. In Nigeria, we accept NIN, BVN, or government ID. Internationally, we accept passport or national ID. Verification is optional but gives you a blue ✓ badge that helps hosts trust you.",
    },
    {
      id: "8",
      category: "Safety",
      question: "How do I report someone?",
      answer:
        "Tap the three-dot menu on any profile, event, or in a chat. Select 'Report' and choose the reason. Our safety team reviews reports within 24 hours. The reported person won't know they've been reported until we investigate.",
    },
    {
      id: "9",
      category: "Cancellations",
      question: "What is the cancellation window?",
      answer:
        "The cancellation window is 20% of the time between event creation and the event start time. For a 7-day event, it's ~34 hours. You can cancel outside the window for free, but inside the window, you lose -10 points.",
    },
    {
      id: "10",
      category: "Cancellations",
      question: "What happens if I don't show up?",
      answer:
        "If you don't check in 60 minutes after the event starts, the system flags a no-show. Your reliability score drops -25 points. Your trusted contacts are notified. You can submit an explanation to appeal.",
    },
    {
      id: "11",
      category: "Premium",
      question: "What's included in Premium?",
      answer:
        "Premium gives you unlimited event joins (vs 10/day free), unlimited swipes, unlimited saved searches, access to Travel Mode, and up to 3 Host Me events per month. Cancel anytime.",
    },
    {
      id: "12",
      category: "Premium",
      question: "Can I get a refund?",
      answer:
        "We offer a 7-day money-back guarantee. If you're not satisfied within 7 days of purchase, contact support and we'll refund you fully. After 7 days, refunds are case-by-case.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: isLightMode ? "#f7f3ea" : "#050505", color: isLightMode ? "#241b10" : "#fff", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${isLightMode ? '#f3eadc' : '#0a0a0a'}; }
        ::-webkit-scrollbar-thumb { background: ${isLightMode ? '#d8c7ab' : '#1c1c1c'}; border-radius: 2px; }
      `}</style>

      <Sidebar activeNav="Help" setActiveNav={() => {}} onNavigate={onNavigate} />

      <main className="mobile-page-main" style={{ flex: 1, marginLeft: 256, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", background: isLightMode ? "#f7f3ea" : "#050505" }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: isLightMode ? "rgba(247,243,234,0.92)" : "rgba(5,5,5,0.9)",
            backdropFilter: "blur(20px)",
            borderBottom: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #111",
            padding: "16px 28px",
            display: "flex",
            alignItems: "center",
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(-8px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            width: "100%",
            maxWidth: 720,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#F69D11", marginBottom: 2 }}>
              Support
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: isLightMode ? "#241b10" : "#fff", letterSpacing: -0.5 }}>
              Help & Support
            </h1>
          </div>
        </div>

        <div style={{ padding: "24px 28px", maxWidth: 720, width: "100%", flex: 1, overflowY: "auto" }}>
          {/* Search Bar */}
          <div style={{ marginBottom: 28 }}>
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: isLightMode ? "#fffaf2" : "#0a0a0a",
                border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
                borderRadius: 10,
                color: isLightMode ? "#241b10" : "#fff",
                fontSize: 14,
                outline: "none",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                (e.currentTarget as any).style.borderColor = "#F69D11";
              }}
              onBlur={(e) => {
                (e.currentTarget as any).style.borderColor = isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a";
              }}
            />
          </div>

          {/* Contact Support Card */}
          <div
            style={{
              background: isLightMode ? "rgba(245,158,11,0.10)" : "rgba(246,157,17,0.08)",
              border: isLightMode ? "1px solid rgba(245,158,11,0.18)" : "1px solid rgba(246,157,17,0.2)",
              borderRadius: 12,
              padding: "16px",
              marginBottom: 28,
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#F69D11" }}>💬 Need Help?</h3>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: isLightMode ? "#8d7758" : "#aaa" }}>Didn't find what you're looking for? Reach out to our support team.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: isLightMode ? "rgba(245,158,11,0.10)" : "rgba(246,157,17,0.1)",
                  border: isLightMode ? "1px solid rgba(245,158,11,0.18)" : "1px solid rgba(246,157,17,0.2)",
                  borderRadius: 8,
                  color: "#F69D11",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as any).style.background = "rgba(246,157,17,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as any).style.background = "rgba(246,157,17,0.1)";
                }}
              >
                💬 Live Chat
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "rgba(246,157,17,0.1)",
                  border: "1px solid rgba(246,157,17,0.2)",
                  borderRadius: 8,
                  color: "#F69D11",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as any).style.background = "rgba(246,157,17,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as any).style.background = "rgba(246,157,17,0.1)";
                }}
              >
                📧 Email Us
              </button>
            </div>
          </div>

          {/* FAQs */}
          {filteredFaqs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              {filteredFaqs.map((faq, idx) => (
                  <FaqItem
                  key={faq.id}
                  faq={faq}
                  index={idx}
                  isExpanded={expandedFaqId === faq.id}
                  onToggle={() => setExpandedFaqId(expandedFaqId === faq.id ? null : faq.id)}
                  isLightMode={isLightMode}
                />
              ))}
            </div>
          ) : (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#2a2a2a" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>◌</div>
              <p style={{ fontSize: 14 }}>No results found. Try a different search.</p>
            </div>
          )}

          {/* Resources */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: isLightMode ? "#241b10" : "#fff", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              Resources
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              <ResourceCard icon="📱" title="Download App" description="iOS & Android" delay={200} isLightMode={isLightMode} />
              <ResourceCard icon="🔒" title="Privacy & Security" description="Data protection" delay={240} isLightMode={isLightMode} />
              <ResourceCard icon="⚖️" title="Terms of Service" description="Community guidelines" delay={280} isLightMode={isLightMode} />
              <ResourceCard icon="🆘" title="Report a Problem" description="Improve our service" delay={320} isLightMode={isLightMode} />
            </div>
          </div>

          {/* Community Guidelines */}
          <div
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 12,
              padding: "16px",
              marginBottom: 32,
            }}
          >
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: isLightMode ? "#241b10" : "#fff" }}>✨ Community Guidelines</h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: isLightMode ? "#7a674f" : "#aaa", fontSize: 12, lineHeight: 1.8 }}>
              <li style={{ marginBottom: 6 }}>Be respectful and inclusive to everyone</li>
              <li style={{ marginBottom: 6 }}>Never ask for money before an outing</li>
              <li style={{ marginBottom: 6 }}>Show up on time or let the host know</li>
              <li style={{ marginBottom: 6 }}>Share your profile ID with trusted contacts</li>
              <li>Report suspicious activity immediately</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Help;
