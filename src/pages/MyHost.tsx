import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import * as API from "../services/api";

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 800;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

function StatCard({ value, label, color, delay, suffix = "", isLightMode = false }: { value: number; label: string; color: string; delay: number; suffix?: string; isLightMode?: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      background: isLightMode ? "#fffaf2" : "#0a0a0a",
      border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
      borderRadius: 16,
      padding: "20px 16px",
      textAlign: "center",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
    }}>
      <div style={{
        fontSize: 32,
        fontWeight: 800,
        color: color,
        letterSpacing: -1,
        lineHeight: 1,
        marginBottom: 6,
        fontFamily: "'Georgia', serif",
      }}>
        {visible ? <AnimatedNumber value={value} suffix={suffix} /> : "0"}
      </div>
      <div style={{ fontSize: 11, color: isLightMode ? "#7a674f" : "#444", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

function ApplicantCard({ applicant, index, onAccept, onReject, isLightMode = false }: { applicant: any; index: number; onAccept: (id: string) => void; onReject: (id: string) => void; isLightMode?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [action, setAction] = useState<"accept" | "reject" | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100 + index * 80);
    return () => clearTimeout(t);
  }, [index]);

  const handleAccept = () => {
    setAction("accept");
    setTimeout(() => onAccept(applicant.id), 400);
  };
  const handleReject = () => {
    setAction("reject");
    setTimeout(() => onReject(applicant.id), 400);
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "14px 16px",
      background: action === "accept" ? "rgba(246,157,17,0.08)" : action === "reject" ? "rgba(255,60,60,0.05)" : isLightMode ? "#fffaf2" : "#0d0d0d",
      border: action === "accept" ? "1px solid rgba(246,157,17,0.3)" : action === "reject" ? "1px solid rgba(255,60,60,0.2)" : isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
      borderRadius: 12,
      opacity: action ? 0.5 : visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(-16px)",
      transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
    }}>
      <div style={{
        width: 40,
        height: 40,
        background: "#F69D11",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 800,
        color: "#000",
        flexShrink: 0,
      }}>
        {applicant.name[0]}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: isLightMode ? "#241b10" : "#fff" }}>{applicant.name}</span>
          {applicant.isVerified && (
            <span style={{
              fontSize: 10,
              background: "rgba(246,157,17,0.15)",
              color: "#F69D11",
              padding: "2px 6px",
              borderRadius: 4,
              fontWeight: 700,
              letterSpacing: 0.5,
            }}>✓ ID</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{
            fontSize: 11,
            color: applicant.reliabilityScore > 90 ? "#4ade80" : "#F69D11",
            background: applicant.reliabilityScore > 90 ? "rgba(74,222,128,0.1)" : "rgba(246,157,17,0.1)",
            padding: "2px 7px",
            borderRadius: 4,
            fontWeight: 700,
          }}>{applicant.reliabilityScore}% reliable</span>
          <span style={{ fontSize: 11, color: isLightMode ? "#7a674f" : "#444" }}>{applicant.mutualInterests} shared</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={handleAccept}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "1px solid rgba(74,222,128,0.3)",
            background: "rgba(74,222,128,0.1)",
            color: "#4ade80",
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            fontWeight: 700,
          } as React.CSSProperties}
          onMouseEnter={e => { (e.currentTarget as any).style.background = "rgba(74,222,128,0.2)"; (e.currentTarget as any).style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { (e.currentTarget as any).style.background = "rgba(74,222,128,0.1)"; (e.currentTarget as any).style.transform = "scale(1)"; }}
        >✓</button>
        <button
          onClick={handleReject}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "1px solid rgba(255,80,80,0.3)",
            background: "rgba(255,80,80,0.1)",
            color: "#f87171",
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            fontWeight: 700,
          } as React.CSSProperties}
          onMouseEnter={e => { (e.currentTarget as any).style.background = "rgba(255,80,80,0.2)"; (e.currentTarget as any).style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { (e.currentTarget as any).style.background = "rgba(255,80,80,0.1)"; (e.currentTarget as any).style.transform = "scale(1)"; }}
        >✕</button>
      </div>
    </div>
  );
}

