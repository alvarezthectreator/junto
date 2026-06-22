import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Building2,
  Home,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Users2,
} from "lucide-react";

const COLORS = {
  bg: "#0f1117",
  cardBorder: "rgba(255,255,255,0.07)",
  sidebar: "#13141d",
  accent: "#7c5cfc",
  accentGrad: "linear-gradient(135deg,#7c5cfc,#5b8af5)",
  text: "#e8eaf6",
  muted: "rgba(232,234,246,0.45)",
  amber: "#fbbf24",
};

type AdminSidebarPage = "admin" | "admin-users" | "admin-high-risk" | "admin-safety-plans" | "admin-listings" | "admin-system";

type AdminSidebarProps = {
  activePage: AdminSidebarPage;
  onNavigate?: (page: string) => void;
};

const ITEMS: Array<{
  label: string;
  page: AdminSidebarPage;
  icon: typeof Home;
}> = [
  { label: "Home", page: "admin", icon: Home },
  { label: "Users", page: "admin-users", icon: Users2 },
  { label: "High-Risk", page: "admin-high-risk", icon: ShieldAlert },
  { label: "Safety & Plans", page: "admin-safety-plans", icon: ShieldCheck },
  { label: "Venues & Celebs", page: "admin-listings", icon: Building2 },
  { label: "System Status", page: "admin-system", icon: Activity },
];

export function AdminSidebar({ activePage, onNavigate }: AdminSidebarProps) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.innerWidth < 768;
  });

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <aside
      style={{
        width: isMobile ? "100%" : 208,
        minHeight: isMobile ? "auto" : "100vh",
        background: COLORS.sidebar,
        borderRight: `1px solid ${COLORS.cardBorder}`,
        display: "flex",
        flexDirection: isMobile ? "row" : "column",
        alignItems: isMobile ? "stretch" : "stretch",
        justifyContent: "flex-start",
        padding: isMobile ? "12px 14px" : "20px 0",
        gap: isMobile ? 10 : 12,
        flexShrink: 0,
        overflowX: isMobile ? "auto" : "visible",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: COLORS.accentGrad,
          display: "grid",
          placeItems: "center",
          marginBottom: isMobile ? 0 : 16,
          marginRight: isMobile ? 4 : 0,
          alignSelf: isMobile ? "center" : "center",
          flexShrink: 0,
        }}
      >
        <Home size={16} color="#fff" />
      </div>

      {ITEMS.map((item) => {
        const isActive = activePage === item.page;
        const Icon = item.icon;

        return (
          <button
            key={item.page}
            onClick={() => onNavigate?.(item.page)}
            title={item.label}
            aria-label={item.label}
            style={{
              width: isMobile ? "auto" : "calc(100% - 24px)",
              minWidth: isMobile ? 122 : "unset",
              height: isMobile ? 40 : 44,
              borderRadius: isMobile ? 999 : 14,
              background: isActive ? COLORS.accent : "rgba(255,255,255,0.05)",
              border: `1px solid ${COLORS.cardBorder}`,
              color: isActive ? "#fff" : item.page === "admin-high-risk" ? COLORS.amber : item.page === "admin-listings" ? COLORS.text : item.page === "admin-system" ? COLORS.cyan : item.page === "admin-safety-plans" ? "#fda4af" : COLORS.muted,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 10,
              padding: isMobile ? "0 14px" : "0 14px",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <Icon size={16} strokeWidth={2.2} />
            <span style={{ display: "inline", fontWeight: 600, fontSize: isMobile ? 12 : 13 }}>{item.label}</span>
          </button>
        );
      })}

      <div style={{ marginTop: isMobile ? 0 : "auto", marginLeft: isMobile ? "auto" : "0", display: "flex", flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => onNavigate?.("main")}
          title="Back to app"
          aria-label="Back to app"
          style={{
            width: isMobile ? 40 : 36,
            height: isMobile ? 40 : 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${COLORS.cardBorder}`,
            color: COLORS.text,
            fontSize: 15,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          <ArrowLeft size={14} />
        </button>
        <button
          title="Theme"
          aria-label="Theme"
          style={{
            width: isMobile ? 40 : 32,
            height: isMobile ? 40 : 32,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            border: "none",
            color: COLORS.muted,
            fontSize: 14,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Moon size={14} />
        </button>
      </div>
    </aside>
  );
}
