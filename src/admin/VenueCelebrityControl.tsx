import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  Building2,
  CalendarDays,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Users2,
} from "lucide-react";
import {
  createCelebrity,
  createCelebrityReview,
  createVenue,
  createVenueReview,
  deleteCelebrity,
  deleteCelebrityReview,
  deleteVenue,
  deleteVenueReview,
  getCelebritiesAdmin,
  getVenueById,
  getVenues,
  updateCelebrity,
  updateVenue,
  type EventReview,
} from "../services/api";
import { appendAdminActivity } from "../services/adminActivityLog";
import { AdminSidebar } from "./AdminSidebar";
import { useAdminViewport } from "./useAdminViewport";

const COLORS = {
  bg: "#0f1117",
  card: "#181a23",
  cardBorder: "rgba(255,255,255,0.07)",
  sidebar: "#13141d",
  accent: "#7c5cfc",
  accentGrad: "linear-gradient(135deg,#7c5cfc,#5b8af5)",
  text: "#e8eaf6",
  muted: "rgba(232,234,246,0.45)",
  dimmer: "rgba(232,234,246,0.25)",
  green: "#4ade80",
  rose: "#f87171",
  amber: "#fbbf24",
  cyan: "#22d3ee",
};

type VenueRow = {
  id: string;
  name: string;
  category: string;
  description?: string;
  address?: string;
  city: string;
  country?: string;
  state?: string;
  photo_urls?: string | string[];
  opening_hours?: string;
  price_range?: string;
  phone?: string;
  website?: string;
  is_active?: boolean | number;
  review_count?: number;
  avg_rating?: number;
  latitude?: number | null;
  longitude?: number | null;
};

type CelebrityRow = {
  id: string;
  name: string;
  category: string;
  bio?: string;
  photo_url?: string;
  outing_types?: string | string[];
  base_price?: number;
  currency?: string;
  is_active?: boolean | number;
  booking_count?: number;
  review_count?: number;
  avg_rating?: number;
};

type VenueDetail = {
  venue: VenueRow;
  reviews?: Array<EventReview & { reviewer_name?: string }>;
  rating?: { average: number; total: number };
};

type CelebrityReview = EventReview & { reviewer_name?: string; booking_id?: string | null };

type CelebrityDetail = {
  reviews?: CelebrityReview[];
  summary?: { average_rating: number; total_reviews: number };
  celebrity?: CelebrityRow;
};

type VenueDraft = {
  name: string;
  category: string;
  description: string;
  address: string;
  country: string;
  state: string;
  city: string;
  latitude: string;
  longitude: string;
  photo_urls: string;
  opening_hours: string;
  price_range: string;
  phone: string;
  website: string;
  is_active: boolean;
};

type CelebrityDraft = {
  name: string;
  category: string;
  bio: string;
  photo_url: string;
  outing_types: string;
  base_price: string;
  currency: string;
  is_active: boolean;
};

type ReviewDraft = {
  user_id: string;
  rating: string;
  review: string;
};

type ActiveTab = "venues" | "celebrities";

function formatRating(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0.0";
  return value.toFixed(1);
}

function formatDate(value?: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  return (name.trim()[0] || "U").toUpperCase();
}

function parseArrayField(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
}

function parsePhotoUrls(value: string) {
  return parseArrayField(value);
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyVenueDraft(): VenueDraft {
  return {
    name: "",
    category: "",
    description: "",
    address: "",
    country: "Nigeria",
    state: "Lagos",
    city: "Lagos",
    latitude: "",
    longitude: "",
    photo_urls: "",
    opening_hours: "",
    price_range: "",
    phone: "",
    website: "",
    is_active: true,
  };
}

function emptyCelebrityDraft(): CelebrityDraft {
  return {
    name: "",
    category: "",
    bio: "",
    photo_url: "",
    outing_types: "",
    base_price: "",
    currency: "NGN",
    is_active: true,
  };
}

function emptyReviewDraft(): ReviewDraft {
  return { user_id: "", rating: "5", review: "" };
}

function StatusPill({ label, tone }: { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }) {
  const toneStyles: Record<string, { background: string; color: string }> = {
    success: { background: "rgba(74,222,128,0.12)", color: COLORS.green },
    warning: { background: "rgba(251,191,36,0.12)", color: COLORS.amber },
    danger: { background: "rgba(248,113,113,0.12)", color: COLORS.rose },
    info: { background: "rgba(34,211,238,0.12)", color: COLORS.cyan },
    neutral: { background: "rgba(255,255,255,0.05)", color: COLORS.muted },
  };
  const styles = toneStyles[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: styles.background, color: styles.color, fontSize: 11, fontWeight: 600 }}>
      {label}
    </span>
  );
}

function DetailShell({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{title}</div>
          <div style={{ fontSize: 11, color: COLORS.muted }}>{subtitle}</div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.05)", color: COLORS.text }}>
          {icon}
        </div>
      </div>
      {children}
    </div>
  );
}