function EventCard({ event, index, onAccept, onReject, isLightMode = false }: { event: any; index: number; onAccept: (id: string) => void; onReject: (id: string) => void; isLightMode?: boolean }) {
  const [visible, setVisible] = useState(false);
  const filled = (event.joined / event.capacity) * 100;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80 * index);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div style={{
      background: isLightMode ? "#fffaf2" : "#0a0a0a",
      border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1c1c1c",
      borderRadius: 20,
      overflow: "hidden",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
    }}>
      <div style={{ height: 3, background: "#F69D11", width: `${filled}%`, transition: "width 1s ease 0.6s" }} />

      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: isLightMode ? "#241b10" : "#fff", letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 6 }}>
              {event.title}
            </h3>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: isLightMode ? "#7a674f" : "#555" }}>
              <span>📅 {event.date} · {event.time}</span>
              <span>📍 {event.location}</span>
            </div>
          </div>
          {event.applications > 0 && (
            <div style={{
              background: "rgba(246,157,17,0.1)",
              border: "1px solid rgba(246,157,17,0.3)",
              borderRadius: 8,
              padding: "6px 10px",
              textAlign: "center",
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#F69D11", lineHeight: 1 }}>{event.applications}</div>
              <div style={{ fontSize: 9, color: isLightMode ? "#8d7758" : "#888", textTransform: "uppercase", letterSpacing: 1 }}>pending</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: isLightMode ? "#7a674f" : "#555", marginBottom: 6 }}>
            <span>{event.joined} joined</span>
            <span>{event.capacity} spots</span>
          </div>
          <div style={{ height: 4, background: isLightMode ? "rgba(36,27,16,0.08)" : "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${filled}%`,
              background: "#F69D11",
              borderRadius: 2,
              transition: "width 1s ease 0.3s",
            }} />
          </div>
        </div>

        {event.applicants.filter((a: any) => a.status === "pending").length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#F69D11", marginBottom: 10 }}>
              Awaiting Review
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {event.applicants.filter((a: any) => a.status === "pending").map((a: any, i: number) => (
                <ApplicantCard key={a.id} applicant={a} index={i} onAccept={onAccept} onReject={onReject} isLightMode={isLightMode} />
              ))}
            </div>
          </div>
        )}

        {event.applicants.filter((a: any) => a.status === "accepted").length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#4ade80", marginBottom: 8 }}>
              Confirmed
            </div>
            {event.applicants.filter((a: any) => a.status === "accepted").map((a: any) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: isLightMode ? "#7a674f" : "#aaa", padding: "4px 0" }}>
                <span style={{ color: "#4ade80", fontSize: 12 }}>●</span>
                {a.name}
                <span style={{ marginLeft: "auto", fontSize: 11, color: isLightMode ? "#8d7758" : "#333" }}>Not checked in</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PastEventCard({ event, index, isLightMode = false }: { event: any; index: number; isLightMode?: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80 * index);
    return () => clearTimeout(t);
  }, [index]);

  const stars = Math.round(event.rating);
  return (
    <div style={{
      background: isLightMode ? "#fffaf2" : "#0a0a0a",
      border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1c1c1c",
      borderRadius: 16,
      padding: 20,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: isLightMode ? "#241b10" : "#fff" }}>{event.title}</h3>
          <div style={{ fontSize: 12, color: isLightMode ? "#7a674f" : "#555" }}>{event.date} · {event.attendees} attended</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, marginBottom: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ color: i < stars ? "#F69D11" : (isLightMode ? "#e1d3bf" : "#2a2a2a") }}>★</span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: isLightMode ? "#7a674f" : "#555" }}>{event.rating} · {event.reviews} reviews</div>
        </div>
      </div>
    </div>
  );
}

interface MyHostProps {
  isLightMode?: boolean;
  openCreateModal?: boolean;
}

function CreateEventModal({
  isOpen,
  onClose,
  onSubmit,
  isLightMode = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: any) => Promise<void>;
  isLightMode?: boolean;
}) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    capacity: 4,
    description: "",
    imageFile: null as File | null,
    imagePreview: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: "Image must be less than 5MB" }));
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: event.target?.result as string,
        }));
        setErrors((prev) => ({ ...prev, image: "" }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Event title is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (formData.capacity < 1) newErrors.capacity = "Capacity must be at least 1";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      await onSubmit({
        ...formData,
        id: String(Date.now()),
        joined: 0,
        applications: 0,
        applicants: [],
      });
      setFormData({
        title: "",
        date: "",
        time: "",
        location: "",
        capacity: 4,
        description: "",
        imageFile: null,
        imagePreview: "",
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: isLightMode ? "rgba(247,243,234,0.72)" : "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: isLightMode ? "#fffaf2" : "#0a0a0a",
          border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
          borderRadius: 20,
          width: "90%",
          maxWidth: 500,
          maxHeight: "90vh",
          overflow: "auto",
          padding: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: isLightMode ? "#241b10" : "#fff",
              letterSpacing: -0.5,
            }}
          >
            Create Event
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              color: isLightMode ? "#7a674f" : "#555",
              cursor: "pointer",
              padding: 0,
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Image Upload */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: isLightMode ? "#7a674f" : "#999",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
                display: "block",
              }}
            >
              Event Image
            </label>
            {formData.imagePreview ? (
              <div style={{ position: "relative", marginBottom: 12 }}>
                <img
                  src={formData.imagePreview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                    borderRadius: 12,
                    border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
                  }}
                />
                <button
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      imageFile: null,
                      imagePreview: "",
                    }))
                  }
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "rgba(0,0,0,0.7)",
                    border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
                    color: isLightMode ? "#241b10" : "#fff",
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 32,
                  border: isLightMode ? "2px dashed rgba(36,27,16,0.18)" : "2px dashed #1a1a1a",
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  background: isLightMode ? "#fffaf2" : "#050505",
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  (e.currentTarget as any).style.borderColor = "#F69D11";
                  (e.currentTarget as any).style.background = "rgba(246,157,17,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as any).style.borderColor = isLightMode ? "rgba(36,27,16,0.18)" : "#1a1a1a";
                  (e.currentTarget as any).style.background = isLightMode ? "#fffaf2" : "#050505";
                }}
              >
                <span style={{ fontSize: 32, marginBottom: 8 }}>📸</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isLightMode ? "#7a674f" : "#aaa",
                    textAlign: "center",
                  }}
                >
                  Click to upload event image
                </span>
                <span style={{ fontSize: 11, color: isLightMode ? "#8d7758" : "#555", marginTop: 4 }}>
                  PNG, JPG up to 5MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </label>
            )}
            {errors.image && (
              <div style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>
                {errors.image}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
                display: "block",
              }}
            >
              Event Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Beach Volleyball at Lekki"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "10px 14px",
                background: isLightMode ? "#fffaf2" : "#050505",
                border: `1px solid ${errors.title ? "#f87171" : (isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a")}`,
                borderRadius: 10,
                color: isLightMode ? "#241b10" : "#fff",
                fontSize: 14,
                outline: "none",
                transition: "all 0.2s ease",
              } as React.CSSProperties}
              onFocus={(e) => {
                (e.currentTarget as any).style.borderColor = "#F69D11";
              }}
              onBlur={(e) => {
                (e.currentTarget as any).style.borderColor = errors.title
                  ? "#f87171"
                  : (isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a");
              }}
            />
            {errors.title && (
              <div style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>
                {errors.title}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
                display: "block",
              }}
            >
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "10px 14px",
                background: isLightMode ? "#fffaf2" : "#050505",
                border: `1px solid ${errors.date ? "#f87171" : (isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a")}`,
                borderRadius: 10,
                color: isLightMode ? "#241b10" : "#fff",
                fontSize: 14,
                outline: "none",
                transition: "all 0.2s ease",
              } as React.CSSProperties}
              onFocus={(e) => {
                (e.currentTarget as any).style.borderColor = "#F69D11";
              }}
              onBlur={(e) => {
                (e.currentTarget as any).style.borderColor = errors.date
                  ? "#f87171"
                  : (isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a");
              }}
            />
            {errors.date && (
              <div style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>
                {errors.date}
              </div>
            )}
          </div>

          {/* Time */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
                display: "block",
              }}
            >
              Time *
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, time: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "10px 14px",
                background: isLightMode ? "#fffaf2" : "#050505",
                border: `1px solid ${errors.time ? "#f87171" : (isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a")}`,
                borderRadius: 10,
                color: isLightMode ? "#241b10" : "#fff",
                fontSize: 14,
                outline: "none",
                transition: "all 0.2s ease",
              } as React.CSSProperties}
              onFocus={(e) => {
                (e.currentTarget as any).style.borderColor = "#F69D11";
              }}
              onBlur={(e) => {
                (e.currentTarget as any).style.borderColor = errors.time
                  ? "#f87171"
                  : (isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a");
              }}
            />
            {errors.time && (
              <div style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>
                {errors.time}
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
                display: "block",
              }}
            >
              Location *
            </label>
            <input
              type="text"
              placeholder="e.g., Lekki Beach"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "10px 14px",
                background: isLightMode ? "#fffaf2" : "#050505",
                border: `1px solid ${errors.location ? "#f87171" : (isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a")}`,
                borderRadius: 10,
                color: isLightMode ? "#241b10" : "#fff",
                fontSize: 14,
                outline: "none",
                transition: "all 0.2s ease",
              } as React.CSSProperties}
              onFocus={(e) => {
                (e.currentTarget as any).style.borderColor = "#F69D11";
              }}
              onBlur={(e) => {
                (e.currentTarget as any).style.borderColor = errors.location
                  ? "#f87171"
                  : (isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a");
              }}
            />
            {errors.location && (
              <div style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>
                {errors.location}
              </div>
            )}
          </div>

          {/* Capacity */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
                display: "block",
              }}
            >
              Capacity *
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.capacity}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  capacity: Math.max(1, parseInt(e.target.value) || 1),
                }))
              }
              style={{
                width: "100%",
                padding: "10px 14px",
                background: isLightMode ? "#fffaf2" : "#050505",
                border: `1px solid ${errors.capacity ? "#f87171" : (isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a")}`,
                borderRadius: 10,
                color: isLightMode ? "#241b10" : "#fff",
                fontSize: 14,
                outline: "none",
                transition: "all 0.2s ease",
              } as React.CSSProperties}
              onFocus={(e) => {
                (e.currentTarget as any).style.borderColor = "#F69D11";
              }}
              onBlur={(e) => {
                (e.currentTarget as any).style.borderColor = errors.capacity
                  ? "#f87171"
                  : (isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a");
              }}
            />
            {errors.capacity && (
              <div style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>
                {errors.capacity}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
                display: "block",
              }}
            >
              Description
            </label>
            <textarea
              placeholder="Tell people about your event..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              style={{
                width: "100%",
                padding: "10px 14px",
                background: isLightMode ? "#fffaf2" : "#050505",
                border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
                borderRadius: 10,
                color: isLightMode ? "#241b10" : "#fff",
                fontSize: 14,
                outline: "none",
                transition: "all 0.2s ease",
                resize: "vertical",
                minHeight: 80,
                fontFamily: "inherit",
              } as React.CSSProperties}
              onFocus={(e) => {
                (e.currentTarget as any).style.borderColor = "#F69D11";
              }}
              onBlur={(e) => {
                (e.currentTarget as any).style.borderColor = isLightMode ? "rgba(36,27,16,0.1)" : "#1a1a1a";
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px 16px",
                background: isLightMode ? "#f3eadc" : "#1a1a1a",
                border: "none",
                borderRadius: 10,
                color: isLightMode ? "#241b10" : "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                (e.currentTarget as any).style.background = "#2a2a2a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as any).style.background = isLightMode ? "#f3eadc" : "#1a1a1a";
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: "11px 16px",
                background: "#F69D11",
                border: "none",
                borderRadius: 10,
                color: "#000",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.15s ease",
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                (e.currentTarget as any).style.background = "#ffd700";
                (e.currentTarget as any).style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as any).style.background = "#F69D11";
                (e.currentTarget as any).style.transform = "scale(1)";
              }}
            >
              Create Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const MyHost: React.FC<MyHostProps> = ({ isLightMode = false, openCreateModal: initialOpenModal = false }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [headerVisible, setHeaderVisible] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(initialOpenModal);
  const [events, setEvents] = useState([
    {
      id: "1",
      title: "Beach Volleyball at Lekki",
      date: "2026-05-25",
      time: "4:00 PM",
      location: "Lekki Beach",
      capacity: 4,
      joined: 2,
      applications: 3,
      applicants: [
        { id: "a1", name: "Amara T.", reliabilityScore: 94, isVerified: true, status: "pending", mutualInterests: 2 },
        { id: "a2", name: "Chioma O.", reliabilityScore: 87, isVerified: true, status: "pending", mutualInterests: 1 },
        { id: "a3", name: "Zainab M.", reliabilityScore: 92, isVerified: false, status: "accepted", mutualInterests: 3 },
      ],
    },
  ]);

  const pastEvents = [
    { id: "2", title: "Movie Night at Imax", date: "2026-05-10", attendees: 3, rating: 4.8, reviews: 3 },
  ];

  useEffect(() => {
    const t = setTimeout(() => setHeaderVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleAccept = (applicantId: string) => {
    setEvents(prev => prev.map(e => ({
      ...e,
      applicants: e.applicants.map(a =>
        a.id === applicantId ? { ...a, status: "accepted" } : a
      ),
      applications: e.applications - 1,
      joined: e.joined + 1,
    })));
  };

  const handleReject = (applicantId: string) => {
    setEvents(prev => prev.map(e => ({
      ...e,
      applicants: e.applicants.filter(a => a.id !== applicantId),
      applications: e.applications - 1,
    })));
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      // Get current user from localStorage
      const userId = localStorage.getItem('userId');
      if (!userId) {
        addToast('Please log in to create events', 'error');
        return;
      }

      // Prepare event data for backend API
      const eventPayload = {
        title: eventData.title,
        description: eventData.description,
        location_city: eventData.location,
        event_date: eventData.date, // Format: YYYY-MM-DD
        event_time: eventData.time, // Format: HH:MM
        max_guests: eventData.capacity,
        host_id: userId,
        billing_tier: 1, // Default tier
        host_fee: 0, // Can be updated later
        guest_fee: 0, // Can be updated later
      };

      // Send to backend API
      const response = await API.createEvent(eventPayload);
      
      // Add the new event to local state
      const newEventWithId = {
        ...eventData,
        id: response.event.id,
      };
      
      setEvents(prev => [newEventWithId, ...prev]);
      
      // Show success message
      addToast(`Event "${eventData.title}" created successfully!`, 'success');
    } catch (error) {
      console.error('Error creating event:', error);
      addToast('Failed to create event. Please try again.', 'error');
    }
  };

  const tabs = [
    { id: "active", label: "Active" },
    { id: "past", label: "Past" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: isLightMode ? "#f7f3ea" : "#050505",
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
    }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${isLightMode ? '#f3eadc' : '#0a0a0a'}; }
        ::-webkit-scrollbar-thumb { background: ${isLightMode ? '#d8c7ab' : '#1c1c1c'}; border-radius: 2px; }
      `}</style>

      <main className="mobile-page-main" style={{ flex: 1, marginLeft: 0, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", background: isLightMode ? "#f7f3ea" : "#050505" }}>
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: isLightMode ? "rgba(247,243,234,0.92)" : "rgba(5,5,5,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #111",
          padding: "16px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? "translateY(0)" : "translateY(-8px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
          width: "100%",
          maxWidth: 720,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#F69D11", marginBottom: 2 }}>
              Dashboard
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: isLightMode ? "#241b10" : "#fff", letterSpacing: -0.5 }}>
              Host Studio
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => navigate('/hosting')}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                color: "#F69D11",
                border: "1px solid #F69D11",
                borderRadius: 12,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: 0.3,
                transition: "all 0.15s ease",
              } as React.CSSProperties}
              onMouseEnter={e => { (e.currentTarget as any).style.background = "rgba(246, 157, 17, 0.1)"; (e.currentTarget as any).style.transform = "scale(1.03)"; }}
              onMouseLeave={e => { (e.currentTarget as any).style.background = "transparent"; (e.currentTarget as any).style.transform = "scale(1)"; }}
            >
              Dashboard →
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#F69D11",
                color: "#000",
                border: "none",
                borderRadius: 12,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: 0.3,
                transition: "all 0.15s ease",
              } as React.CSSProperties}
              onMouseEnter={e => { (e.currentTarget as any).style.background = "#ffd700"; (e.currentTarget as any).style.transform = "scale(1.03)"; }}
              onMouseLeave={e => { (e.currentTarget as any).style.background = "#F69D11"; (e.currentTarget as any).style.transform = "scale(1)"; }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
              Create Event
            </button>
          </div>
        </div>

        <div style={{ padding: "24px 28px", maxWidth: 720, width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
            <StatCard value={events.length} label="Active Events" color="#F69D11" delay={100} suffix="" isLightMode={isLightMode} />
            <StatCard value={events.reduce((s: number, e: any) => s + e.applications, 0)} label="Applications" color={isLightMode ? "#241b10" : "#fff"} delay={180} suffix="" isLightMode={isLightMode} />
            <StatCard value={12} label="Total Hosted" color={isLightMode ? "#7a674f" : "#555"} delay={260} suffix="" isLightMode={isLightMode} />
          </div>

          <div style={{
            display: "flex",
            gap: 4,
            marginBottom: 20,
            background: isLightMode ? "#fffaf2" : "#0a0a0a",
            border: isLightMode ? "1px solid rgba(36,27,16,0.1)" : "1px solid #1a1a1a",
            borderRadius: 12,
            padding: 4,
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 9,
                  border: "none",
                  background: activeTab === tab.id ? "#F69D11" : "transparent",
                  color: activeTab === tab.id ? "#000" : (isLightMode ? "#7a674f" : "#555"),
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 800 : 500,
                  cursor: "pointer",
                  letterSpacing: 0.2,
                  transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                } as React.CSSProperties}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {activeTab === "active" && events.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                index={i}
                onAccept={handleAccept}
                onReject={handleReject}
                isLightMode={isLightMode}
              />
            ))}

            {activeTab === "past" && pastEvents.map((event, i) => (
              <PastEventCard key={event.id} event={event} index={i} isLightMode={isLightMode} />
            ))}

            {activeTab === "cancelled" && (
              <div style={{
                padding: "60px 0",
                textAlign: "center",
                color: isLightMode ? "#8d7758" : "#2a2a2a",
                fontSize: 14,
                letterSpacing: 0.5,
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
                No cancelled events
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateEvent}
        isLightMode={isLightMode}
      />
    </div>
  );
};

export default MyHost;