export function VenueCelebrityControl({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const isMobile = useAdminViewport();
  const [activeTab, setActiveTab] = useState<ActiveTab>("venues");
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [celebrities, setCelebrities] = useState<CelebrityRow[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [loadingCelebrities, setLoadingCelebrities] = useState(true);
  const [venueError, setVenueError] = useState<string | null>(null);
  const [celebrityError, setCelebrityError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<"name-asc" | "newest" | "reviews-desc">("name-asc");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedCelebrityId, setSelectedCelebrityId] = useState<string | null>(null);
  const [venueDetail, setVenueDetail] = useState<VenueDetail | null>(null);
  const [celebrityDetail, setCelebrityDetail] = useState<CelebrityDetail | null>(null);
  const [venueDraft, setVenueDraft] = useState<VenueDraft>(() => emptyVenueDraft());
  const [celebrityDraft, setCelebrityDraft] = useState<CelebrityDraft>(() => emptyCelebrityDraft());
  const [venueReviewDraft, setVenueReviewDraft] = useState<ReviewDraft>(() => emptyReviewDraft());
  const [celebrityReviewDraft, setCelebrityReviewDraft] = useState<ReviewDraft>(() => emptyReviewDraft());
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadVenuesList() {
      try {
        setLoadingVenues(true);
        setVenueError(null);
        const response = await getVenues({ all: true });
        if (controller.signal.aborted) return;
        setVenues(Array.isArray(response?.venues) ? response.venues : []);
      } catch (error) {
        if (controller.signal.aborted) return;
        setVenueError(error instanceof Error ? error.message : "Failed to load venues");
        setVenues([]);
      } finally {
        if (!controller.signal.aborted) setLoadingVenues(false);
      }
    }

    async function loadCelebritiesList() {
      try {
        setLoadingCelebrities(true);
        setCelebrityError(null);
        const response = await getCelebritiesAdmin(undefined, true);
        if (controller.signal.aborted) return;
        setCelebrities(Array.isArray(response?.celebrities) ? response.celebrities : []);
      } catch (error) {
        if (controller.signal.aborted) return;
        setCelebrityError(error instanceof Error ? error.message : "Failed to load celebrities");
        setCelebrities([]);
      } finally {
        if (!controller.signal.aborted) setLoadingCelebrities(false);
      }
    }

    void loadVenuesList();
    void loadCelebritiesList();
    return () => controller.abort();
  }, [refreshToken]);

  useEffect(() => {
    if (activeTab === "venues") {
      const selected = venues.find((venue) => venue.id === selectedVenueId) || null;
      if (selected) {
        setVenueDraft({
          name: selected.name || "",
          category: selected.category || "",
          description: selected.description || "",
          address: selected.address || "",
          country: (selected as any).country || "Nigeria",
          state: (selected as any).state || "Lagos",
          city: selected.city || "Lagos",
          latitude: selected.latitude == null ? "" : String(selected.latitude),
          longitude: selected.longitude == null ? "" : String(selected.longitude),
          photo_urls: Array.isArray(selected.photo_urls) ? selected.photo_urls.join(", ") : String(selected.photo_urls || ""),
          opening_hours: selected.opening_hours || "",
          price_range: selected.price_range || "",
          phone: selected.phone || "",
          website: selected.website || "",
          is_active: selected.is_active !== false && selected.is_active !== 0,
        });
      } else {
        setVenueDraft(emptyVenueDraft());
      }
    }
  }, [activeTab, selectedVenueId, venues]);

  useEffect(() => {
    if (activeTab === "celebrities") {
      const selected = celebrities.find((celebrity) => celebrity.id === selectedCelebrityId) || null;
      if (selected) {
        setCelebrityDraft({
          name: selected.name || "",
          category: selected.category || "",
          bio: selected.bio || "",
          photo_url: selected.photo_url || "",
          outing_types: Array.isArray(selected.outing_types) ? selected.outing_types.join(", ") : String(selected.outing_types || ""),
          base_price: selected.base_price == null ? "" : String(selected.base_price),
          currency: selected.currency || "NGN",
          is_active: selected.is_active !== false && selected.is_active !== 0,
        });
      } else {
        setCelebrityDraft(emptyCelebrityDraft());
      }
    }
  }, [activeTab, celebrities, selectedCelebrityId]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadVenueDetail() {
      if (activeTab !== "venues" || !selectedVenueId) {
        setVenueDetail(null);
        return;
      }

      try {
        const response = await getVenueById(selectedVenueId);
        if (controller.signal.aborted) return;
        setVenueDetail(response);
      } catch {
        if (controller.signal.aborted) return;
        setVenueDetail(null);
      }
    }

    void loadVenueDetail();
    return () => controller.abort();
  }, [activeTab, selectedVenueId, refreshToken]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCelebrityDetail() {
      if (activeTab !== "celebrities" || !selectedCelebrityId) {
        setCelebrityDetail(null);
        return;
      }

      try {
        const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}/api/celebrities/${selectedCelebrityId}`, { credentials: "include", signal: controller.signal });
        const payload = await response.json();
        if (controller.signal.aborted) return;
        const reviewsResponse = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}/api/celebrities/${selectedCelebrityId}/reviews`, { credentials: "include", signal: controller.signal });
        const reviewsPayload = await reviewsResponse.json();
        if (controller.signal.aborted) return;
        setCelebrityDetail({
          celebrity: payload?.celebrity,
          reviews: Array.isArray(reviewsPayload?.reviews) ? reviewsPayload.reviews : [],
          summary: reviewsPayload?.summary,
        });
      } catch {
        if (controller.signal.aborted) return;
        setCelebrityDetail(null);
      }
    }

    void loadCelebrityDetail();
    return () => controller.abort();
  }, [activeTab, selectedCelebrityId, refreshToken]);

  const filteredVenues = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = venues.filter((row) => !needle || [row.name, row.category, row.city, row.address].filter(Boolean).join(" ").toLowerCase().includes(needle));

    rows.sort((left, right) => {
      switch (sortMode) {
        case "reviews-desc":
          return (Number(right.review_count || 0) - Number(left.review_count || 0)) || left.name.localeCompare(right.name);
        case "newest":
          return new Date((right as any).created_at || 0).getTime() - new Date((left as any).created_at || 0).getTime();
        case "name-asc":
        default:
          return left.name.localeCompare(right.name);
      }
    });

    return rows;
  }, [search, sortMode, venues]);

  const filteredCelebrities = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = celebrities.filter((row) => !needle || [row.name, row.category, row.bio].filter(Boolean).join(" ").toLowerCase().includes(needle));

    rows.sort((left, right) => {
      switch (sortMode) {
        case "reviews-desc":
          return (Number(right.review_count || 0) - Number(left.review_count || 0)) || left.name.localeCompare(right.name);
        case "newest":
          return new Date((right as any).created_at || 0).getTime() - new Date((left as any).created_at || 0).getTime();
        case "name-asc":
        default:
          return left.name.localeCompare(right.name);
      }
    });

    return rows;
  }, [celebrities, search, sortMode]);

  const venueStats = useMemo(() => ({
    total: venues.length,
    active: venues.filter((venue) => venue.is_active !== false && venue.is_active !== 0).length,
    reviews: venues.reduce((sum, venue) => sum + Number(venue.review_count || 0), 0),
  }), [venues]);

  const celebrityStats = useMemo(() => ({
    total: celebrities.length,
    active: celebrities.filter((celebrity) => celebrity.is_active !== false && celebrity.is_active !== 0).length,
    bookings: celebrities.reduce((sum, celebrity) => sum + Number(celebrity.booking_count || 0), 0),
    reviews: celebrities.reduce((sum, celebrity) => sum + Number(celebrity.review_count || 0), 0),
  }), [celebrities]);

  const selectedVenueReviews = venueDetail?.reviews || [];
  const selectedCelebrityReviews = celebrityDetail?.reviews || [];

  const saveVenue = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      name: venueDraft.name.trim(),
      category: venueDraft.category.trim(),
      description: venueDraft.description.trim(),
      address: venueDraft.address.trim(),
      country: venueDraft.country.trim(),
      state: venueDraft.state.trim(),
      city: venueDraft.city.trim(),
      latitude: parseNumber(venueDraft.latitude),
      longitude: parseNumber(venueDraft.longitude),
      photo_urls: parsePhotoUrls(venueDraft.photo_urls),
      opening_hours: venueDraft.opening_hours.trim(),
      price_range: venueDraft.price_range.trim(),
      phone: venueDraft.phone.trim(),
      website: venueDraft.website.trim(),
      is_active: venueDraft.is_active,
    };

    try {
      setSavingKey("venue");
      if (selectedVenueId) {
        await updateVenue(selectedVenueId, payload);
        appendAdminActivity({
          category: "admin",
          title: "Venue updated",
          detail: `${payload.name || "A venue"} was updated.`,
        });
      } else {
        await createVenue(payload);
        appendAdminActivity({
          category: "admin",
          title: "Venue created",
          detail: `${payload.name || "A venue"} was created.`,
        });
      }
      setRefreshToken((current) => current + 1);
      setSelectedVenueId(null);
      setVenueDraft(emptyVenueDraft());
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save venue");
    } finally {
      setSavingKey(null);
    }
  };

  const saveCelebrity = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      name: celebrityDraft.name.trim(),
      category: celebrityDraft.category.trim(),
      bio: celebrityDraft.bio.trim(),
      photo_url: celebrityDraft.photo_url.trim(),
      outing_types: parseArrayField(celebrityDraft.outing_types),
      base_price: parseNumber(celebrityDraft.base_price),
      currency: celebrityDraft.currency.trim() || "NGN",
      is_active: celebrityDraft.is_active,
    };

    try {
      setSavingKey("celebrity");
      if (selectedCelebrityId) {
        await updateCelebrity(selectedCelebrityId, payload);
        appendAdminActivity({
          category: "admin",
          title: "Celebrity updated",
          detail: `${payload.name || "A celebrity"} was updated.`,
        });
      } else {
        await createCelebrity(payload);
        appendAdminActivity({
          category: "admin",
          title: "Celebrity created",
          detail: `${payload.name || "A celebrity"} was created.`,
        });
      }
      setRefreshToken((current) => current + 1);
      setSelectedCelebrityId(null);
      setCelebrityDraft(emptyCelebrityDraft());
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save celebrity");
    } finally {
      setSavingKey(null);
    }
  };

  const deleteSelectedVenue = async () => {
    if (!selectedVenueId) return;
    const selected = venues.find((venue) => venue.id === selectedVenueId);
    if (!window.confirm(`Delete ${selected?.name || "this venue"}? This cannot be undone.`)) return;

    try {
      setSavingKey(`venue-delete-${selectedVenueId}`);
      await deleteVenue(selectedVenueId);
      setRefreshToken((current) => current + 1);
      setSelectedVenueId(null);
      setVenueDetail(null);
      setVenueDraft(emptyVenueDraft());
      appendAdminActivity({
        category: "admin",
        title: "Venue deleted",
        detail: `${selected?.name || "A venue"} was deleted.`,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete venue");
    } finally {
      setSavingKey(null);
    }
  };

  const deleteSelectedCelebrity = async () => {
    if (!selectedCelebrityId) return;
    const selected = celebrities.find((celebrity) => celebrity.id === selectedCelebrityId);
    if (!window.confirm(`Delete ${selected?.name || "this celebrity"}? This cannot be undone.`)) return;

    try {
      setSavingKey(`celebrity-delete-${selectedCelebrityId}`);
      await deleteCelebrity(selectedCelebrityId);
      setRefreshToken((current) => current + 1);
      setSelectedCelebrityId(null);
      setCelebrityDetail(null);
      setCelebrityDraft(emptyCelebrityDraft());
      appendAdminActivity({
        category: "admin",
        title: "Celebrity deleted",
        detail: `${selected?.name || "A celebrity"} was deleted.`,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete celebrity");
    } finally {
      setSavingKey(null);
    }
  };

  const createVenueReviewAction = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedVenueId) return;

    try {
      setSavingKey("venue-review");
      await createVenueReview(selectedVenueId, {
        user_id: venueReviewDraft.user_id.trim(),
        rating: Number(venueReviewDraft.rating),
        review: venueReviewDraft.review.trim(),
      });
      setVenueReviewDraft(emptyReviewDraft());
      setRefreshToken((current) => current + 1);
      appendAdminActivity({
        category: "moderation",
        title: "Venue review added",
        detail: `A review was created for ${currentVenue?.name || "a venue"}.`,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create venue review");
    } finally {
      setSavingKey(null);
    }
  };

  const createCelebrityReviewAction = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCelebrityId) return;

    try {
      setSavingKey("celebrity-review");
      await createCelebrityReview(selectedCelebrityId, {
        user_id: celebrityReviewDraft.user_id.trim(),
        rating: Number(celebrityReviewDraft.rating),
        review: celebrityReviewDraft.review.trim(),
      });
      setCelebrityReviewDraft(emptyReviewDraft());
      setRefreshToken((current) => current + 1);
      appendAdminActivity({
        category: "moderation",
        title: "Celebrity review added",
        detail: `A review was created for ${currentCelebrity?.name || "a celebrity"}.`,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create celebrity review");
    } finally {
      setSavingKey(null);
    }
  };

  const deleteVenueReviewAction = async (reviewId: string) => {
    try {
      setSavingKey(`venue-review-delete-${reviewId}`);
      await deleteVenueReview(reviewId);
      setRefreshToken((current) => current + 1);
      appendAdminActivity({
        category: "moderation",
        title: "Venue review deleted",
        detail: "A venue review was removed.",
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete venue review");
    } finally {
      setSavingKey(null);
    }
  };

  const deleteCelebrityReviewAction = async (reviewId: string) => {
    try {
      setSavingKey(`celebrity-review-delete-${reviewId}`);
      await deleteCelebrityReview(reviewId);
      setRefreshToken((current) => current + 1);
      appendAdminActivity({
        category: "moderation",
        title: "Celebrity review deleted",
        detail: "A celebrity review was removed.",
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete celebrity review");
    } finally {
      setSavingKey(null);
    }
  };

  const currentStats = activeTab === "venues" ? venueStats : celebrityStats;
  const currentVenue = venueDetail?.venue || null;
  const currentCelebrity = celebrityDetail?.celebrity || null;

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: COLORS.bg, display: "flex", flexDirection: isMobile ? "column" : "row", color: COLORS.text, overflowX: "hidden" }}>
      <AdminSidebar activePage="admin-listings" onNavigate={onNavigate} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 12, padding: isMobile ? "12px 14px" : "14px 20px", borderBottom: `1px solid ${COLORS.cardBorder}`, background: COLORS.bg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => onNavigate?.("admin")}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `1px solid ${COLORS.cardBorder}`,
                background: "rgba(255,255,255,0.05)",
                color: COLORS.text,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ fontSize: 13, color: COLORS.muted, letterSpacing: "0.16em", textTransform: "uppercase" }}>Admin</div>
              <h1 style={{ margin: 0, fontSize: 26 }}>Venue and Celebrity Control</h1>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", width: isMobile ? "100%" : "auto" }}>
            <button
              onClick={() => setRefreshToken((current) => current + 1)}
              style={{
                border: `1px solid ${COLORS.cardBorder}`,
                background: "rgba(255,255,255,0.05)",
                color: COLORS.text,
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        <main style={{ flex: 1, minHeight: 0, padding: isMobile ? 12 : 20, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.55fr 0.95fr", gap: 14, overflow: "hidden auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 14 }}>
              {[
                { label: "Venues", value: venueStats.total, note: "Venue records in Lagos-first rollout", icon: Building2, tone: COLORS.amber },
                { label: "Venue reviews", value: venueStats.reviews, note: "Total venue ratings and comments", icon: Star, tone: COLORS.cyan },
                { label: "Celebrities", value: celebrityStats.total, note: "Celebrity booking inventory", icon: Users2, tone: COLORS.cyan },
                { label: "Celebrity bookings", value: celebrityStats.bookings, note: "Total bookings across stars", icon: CalendarDays, tone: COLORS.green },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>{card.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>{card.value.toLocaleString()}</div>
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: `${card.tone}22`, display: "grid", placeItems: "center", color: card.tone, fontSize: 14 }}>
                        <Icon size={14} />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.dimmer, marginTop: 8 }}>{card.note}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Venue and Celebrity Control</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Create, edit, review, and delete venue or celebrity records. Lagos is the default location now, and the form is ready for future state/country expansion.</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", width: isMobile ? "100%" : "auto" }}>
                  <div style={{ display: "inline-flex", gap: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 999, padding: 4 }}>
                    <button onClick={() => setActiveTab("venues")} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "8px 14px", background: activeTab === "venues" ? COLORS.accentGrad : "transparent", color: activeTab === "venues" ? "#fff" : COLORS.muted, fontWeight: 600 }}>
                      Venues
                    </button>
                    <button onClick={() => setActiveTab("celebrities")} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "8px 14px", background: activeTab === "celebrities" ? COLORS.accentGrad : "transparent", color: activeTab === "celebrities" ? "#fff" : COLORS.muted, fontWeight: 600 }}>
                      Celebrities
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: COLORS.muted }} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={`Search ${activeTab}`}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${COLORS.cardBorder}`,
                        borderRadius: 999,
                        padding: "9px 12px 9px 32px",
                        fontSize: 12,
                        color: COLORS.text,
                        minWidth: isMobile ? 0 : 220,
                        width: isMobile ? "100%" : "auto",
                        outline: "none",
                      }}
                    />
                  </div>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 999, border: `1px solid ${COLORS.cardBorder}`, background: "rgba(255,255,255,0.05)", color: COLORS.muted, fontSize: 12 }}>
                    <ArrowUpDown size={14} />
                    <span>Sort</span>
                    <select
                      value={sortMode}
                      onChange={(event) => setSortMode(event.target.value as typeof sortMode)}
                      style={{
                        background: "transparent",
                        color: COLORS.text,
                        border: "none",
                        outline: "none",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      <option value="name-asc">Name A-Z</option>
                      <option value="newest">Newest</option>
                      <option value="reviews-desc">Most reviews</option>
                    </select>
                  </label>
                </div>
              </div>

              {activeTab === "venues" ? (
                <div style={{ overflowX: "auto", overflowY: "auto", minHeight: 0, paddingRight: 4 }}>
                  <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        {["Venue", "Location", "Status", "Reviews", "Actions"].map((label) => (
                          <th key={label} style={{ textAlign: "left", color: COLORS.muted, fontWeight: 500, fontSize: 11, padding: "6px 8px", borderBottom: `1px solid ${COLORS.cardBorder}`, whiteSpace: "nowrap", position: "sticky", top: 0, background: COLORS.card, zIndex: 1 }}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingVenues ? (
                        <tr><td colSpan={5} style={{ padding: "18px 8px", color: COLORS.muted }}>Loading venues...</td></tr>
                      ) : venueError ? (
                        <tr><td colSpan={5} style={{ padding: "18px 8px", color: COLORS.rose }}>{venueError}</td></tr>
                      ) : filteredVenues.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: "18px 8px", color: COLORS.muted }}>No venues found.</td></tr>
                      ) : filteredVenues.map((venue) => (
                        <tr key={venue.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, background: selectedVenueId === venue.id ? "rgba(124,92,252,0.08)" : "transparent", cursor: "pointer" }} onClick={() => { setActiveTab("venues"); setSelectedVenueId(venue.id); setSelectedCelebrityId(null); }}>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.accentGrad, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{initials(venue.name)}</div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ color: COLORS.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{venue.name}</div>
                                <div style={{ color: COLORS.muted, fontSize: 11 }}>{venue.category}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ color: COLORS.text }}>{venue.city || "Lagos"}</span>
                              <span style={{ color: COLORS.muted, fontSize: 11 }}>{venue.address || "No address"}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <StatusPill label={venue.is_active === false || venue.is_active === 0 ? "Inactive" : "Active"} tone={venue.is_active === false || venue.is_active === 0 ? "danger" : "success"} />
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ color: COLORS.text }}>{Number(venue.review_count || 0)} reviews</span>
                              <span style={{ color: COLORS.muted, fontSize: 11 }}>Avg {formatRating(Number(venue.avg_rating || 0))}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button onClick={(event) => { event.stopPropagation(); setSelectedVenueId(venue.id); setActiveTab("venues"); }} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: "5px 10px", fontSize: 11, color: COLORS.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                                <Edit3 size={13} />
                                Edit
                              </button>
                              <button onClick={(event) => { event.stopPropagation(); void deleteVenueById(venue.id); }} style={{ background: "rgba(248,113,113,0.12)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: "5px 10px", fontSize: 11, color: COLORS.rose, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ overflowX: "auto", overflowY: "auto", minHeight: 0, paddingRight: 4 }}>
                  <table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        {["Celebrity", "Category", "Status", "Bookings", "Reviews", "Actions"].map((label) => (
                          <th key={label} style={{ textAlign: "left", color: COLORS.muted, fontWeight: 500, fontSize: 11, padding: "6px 8px", borderBottom: `1px solid ${COLORS.cardBorder}`, whiteSpace: "nowrap", position: "sticky", top: 0, background: COLORS.card, zIndex: 1 }}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingCelebrities ? (
                        <tr><td colSpan={6} style={{ padding: "18px 8px", color: COLORS.muted }}>Loading celebrities...</td></tr>
                      ) : celebrityError ? (
                        <tr><td colSpan={6} style={{ padding: "18px 8px", color: COLORS.rose }}>{celebrityError}</td></tr>
                      ) : filteredCelebrities.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: "18px 8px", color: COLORS.muted }}>No celebrities found.</td></tr>
                      ) : filteredCelebrities.map((celebrity) => (
                        <tr key={celebrity.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, background: selectedCelebrityId === celebrity.id ? "rgba(124,92,252,0.08)" : "transparent", cursor: "pointer" }} onClick={() => { setActiveTab("celebrities"); setSelectedCelebrityId(celebrity.id); setSelectedVenueId(null); }}>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.accentGrad, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{initials(celebrity.name)}</div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ color: COLORS.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{celebrity.name}</div>
                                <div style={{ color: COLORS.muted, fontSize: 11 }}>From {celebrity.currency || "NGN"} {Number(celebrity.base_price || 0).toLocaleString()}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px", color: COLORS.text }}>{celebrity.category}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <StatusPill label={celebrity.is_active === false || celebrity.is_active === 0 ? "Inactive" : "Active"} tone={celebrity.is_active === false || celebrity.is_active === 0 ? "danger" : "success"} />
                          </td>
                          <td style={{ padding: "10px 8px", color: COLORS.muted }}>{Number(celebrity.booking_count || 0)} bookings</td>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ color: COLORS.text }}>{Number(celebrity.review_count || 0)} reviews</span>
                              <span style={{ color: COLORS.muted, fontSize: 11 }}>Avg {formatRating(Number(celebrity.avg_rating || 0))}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button onClick={(event) => { event.stopPropagation(); setSelectedCelebrityId(celebrity.id); setActiveTab("celebrities"); }} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: "5px 10px", fontSize: 11, color: COLORS.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                                <Edit3 size={13} />
                                Edit
                              </button>
                              <button onClick={(event) => { event.stopPropagation(); void deleteCelebrityById(celebrity.id); }} style={{ background: "rgba(248,113,113,0.12)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: "5px 10px", fontSize: 11, color: COLORS.rose, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <aside style={{ minHeight: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {activeTab === "venues" ? (
              <>
                <DetailShell
                  title={selectedVenueId ? "Edit Venue" : "Create Venue"}
                  subtitle="Lagos-first now, with country/state fields staged for expansion."
                  icon={<Building2 size={18} />}
                >
                  <form onSubmit={saveVenue} style={{ display: "grid", gap: 10 }}>
                    <Field label="Name" value={venueDraft.name} onChange={(value) => setVenueDraft((current) => ({ ...current, name: value }))} placeholder="Silverbird Cinemas" />
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                      <Field label="Category" value={venueDraft.category} onChange={(value) => setVenueDraft((current) => ({ ...current, category: value }))} placeholder="Cinema" />
                      <Field label="Country" value={venueDraft.country} onChange={(value) => setVenueDraft((current) => ({ ...current, country: value }))} placeholder="Nigeria" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                      <Field label="State" value={venueDraft.state} onChange={(value) => setVenueDraft((current) => ({ ...current, state: value }))} placeholder="Lagos" />
                      <Field label="City" value={venueDraft.city} onChange={(value) => setVenueDraft((current) => ({ ...current, city: value }))} placeholder="Lagos" />
                    </div>
                    <Field label="Address" value={venueDraft.address} onChange={(value) => setVenueDraft((current) => ({ ...current, address: value }))} placeholder="Victoria Island, Lagos" />
                    <Field label="Description" value={venueDraft.description} onChange={(value) => setVenueDraft((current) => ({ ...current, description: value }))} placeholder="Describe the venue" textarea />
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                      <Field label="Latitude" value={venueDraft.latitude} onChange={(value) => setVenueDraft((current) => ({ ...current, latitude: value }))} placeholder="6.4281" />
                      <Field label="Longitude" value={venueDraft.longitude} onChange={(value) => setVenueDraft((current) => ({ ...current, longitude: value }))} placeholder="3.4219" />
                    </div>
                    <Field label="Photo URLs" value={venueDraft.photo_urls} onChange={(value) => setVenueDraft((current) => ({ ...current, photo_urls: value }))} placeholder="https://..., https://..." />
                    <Field label="Opening hours" value={venueDraft.opening_hours} onChange={(value) => setVenueDraft((current) => ({ ...current, opening_hours: value }))} placeholder="10am - 11pm daily" />
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                      <Field label="Price range" value={venueDraft.price_range} onChange={(value) => setVenueDraft((current) => ({ ...current, price_range: value }))} placeholder="₦2,000 - ₦5,000" />
                      <Field label="Phone" value={venueDraft.phone} onChange={(value) => setVenueDraft((current) => ({ ...current, phone: value }))} placeholder="+234..." />
                    </div>
                    <Field label="Website" value={venueDraft.website} onChange={(value) => setVenueDraft((current) => ({ ...current, website: value }))} placeholder="https://..." />
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 12 }}>
                      <input type="checkbox" checked={venueDraft.is_active} onChange={(event) => setVenueDraft((current) => ({ ...current, is_active: event.target.checked }))} />
                      Active state
                    </label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="submit" disabled={savingKey === "venue"} style={{ border: "none", borderRadius: 12, padding: "12px 14px", background: "linear-gradient(135deg,#7c5cfc,#5b8af5)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <Plus size={16} />
                        {selectedVenueId ? "Save Venue" : "Create Venue"}
                      </button>
                      <button type="button" onClick={() => { setSelectedVenueId(null); setVenueDraft(emptyVenueDraft()); }} style={{ border: `1px solid ${COLORS.cardBorder}`, background: "rgba(255,255,255,0.05)", color: COLORS.text, borderRadius: 12, padding: "12px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                        New
                      </button>
                      {selectedVenueId && (
                        <button type="button" onClick={deleteSelectedVenue} disabled={savingKey?.startsWith("venue-delete")} style={{ border: `1px solid ${COLORS.cardBorder}`, background: "rgba(248,113,113,0.12)", color: COLORS.rose, borderRadius: 12, padding: "12px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <Trash2 size={16} />
                          Delete
                        </button>
                      )}
                    </div>
                  </form>
                </DetailShell>

                <DetailShell
                  title={currentVenue ? currentVenue.name : "Venue Reviews"}
                  subtitle="Review records and moderation notes."
                  icon={<Star size={18} />}
                >
                  {currentVenue ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                        <MiniStat label="Reviews" value={String(venueDetail?.rating?.total || currentVenue.review_count || 0)} />
                        <MiniStat label="Average" value={formatRating(venueDetail?.rating?.average || Number(currentVenue.avg_rating || 0))} />
                      </div>
                      <form onSubmit={createVenueReviewAction} style={{ display: "grid", gap: 10 }}>
                        <Field label="Reviewer user ID" value={venueReviewDraft.user_id} onChange={(value) => setVenueReviewDraft((current) => ({ ...current, user_id: value }))} placeholder="user id" />
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                          <Field label="Rating" value={venueReviewDraft.rating} onChange={(value) => setVenueReviewDraft((current) => ({ ...current, rating: value }))} placeholder="5" />
                          <Field label="Review" value={venueReviewDraft.review} onChange={(value) => setVenueReviewDraft((current) => ({ ...current, review: value }))} placeholder="Leave a review" />
                        </div>
                        <button type="submit" disabled={savingKey === "venue-review"} style={{ border: "none", borderRadius: 12, padding: "12px 14px", background: "rgba(34,211,238,0.14)", color: COLORS.cyan, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                          Add Venue Review
                        </button>
                      </form>
                      <div style={{ display: "grid", gap: 8, maxHeight: 240, overflowY: "auto", paddingRight: 4 }}>
                        {selectedVenueReviews.length === 0 ? (
                          <div style={{ color: COLORS.muted, fontSize: 12 }}>No reviews yet.</div>
                        ) : selectedVenueReviews.map((review) => (
                          <div key={review.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 14, padding: 12, display: "grid", gap: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{review.reviewer_name || review.user_id || "Unknown reviewer"}</div>
                                <div style={{ fontSize: 10, color: COLORS.muted }}>{formatDate(review.created_at)}</div>
                              </div>
                              <StatusPill label={`${review.rating}/5`} tone={review.rating >= 4 ? "success" : review.rating >= 3 ? "warning" : "danger"} />
                            </div>
                            <div style={{ fontSize: 12, color: COLORS.muted }}>{review.review || "No written review."}</div>
                            <button onClick={() => void deleteVenueReviewAction(review.id)} style={{ justifySelf: "start", border: `1px solid ${COLORS.cardBorder}`, background: "rgba(248,113,113,0.12)", color: COLORS.rose, borderRadius: 8, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}>
                              Delete review
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: COLORS.muted, fontSize: 12 }}>Select a venue to review activity.</div>
                  )}
                </DetailShell>
              </>
            ) : (
              <>
                <DetailShell
                  title={selectedCelebrityId ? "Edit Celebrity" : "Create Celebrity"}
                  subtitle="Manage booking-ready celebrity listings."
                  icon={<Users2 size={18} />}
                >
                  <form onSubmit={saveCelebrity} style={{ display: "grid", gap: 10 }}>
                    <Field label="Name" value={celebrityDraft.name} onChange={(value) => setCelebrityDraft((current) => ({ ...current, name: value }))} placeholder="Teni" />
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                      <Field label="Category" value={celebrityDraft.category} onChange={(value) => setCelebrityDraft((current) => ({ ...current, category: value }))} placeholder="Music" />
                      <Field label="Currency" value={celebrityDraft.currency} onChange={(value) => setCelebrityDraft((current) => ({ ...current, currency: value }))} placeholder="NGN" />
                    </div>
                    <Field label="Bio" value={celebrityDraft.bio} onChange={(value) => setCelebrityDraft((current) => ({ ...current, bio: value }))} placeholder="Short bio" textarea />
                    <Field label="Photo URL" value={celebrityDraft.photo_url} onChange={(value) => setCelebrityDraft((current) => ({ ...current, photo_url: value }))} placeholder="https://..." />
                    <Field label="Outing types" value={celebrityDraft.outing_types} onChange={(value) => setCelebrityDraft((current) => ({ ...current, outing_types: value }))} placeholder="Dinner, Hangout, Event" />
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                      <Field label="Base price" value={celebrityDraft.base_price} onChange={(value) => setCelebrityDraft((current) => ({ ...current, base_price: value }))} placeholder="500000" />
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 12, alignSelf: "end" }}>
                        <input type="checkbox" checked={celebrityDraft.is_active} onChange={(event) => setCelebrityDraft((current) => ({ ...current, is_active: event.target.checked }))} />
                        Active state
                      </label>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="submit" disabled={savingKey === "celebrity"} style={{ border: "none", borderRadius: 12, padding: "12px 14px", background: "linear-gradient(135deg,#7c5cfc,#5b8af5)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <Plus size={16} />
                        {selectedCelebrityId ? "Save Celebrity" : "Create Celebrity"}
                      </button>
                      <button type="button" onClick={() => { setSelectedCelebrityId(null); setCelebrityDraft(emptyCelebrityDraft()); }} style={{ border: `1px solid ${COLORS.cardBorder}`, background: "rgba(255,255,255,0.05)", color: COLORS.text, borderRadius: 12, padding: "12px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                        New
                      </button>
                      {selectedCelebrityId && (
                        <button type="button" onClick={deleteSelectedCelebrity} disabled={savingKey?.startsWith("celebrity-delete")} style={{ border: `1px solid ${COLORS.cardBorder}`, background: "rgba(248,113,113,0.12)", color: COLORS.rose, borderRadius: 12, padding: "12px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <Trash2 size={16} />
                          Delete
                        </button>
                      )}
                    </div>
                  </form>
                </DetailShell>

                <DetailShell
                  title={currentCelebrity ? currentCelebrity.name : "Celebrity Reviews"}
                  subtitle="View booking and rating history, then add review notes."
                  icon={<Star size={18} />}
                >
                  {currentCelebrity ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                        <MiniStat label="Bookings" value={String(currentCelebrity.booking_count || 0)} />
                        <MiniStat label="Reviews" value={String(celebrityDetail?.summary?.total_reviews || currentCelebrity.review_count || 0)} />
                      </div>
                      <form onSubmit={createCelebrityReviewAction} style={{ display: "grid", gap: 10 }}>
                        <Field label="Reviewer user ID" value={celebrityReviewDraft.user_id} onChange={(value) => setCelebrityReviewDraft((current) => ({ ...current, user_id: value }))} placeholder="user id" />
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                          <Field label="Rating" value={celebrityReviewDraft.rating} onChange={(value) => setCelebrityReviewDraft((current) => ({ ...current, rating: value }))} placeholder="5" />
                          <Field label="Review" value={celebrityReviewDraft.review} onChange={(value) => setCelebrityReviewDraft((current) => ({ ...current, review: value }))} placeholder="Leave a review" />
                        </div>
                        <button type="submit" disabled={savingKey === "celebrity-review"} style={{ border: "none", borderRadius: 12, padding: "12px 14px", background: "rgba(34,211,238,0.14)", color: COLORS.cyan, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                          Add Celebrity Review
                        </button>
                      </form>
                      <div style={{ display: "grid", gap: 8, maxHeight: 240, overflowY: "auto", paddingRight: 4 }}>
                        {selectedCelebrityReviews.length === 0 ? (
                          <div style={{ color: COLORS.muted, fontSize: 12 }}>No reviews yet.</div>
                        ) : selectedCelebrityReviews.map((review) => (
                          <div key={review.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 14, padding: 12, display: "grid", gap: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{review.reviewer_name || review.user_id || "Unknown reviewer"}</div>
                                <div style={{ fontSize: 10, color: COLORS.muted }}>{formatDate(review.created_at)}</div>
                              </div>
                              <StatusPill label={`${review.rating}/5`} tone={review.rating >= 4 ? "success" : review.rating >= 3 ? "warning" : "danger"} />
                            </div>
                            <div style={{ fontSize: 12, color: COLORS.muted }}>{review.review || "No written review."}</div>
                            <button onClick={() => void deleteCelebrityReviewAction(review.id)} style={{ justifySelf: "start", border: `1px solid ${COLORS.cardBorder}`, background: "rgba(248,113,113,0.12)", color: COLORS.rose, borderRadius: 8, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}>
                              Delete review
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: COLORS.muted, fontSize: 12 }}>Select a celebrity to review activity.</div>
                  )}
                </DetailShell>
              </>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, color: COLORS.muted }}>{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{
            width: "100%",
            resize: "vertical",
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 12,
            padding: "12px 14px",
            color: COLORS.text,
            outline: "none",
            fontSize: 13,
          }}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 12,
            padding: "12px 14px",
            color: COLORS.text,
            outline: "none",
            fontSize: 13,
          }}
        />
      )}
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 14, padding: 12 }}>
      <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default VenueCelebrityControl;
