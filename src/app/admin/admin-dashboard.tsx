"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  RefreshCw,
  Settings,
  Sprout,
  Users,
  UsersRound,
  X,
  Plus,
  Pencil,
  Trash2,
  Send,
  Filter,
} from "lucide-react";

type Section =
  | "Dashboard"
  | "Farmers"
  | "Communities"
  | "WhatsApp Messages"
  | "Reports & Analytics"
  | "Locations"
  | "Interests"
  | "Content Management"
  | "Data Export"
  | "Settings";
type AnyRecord = Record<string, any>;
const navItems: { label: Section; icon: any; group: string }[] = [
  { label: "Dashboard", icon: LayoutDashboard, group: "WORKSPACE" },
  { label: "Farmers", icon: Users, group: "WORKSPACE" },
  // { label: "Communities", icon: UsersRound, group: "MANAGEMENT" },
  // { label: "WhatsApp Messages", icon: MessageCircle, group: "MANAGEMENT" },
  { label: "Reports & Analytics", icon: Activity, group: "INSIGHTS" },
  { label: "Locations", icon: MapPin, group: "INSIGHTS" },
  { label: "Interests", icon: Sprout, group: "INSIGHTS" },
  { label: "Content Management", icon: FileSpreadsheet, group: "TOOLS" },
  { label: "Data Export", icon: Download, group: "TOOLS" },
  { label: "Settings", icon: Settings, group: "TOOLS" },
];
const API = "/api/backend";
const LANG: Record<string, string> = {
  te: "Telugu",
  en: "English",
  kn: "Kannada",
  hi: "Hindi",
};
const pretty = (v: unknown) =>
  String(v ?? "—")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
const dateText = (v: string) => (v ? new Date(v).toLocaleString("en-IN") : "—");
async function api(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const response = await fetch(`${API}${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });
  const type = response.headers.get("content-type") || "";
  if (!response.ok) {
    const body = type.includes("json")
      ? await response.json().catch(() => ({}))
      : {};
    const message =
      body?.error?.message ||
      body?.error ||
      body?.message ||
      `Request failed (${response.status})`;
    throw new Error(typeof message === "string" ? message : "Request failed");
  }
  if (type.includes("text/csv")) return response.text();
  return response.json();
}
function Button({
  children,
  onClick,
  kind = "secondary",
  disabled = false,
  type = "button",
}: any) {
  return (
    <button
      type={type}
      className={`fc-btn ${kind}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
function Field({ label, children }: any) {
  return (
    <label className="fc-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Pill({ value }: { value: string }) {
  const tone = ["delivered", "read", "active", "sent"].includes(
    (value || "").toLowerCase()
  )
    ? "good"
    : ["failed", "inactive"].includes((value || "").toLowerCase())
    ? "bad"
    : "neutral";
  return <span className={`fc-pill ${tone}`}>{pretty(value)}</span>;
}
function CommunityStatusBadge({ status }: { status: "joined" | "not_joined" }) {
  return (
    <span className={`community-status-badge ${status}`}>
      {status === "joined" ? "Joined" : "Not joined"}
    </span>
  );
}
function Table({
  columns,
  rows,
  empty = "No records found",
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  return (
    <div className="fc-table-wrap">
      <table className="fc-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="fc-empty">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export default function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [section, setSection] = useState<Section>("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<AnyRecord | null>(null);
  const [farmers, setFarmers] = useState<AnyRecord[]>([]);
  const [farmersPage, setFarmersPage] = useState(1);
  const [farmersTotal, setFarmersTotal] = useState(0);
  const [farmerSearch, setFarmerSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [district, setDistrict] = useState("");
  const [communityStatus, setCommunityStatus] = useState("");
  const [interestId, setInterestId] = useState("");
  const [consent, setConsent] = useState("");
  const [interests, setInterests] = useState<AnyRecord[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<AnyRecord | null>(null);
  const [farmerDraft, setFarmerDraft] = useState<AnyRecord | null>(null);
  const [pinLookup, setPinLookup] = useState("");
  const [pinResult, setPinResult] = useState<AnyRecord | null>(null);
  const [communities, setCommunities] = useState<AnyRecord[]>([]);
  const [messages, setMessages] = useState<AnyRecord[]>([]);
  const [messagePage, setMessagePage] = useState(1);
  const [messageTotal, setMessageTotal] = useState(0);
  const [messageStatus, setMessageStatus] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [locations, setLocations] = useState<AnyRecord[]>([]);
  const [audit, setAudit] = useState<AnyRecord[]>([]);
  const [interestDraft, setInterestDraft] = useState<AnyRecord | null>(null);
  const [communityDraft, setCommunityDraft] = useState<AnyRecord | null>(null);
  const [days, setDays] = useState(30);
  const [contentLanguage, setContentLanguage] = useState("te");
  const [contentDraft, setContentDraft] = useState<AnyRecord>({});
  const [contentSaving, setContentSaving] = useState(false);

  const reportError = (e: unknown) =>
    setError(e instanceof Error ? e.message : "Something went wrong");
  const loadSummary = useCallback(async () => {
    const r = await api(`/admin/dashboard/summary?days=${days}`);
    setSummary(r.data);
  }, [days]);
  const loadFarmers = useCallback(async () => {
    const q = new URLSearchParams({ page: String(farmersPage), limit: "20" });
    if (farmerSearch) q.set("search", farmerSearch);
    if (language) q.set("language", language);
    if (district) q.set("district", district);
    if (communityStatus) q.set("community_status", communityStatus);
    if (interestId) q.set("interestId", interestId);
    if (consent) q.set("consent", consent);
    const r = await api(`/admin/farmers?${q}`);
    setFarmers(r.data || []);
    setFarmersTotal(r.pagination?.total || 0);
  }, [
    farmersPage,
    farmerSearch,
    language,
    district,
    communityStatus,
    interestId,
    consent,
  ]);
  const loadCommunities = useCallback(async () => {
    const r = await api("/admin/communities");
    setCommunities(r.data || []);
  }, []);
  const loadMessages = useCallback(async () => {
    const q = new URLSearchParams({ page: String(messagePage), limit: "20" });
    if (messageStatus) q.set("status", messageStatus);
    if (messageSearch) q.set("search", messageSearch);
    const r = await api(`/admin/whatsapp/messages?${q}`);
    setMessages(r.data || []);
    setMessageTotal(r.pagination?.total || 0);
  }, [messagePage, messageStatus, messageSearch]);
  const loadInterests = useCallback(async () => {
    const r = await api("/admin/interests");
    setInterests(r.data || []);
  }, []);
  const loadLocations = useCallback(async () => {
    const r = await api("/admin/locations/summary");
    setLocations(r.data || []);
  }, []);
  const loadAudit = useCallback(async () => {
    const r = await api("/admin/audit-logs?page=1&limit=30");
    setAudit(r.data || []);
  }, []);
  const loadContent = useCallback(async () => {
    const r = await api("/admin/content/registration_success");
    const rows = r.data || [];
    const draft: AnyRecord = {};
    for (const row of rows)
      if (row.language_code === contentLanguage)
        draft[row.content_key] = row.content_value;
    setContentDraft(draft);
  }, [contentLanguage]);
  async function saveContent() {
    setContentSaving(true);
    try {
      const translations = Object.entries(contentDraft).map(
        ([content_key, content_value]) => ({
          language_code: contentLanguage,
          content_key,
          content_value: String(content_value ?? ""),
          is_published: true,
        })
      );
      await api("/admin/content/registration_success", {
        method: "PUT",
        body: JSON.stringify({ translations }),
      });
      setNotice(`${LANG[contentLanguage]} content saved and published.`);
      await loadContent();
    } catch (e) {
      reportError(e);
    } finally {
      setContentSaving(false);
    }
  }
  const refreshAll = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      await Promise.all([
        loadSummary(),
        loadFarmers(),
        loadCommunities(),
        loadMessages(),
        loadInterests(),
        loadLocations(),
        loadAudit(),
        loadContent(),
      ]);
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  }, [
    loadSummary,
    loadFarmers,
    loadCommunities,
    loadMessages,
    loadInterests,
    loadLocations,
    loadAudit,
    loadContent,
  ]);
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);
  useEffect(() => {
    if (section === "Farmers") loadFarmers().catch(reportError);
    if (section === "Communities") loadCommunities().catch(reportError);
    if (section === "WhatsApp Messages") loadMessages().catch(reportError);
    if (section === "Interests") loadInterests().catch(reportError);
    if (section === "Content Management") loadContent().catch(reportError);
    if (section === "Locations") loadLocations().catch(reportError);
    if (section === "Dashboard" || section === "Reports & Analytics")
      loadSummary().catch(reportError);
  }, [
    section,
    loadFarmers,
    loadCommunities,
    loadMessages,
    loadInterests,
    loadLocations,
    loadSummary,
    loadContent,
  ]);

  async function openFarmer(id: string) {
    try {
      const r = await api(`/admin/farmers/${id}`);
      setSelectedFarmer(r.data);
    } catch (e) {
      reportError(e);
    }
  }
  async function updateCommunityStatus(
    id: string,
    status: "joined" | "not_joined"
  ) {
    const label = status === "joined" ? "Joined" : "Not joined";
    if (
      !confirm(
        `Confirm that this farmer's community status should be changed to "${label}"?`
      )
    )
      return;
    try {
      const result = await api(`/admin/farmers/${id}/community-status`, {
        method: "PATCH",
        body: JSON.stringify({ community_status: status }),
      });
      setSelectedFarmer((current: AnyRecord | null) =>
        current?.id === id ? { ...current, ...result.data } : current
      );
      setFarmers((current) =>
        current.map((farmer) =>
          farmer.id === id
            ? { ...farmer, community_status: result.data.community_status }
            : farmer
        )
      );
      setNotice(`Community status updated to ${label}.`);
      await loadSummary();
    } catch (e) {
      reportError(e);
    }
  }
  async function saveFarmer() {
    if (!farmerDraft) return;
    try {
      const payload = {
        name: farmerDraft.name,
        mobile: farmerDraft.mobile,
        pincode: farmerDraft.pincode,
        state: farmerDraft.state || "Telangana",
        district: farmerDraft.district || null,
        mandal: farmerDraft.mandal || null,
        village: farmerDraft.village || null,
        language: farmerDraft.language || "te",
        interests: farmerDraft.interests || [],
        consent: farmerDraft.consent ?? true,
        consent_text_version: "v1",
      };
      if (farmerDraft.id)
        await api(`/admin/farmers/${farmerDraft.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      else
        await api("/admin/farmers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      setFarmerDraft(null);
      setNotice("Farmer record saved.");
      await loadFarmers();
      await loadSummary();
    } catch (e) {
      reportError(e);
    }
  }
  async function lookupPincode() {
    try {
      const r = await api(`/admin/locations/pincode/${pinLookup}`);
      setPinResult(r.data || null);
    } catch (e) {
      reportError(e);
      setPinResult(null);
    }
  }
  async function deleteFarmer(id: string) {
    if (!confirm("Delete this farmer record? This cannot be undone.")) return;
    try {
      await api(`/admin/farmers/${id}`, { method: "DELETE" });
      setNotice("Farmer deleted.");
      setSelectedFarmer(null);
      await loadFarmers();
      await loadSummary();
    } catch (e) {
      reportError(e);
    }
  }
  async function sendInvite(id: string) {
    try {
      await api(`/admin/whatsapp/send/${id}`, { method: "POST" });
      setNotice("Invitation send request accepted.");
      await loadMessages();
      await loadFarmers();
    } catch (e) {
      reportError(e);
    }
  }
  async function retryMessage(id: string) {
    try {
      await api(`/admin/whatsapp/retry/${id}`, { method: "POST" });
      setNotice("Retry request accepted.");
      await loadMessages();
    } catch (e) {
      reportError(e);
    }
  }
  async function saveCommunity() {
    if (!communityDraft) return;
    try {
      const payload = {
        interest_id: communityDraft.interest_id,
        name: communityDraft.name,
        description: communityDraft.description || "",
        invite_url: communityDraft.invite_url,
        active: communityDraft.active ?? true,
        sort_order: Number(communityDraft.sort_order || 0),
      };
      if (communityDraft.id)
        await api(`/admin/communities/${communityDraft.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      else
        await api("/admin/communities", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      setCommunityDraft(null);
      setNotice("Community saved.");
      await loadCommunities();
    } catch (e) {
      reportError(e);
    }
  }
  async function deleteCommunity(id: string) {
    if (!confirm("Delete this community?")) return;
    try {
      await api(`/admin/communities/${id}`, { method: "DELETE" });
      await loadCommunities();
      setNotice("Community deleted.");
    } catch (e) {
      reportError(e);
    }
  }
  async function saveInterest() {
    if (!interestDraft) return;
    try {
      const payload = {
        slug: interestDraft.slug,
        name_en: interestDraft.name_en,
        name_te: interestDraft.name_te,
        name_kn: interestDraft.name_kn,
        name_hi: interestDraft.name_hi,
        description_en: interestDraft.description_en || "",
        active: interestDraft.active ?? true,
        sort_order: Number(interestDraft.sort_order || 0),
      };
      if (interestDraft.id)
        await api(`/admin/interests/${interestDraft.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      else
        await api("/admin/interests", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      setInterestDraft(null);
      setNotice("Interest saved.");
      await loadInterests();
    } catch (e) {
      reportError(e);
    }
  }
  async function downloadCsv() {
    try {
      const q = new URLSearchParams();
      const csv = await api(`/admin/reports/registrations.csv?${q}`);
      const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "farmer-registrations.csv";
      a.click();
      URL.revokeObjectURL(url);
      setNotice("Registration export downloaded.");
    } catch (e) {
      reportError(e);
    }
  }
  async function logout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.assign("/admin/login");
    }
  }
  const pageTitle: Record<Section, string> = {
    Dashboard: "Overview",
    Farmers: "Farmer management",
    Communities: "Community management",
    "WhatsApp Messages": "WhatsApp communication",
    "Reports & Analytics": "Reports & analytics",
    Locations: "Location insights",
    Interests: "Interest management",
    "Content Management": "Website content management",
    "Data Export": "Export center",
    Settings: "Admin settings",
  };
  const metricCards = [
    {
      label: "Total farmers",
      value: summary?.totalFarmers ?? "—",
      icon: Users,
      note: "All registered farmers",
    },
    {
      label: `Registrations (${days} days)`,
      value: summary?.registrationsInPeriod ?? "—",
      icon: Activity,
      note: "New registrations in selected period",
    },
    {
      label: "WhatsApp messages",
      value: summary?.totalWhatsAppMessages ?? "—",
      icon: MessageCircle,
      note: "Recorded message attempts",
    },
    {
      label: "Delivery rate",
      value: `${summary?.whatsappDeliveryRate ?? 0}%`,
      icon: CheckCircle2,
      note: "Delivered messages",
    },
  ];
  return (
    <main className="admin-shell">
      <aside className={`admin-sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Leaf size={24} />
          </div>
          <div>
            <strong>Think Agri</strong>
            <span>Admin Dashboard</span>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setMobileMenu(false)}
          >
            <X size={18} />
          </button>
        </div>
        <nav className="side-nav">
          {["WORKSPACE", "INSIGHTS", "TOOLS"].map(
            (
              group //"MANAGEMENT",
            ) => (
              <div className="nav-group" key={group}>
                <small>{group}</small>
                {navItems
                  .filter((n) => n.group === group)
                  .map((n) => (
                    <button
                      key={n.label}
                      className={`nav-link ${
                        section === n.label ? "active" : ""
                      }`}
                      onClick={() => {
                        setSection(n.label);
                        setMobileMenu(false);
                        setError("");
                      }}
                    >
                      <n.icon size={17} />
                      {n.label}
                    </button>
                  ))}
              </div>
            )
          )}
        </nav>
        <div className="sidebar-profile">
          <span className="avatar">AD</span>
          <div>
            <b>Administrator</b>
            <small>{adminEmail}</small>
          </div>
          <button onClick={logout} title="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <button className="mobile-menu" onClick={() => setMobileMenu(true)}>
            <Menu />
          </button>
          <div>
            <span className="eyebrow">THINK AGRI / ADMIN</span>
            <h1>{pageTitle[section]}</h1>
          </div>
          <div className="topbar-actions">
            <Button onClick={refreshAll}>
              <RefreshCw size={15} /> Refresh
            </Button>
            <span className="admin-email">{adminEmail}</span>
          </div>
        </header>
        <div className="admin-content">
          {notice && (
            <div className="fc-alert success">
              <CheckCircle2 size={17} />
              {notice}
              <button onClick={() => setNotice("")}>
                <X size={15} />
              </button>
            </div>
          )}
          {error && (
            <div className="fc-alert error">
              <AlertCircle size={17} />
              {error}
              <button onClick={() => setError("")}>
                <X size={15} />
              </button>
            </div>
          )}
          {busy && <p className="fc-loading">Loading latest data…</p>}
          {section === "Dashboard" && (
            <>
              <div className="fc-toolbar">
                <div>
                  <h2>Platform overview</h2>
                  <p>Live metrics from your Supabase database.</p>
                </div>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={365}>Last 12 months</option>
                </select>
              </div>
              <div className="fc-metrics">
                {metricCards.map((m) => (
                  <article className="fc-metric" key={m.label}>
                    <span className="fc-metric-icon">
                      <m.icon size={20} />
                    </span>
                    <small>{m.label}</small>
                    <strong>{m.value}</strong>
                    <p>{m.note}</p>
                  </article>
                ))}
              </div>
              <div className="fc-community-summary">
                <article className="fc-panel">
                  <small>Farmers joined</small>
                  <strong>{summary?.communityStatus?.joined ?? 0}</strong>
                  <span>Confirmed community members</span>
                </article>
                <article className="fc-panel">
                  <small>Farmers not joined</small>
                  <strong>{summary?.communityStatus?.not_joined ?? 0}</strong>
                  <span>Awaiting community membership</span>
                </article>
              </div>
              <div className="fc-grid-two">
                <section className="fc-panel">
                  <h3>Registrations trend</h3>
                  <p className="fc-muted">Daily farmer registrations</p>
                  <div className="fc-bars">
                    {(summary?.registrationTrend || [])
                      .slice(-14)
                      .map((v: any) => (
                        <div key={v.date} title={`${v.date}: ${v.count}`}>
                          <span
                            style={{
                              height: `${Math.max(
                                5,
                                Math.min(
                                  100,
                                  (v.count /
                                    Math.max(
                                      1,
                                      ...(summary?.registrationTrend || []).map(
                                        (x: any) => x.count
                                      )
                                    )) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                          <small>{String(v.date).slice(5)}</small>
                        </div>
                      ))}
                  </div>
                </section>
                <section className="fc-panel">
                  <h3>Breakdown by interest</h3>
                  {interests.map((i) => (
                    <div className="fc-stat-row" key={i.id}>
                      <span>{i.name_en}</span>
                      <b>{summary?.interestBreakdown?.[i.id] ?? 0}</b>
                    </div>
                  ))}
                </section>
                <section className="fc-panel">
                  <h3>Languages</h3>
                  {Object.entries(summary?.languageBreakdown || {}).map(
                    ([k, v]) => (
                      <div className="fc-stat-row" key={k}>
                        <span>{LANG[k] || pretty(k)}</span>
                        <b>{String(v)}</b>
                      </div>
                    )
                  )}
                </section>
                <section className="fc-panel">
                  <h3>WhatsApp status</h3>
                  {Object.entries(summary?.whatsappStatus || {}).map(
                    ([k, v]) => (
                      <div className="fc-stat-row" key={k}>
                        <span>
                          <Pill value={k} />
                        </span>
                        <b>{String(v)}</b>
                      </div>
                    )
                  )}
                </section>
              </div>
              <section className="fc-panel">
                <h3>Recent activity</h3>
                <Table
                  columns={["Action", "Entity", "Actor", "Date"]}
                  rows={(summary?.recentActivity || []).map((a: any) => [
                    pretty(a.action),
                    pretty(a.entity_type),
                    a.actor || "—",
                    dateText(a.created_at),
                  ])}
                />
              </section>
            </>
          )}
          {section === "Farmers" && (
            <>
              <div className="fc-toolbar">
                <div>
                  <h2>
                    Farmers{" "}
                    <span className="fc-count">
                      {farmersTotal.toLocaleString("en-IN")}
                    </span>
                  </h2>
                  <p>Search, filter and manage registered farmers.</p>
                </div>
                <div className="fc-row-actions">
                  <Button onClick={downloadCsv}>
                    <Download size={15} /> Export CSV
                  </Button>
                  <Button
                    kind="primary"
                    onClick={() =>
                      setFarmerDraft({
                        name: "",
                        mobile: "+91",
                        pincode: "",
                        state: "Telangana",
                        district: "",
                        mandal: "",
                        village: "",
                        language: "te",
                        interests: [],
                        consent: true,
                      })
                    }
                  >
                    <Plus size={15} /> Add farmer
                  </Button>
                </div>
              </div>
              <div className="fc-filters">
                <Field label="Search">
                  <input
                    placeholder="Name, mobile, farmer code, PIN…"
                    value={farmerSearch}
                    onChange={(e) => {
                      setFarmerSearch(e.target.value);
                      setFarmersPage(1);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && loadFarmers()}
                  />
                </Field>
                <Field label="Interest">
                  <select
                    value={interestId}
                    onChange={(e) => {
                      setInterestId(e.target.value);
                      setFarmersPage(1);
                    }}
                  >
                    <option value="">All interests</option>
                    {interests.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name_en}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Language">
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      setFarmersPage(1);
                    }}
                  >
                    <option value="">All languages</option>
                    {Object.entries(LANG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="District">
                  <input
                    placeholder="Exact district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </Field>
                <Field label="Community membership">
                  <select
                    value={communityStatus}
                    onChange={(e) => {
                      setCommunityStatus(e.target.value);
                      setFarmersPage(1);
                    }}
                  >
                    <option value="">All statuses</option>
                    <option value="joined">Joined</option>
                    <option value="not_joined">Not joined</option>
                  </select>
                </Field>
                <Field label="Consent">
                  <select
                    value={consent}
                    onChange={(e) => setConsent(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="true">Consented</option>
                    <option value="false">Not consented</option>
                  </select>
                </Field>
                <Button
                  onClick={() => {
                    setFarmersPage(1);
                    loadFarmers();
                  }}
                  kind="primary"
                >
                  <Filter size={15} /> Apply
                </Button>
              </div>
              <Table
                columns={[
                  "Farmer",
                  "Mobile",
                  "PIN",
                  "Location",
                  "Interests",
                  "Language",
                  "Community Status",
                  "Registered",
                  "Actions",
                ]}
                rows={farmers.map((f) => [
                  <button className="fc-link" onClick={() => openFarmer(f.id)}>
                    {f.name}
                    <small>{f.farmer_code}</small>
                  </button>,
                  f.mobile,
                  f.pincode,
                  [f.village, f.mandal, f.district]
                    .filter(Boolean)
                    .join(", ") || f.state,
                  (f.farmer_interests || [])
                    .map((x: any) => x.interests?.name_en || x.interest_id)
                    .join(", "),
                  LANG[f.language] || f.language,
                  <CommunityStatusBadge
                    status={f.community_status || "not_joined"}
                  />,
                  dateText(f.created_at),
                  <div className="fc-row-actions">
                    <Button onClick={() => openFarmer(f.id)}>View</Button>
                    <Button
                      onClick={() =>
                        setFarmerDraft({
                          id: f.id,
                          name: f.name,
                          mobile: f.mobile,
                          pincode: f.pincode,
                          state: f.state,
                          district: f.district,
                          mandal: f.mandal,
                          village: f.village,
                          language: f.language,
                          interests: (f.farmer_interests || []).map(
                            (x: any) => x.interest_id
                          ),
                          consent: f.consent,
                        })
                      }
                    >
                      <Pencil size={14} /> Edit
                    </Button>
                    <Button onClick={() => sendInvite(f.id)}>
                      <Send size={14} /> Invite
                    </Button>
                  </div>,
                ])}
              />
              <div className="fc-pagination">
                <span>
                  Showing {(farmersPage - 1) * 20 + 1}–
                  {Math.min(farmersPage * 20, farmersTotal)} of {farmersTotal}
                </span>
                <Button
                  disabled={farmersPage <= 1}
                  onClick={() => setFarmersPage((p) => p - 1)}
                >
                  <ChevronLeft size={15} />
                </Button>
                <b>{farmersPage}</b>
                <Button
                  disabled={farmersPage * 20 >= farmersTotal}
                  onClick={() => setFarmersPage((p) => p + 1)}
                >
                  <ChevronRight size={15} />
                </Button>
              </div>
            </>
          )}
          {section === "Communities" && (
            <>
              <div className="fc-toolbar">
                <div>
                  <h2>WhatsApp communities</h2>
                  <p>Manage invitation links associated with each interest.</p>
                </div>
                <Button
                  kind="primary"
                  onClick={() =>
                    setCommunityDraft({
                      name: "",
                      interest_id: interests[0]?.id || "",
                      invite_url: "https://chat.whatsapp.com/",
                      active: true,
                      sort_order: communities.length,
                    })
                  }
                >
                  <Plus size={15} /> Add community
                </Button>
              </div>
              <Table
                columns={[
                  "Community",
                  "Interest",
                  "Invite link",
                  "Status",
                  "Actions",
                ]}
                rows={communities.map((c) => [
                  <b>{c.name}</b>,
                  c.interests?.name_en ||
                    interests.find((i) => i.id === c.interest_id)?.name_en ||
                    "—",
                  <a href={c.invite_url} target="_blank" rel="noreferrer">
                    {c.invite_url}
                  </a>,
                  <Pill value={c.active ? "active" : "inactive"} />,
                  <div className="fc-row-actions">
                    <Button onClick={() => setCommunityDraft({ ...c })}>
                      <Pencil size={14} /> Edit
                    </Button>
                    <Button onClick={() => deleteCommunity(c.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>,
                ])}
              />
            </>
          )}
          {section === "WhatsApp Messages" && (
            <>
              <div className="fc-toolbar">
                <div>
                  <h2>Message history</h2>
                  <p>Delivery statuses are updated by the WhatsApp webhook.</p>
                </div>
              </div>
              <div className="fc-filters">
                <Field label="Search mobile">
                  <input
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    placeholder="Search phone number"
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={messageStatus}
                    onChange={(e) => setMessageStatus(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    {["queued", "sent", "delivered", "read", "failed"].map(
                      (s) => (
                        <option key={s} value={s}>
                          {pretty(s)}
                        </option>
                      )
                    )}
                  </select>
                </Field>
                <Button
                  kind="primary"
                  onClick={() => {
                    setMessagePage(1);
                    loadMessages();
                  }}
                >
                  Apply
                </Button>
              </div>
              <Table
                columns={[
                  "Farmer",
                  "Mobile",
                  "Template",
                  "Status",
                  "Message ID",
                  "Created",
                  "Actions",
                ]}
                rows={messages.map((m) => [
                  m.farmers?.name || "—",
                  m.phone,
                  m.template_name,
                  <Pill value={m.status} />,
                  m.message_id || m.error_message || "—",
                  dateText(m.created_at),
                  m.status === "failed" ? (
                    <Button onClick={() => retryMessage(m.id)}>
                      <RefreshCw size={14} /> Retry
                    </Button>
                  ) : (
                    "—"
                  ),
                ])}
              />
              <div className="fc-pagination">
                <span>{messageTotal} messages</span>
                <Button
                  disabled={messagePage <= 1}
                  onClick={() => setMessagePage((p) => p - 1)}
                >
                  <ChevronLeft size={15} />
                </Button>
                <b>{messagePage}</b>
                <Button
                  disabled={messagePage * 20 >= messageTotal}
                  onClick={() => setMessagePage((p) => p + 1)}
                >
                  <ChevronRight size={15} />
                </Button>
              </div>
            </>
          )}
          {section === "Reports & Analytics" && (
            <>
              <div className="fc-toolbar">
                <div>
                  <h2>Reports & analytics</h2>
                  <p>Live aggregated metrics from the backend.</p>
                </div>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>365 days</option>
                </select>
              </div>
              <div className="fc-metrics">
                {metricCards.map((m) => (
                  <article className="fc-metric" key={m.label}>
                    <small>{m.label}</small>
                    <strong>{m.value}</strong>
                    <p>{m.note}</p>
                  </article>
                ))}
              </div>
              <div className="fc-grid-two">
                <section className="fc-panel">
                  <h3>Registrations by district</h3>
                  {Object.entries(summary?.districtBreakdown || {})
                    .sort((a: any, b: any) => b[1] - a[1])
                    .map(([k, v]) => (
                      <div className="fc-stat-row" key={k}>
                        <span>{k}</span>
                        <b>{String(v)}</b>
                      </div>
                    ))}
                </section>
                <section className="fc-panel">
                  <h3>Registration trend</h3>
                  <Table
                    columns={["Date", "Registrations"]}
                    rows={(summary?.registrationTrend || []).map((r: any) => [
                      r.date,
                      r.count,
                    ])}
                  />
                </section>
              </div>
            </>
          )}
          {section === "Locations" && (
            <>
              <div className="fc-toolbar">
                <div>
                  <h2>Farmer locations</h2>
                  <p>Location aggregates based on registered farmers.</p>
                </div>
              </div>
              <div className="fc-filters">
                <Field label="Look up PIN code">
                  <input
                    value={pinLookup}
                    maxLength={6}
                    inputMode="numeric"
                    onChange={(e) =>
                      setPinLookup(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    placeholder="6-digit PIN code"
                  />
                </Field>
                <Button
                  kind="primary"
                  onClick={lookupPincode}
                  disabled={!/^[1-9]\d{5}$/.test(pinLookup)}
                >
                  Look up
                </Button>
                {pinResult && <p>{JSON.stringify(pinResult)}</p>}
              </div>
              <Table
                columns={["State", "District", "Mandal", "PIN code", "Farmers"]}
                rows={locations.map((l) => [
                  l.state,
                  l.district,
                  l.mandal,
                  l.pincode,
                  l.farmer_count,
                ])}
              />
            </>
          )}
          {section === "Interests" && (
            <>
              <div className="fc-toolbar">
                <div>
                  <h2>Areas of interest</h2>
                  <p>
                    Manage the categories displayed during farmer onboarding.
                  </p>
                </div>
                <Button
                  kind="primary"
                  onClick={() =>
                    setInterestDraft({
                      slug: "",
                      name_en: "",
                      name_te: "",
                      name_kn: "",
                      name_hi: "",
                      description_en: "",
                      active: true,
                      sort_order: interests.length,
                    })
                  }
                >
                  <Plus size={15} /> Add interest
                </Button>
              </div>
              <Table
                columns={[
                  "Slug",
                  "English",
                  "Telugu",
                  "Kannada",
                  "Hindi",
                  "Status",
                  "Actions",
                ]}
                rows={interests.map((i) => [
                  i.slug,
                  i.name_en,
                  i.name_te,
                  i.name_kn,
                  i.name_hi,
                  <Pill value={i.active ? "active" : "inactive"} />,
                  <Button onClick={() => setInterestDraft({ ...i })}>
                    <Pencil size={14} /> Edit
                  </Button>,
                ])}
              />
            </>
          )}
          {section === "Content Management" && (
            <section className="fc-panel fc-content-manager">
              <div className="fc-toolbar">
                <div>
                  <h2>Registration success – Step 2</h2>
                  <p>
                    Edit the copy shown after a farmer completes registration.
                    Changes are saved in Supabase and do not require a frontend
                    deployment.
                  </p>
                </div>
                <Field label="Language">
                  <select
                    value={contentLanguage}
                    onChange={(e) => setContentLanguage(e.target.value)}
                  >
                    {Object.entries(LANG).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="fc-content-fields">
                {[
                  ["success_title", "Success heading"],
                  ["success_message", "Registration confirmation prefix"],
                  ["complete_message", "Registration confirmation fallback"],
                  ["community_heading", "Community heading"],
                  ["community_subheading", "Community description"],
                  ["community_button", "Join button label"],
                  ["instruction_heading", "Instruction heading"],
                  ["instruction_message", "Admin group assignment explanation"],
                  ["next_steps_heading", "Next steps heading"],
                  ["next_step_1", "Next step 1"],
                  ["next_step_2", "Next step 2"],
                  ["next_step_3", "Next step 3"],
                  ["edit_details", "Edit details button"],
                  ["community_invite_url", "WhatsApp Community invite URL"],
                ].map(([key, label]) => (
                  <Field key={key} label={label}>
                    {key === "instruction_message" ? (
                      <textarea
                        rows={3}
                        value={contentDraft[key] || ""}
                        onChange={(e) =>
                          setContentDraft((old: AnyRecord) => ({
                            ...old,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <input
                        value={contentDraft[key] || ""}
                        onChange={(e) =>
                          setContentDraft((old: AnyRecord) => ({
                            ...old,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </Field>
                ))}
              </div>
              <div className="fc-modal-actions">
                <Button onClick={() => loadContent().catch(reportError)}>
                  Reload
                </Button>
                <Button
                  kind="primary"
                  disabled={contentSaving}
                  onClick={saveContent}
                >
                  {contentSaving ? "Saving…" : "Save and publish"}
                </Button>
              </div>
              <p className="fc-muted">
                English is used as a fallback when a translation is missing. The
                community invite URL is also language-specific, so keep it the
                same unless you intentionally use a different community.
              </p>
            </section>
          )}
          {section === "Data Export" && (
            <>
              <div className="fc-panel fc-export">
                <FileSpreadsheet size={38} />
                <h2>Farmer registrations export</h2>
                <p>
                  Download registered farmer details as a CSV file from the
                  backend. Export is limited to the backend's configured maximum
                  of 50,000 records.
                </p>
                <Button kind="primary" onClick={downloadCsv}>
                  <Download size={16} /> Download registrations CSV
                </Button>
              </div>
              <section className="fc-panel">
                <h3>Recent audit activity</h3>
                <Table
                  columns={["Action", "Entity", "Actor", "Date"]}
                  rows={audit.map((a) => [
                    a.action,
                    a.entity_type,
                    a.actor,
                    dateText(a.created_at),
                  ])}
                />
              </section>
            </>
          )}
          {section === "Settings" && (
            <>
              <section className="fc-panel">
                <h2>Administrator settings</h2>
                <p>
                  Signed in as <b>{adminEmail}</b>
                </p>
                <p>
                  Authentication is managed by the Express backend using its
                  HttpOnly session cookie.
                </p>
                <Button kind="danger" onClick={logout}>
                  <LogOut size={15} /> Sign out
                </Button>
              </section>
              <section className="fc-panel">
                <h3>Audit log</h3>
                <Table
                  columns={["Action", "Entity", "Actor", "Date", "Metadata"]}
                  rows={audit.map((a) => [
                    a.action,
                    a.entity_type,
                    a.actor,
                    dateText(a.created_at),
                    JSON.stringify(a.metadata || {}),
                  ])}
                />
              </section>
            </>
          )}
        </div>
      </section>
      {selectedFarmer && (
        <div
          className="drawer-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedFarmer(null);
          }}
        >
          <aside className="farmer-drawer">
            <div className="drawer-head">
              <div>
                <p className="eyebrow">FARMER PROFILE</p>
                <h2>Farmer details</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedFarmer(null)}
              >
                <X />
              </button>
            </div>
            <div className="profile-hero">
              <span className="avatar profile-avatar">
                {String(selectedFarmer.name || "F")
                  .slice(0, 1)
                  .toUpperCase()}
              </span>
              <div>
                <h3>{selectedFarmer.name}</h3>
                <p>{selectedFarmer.farmer_code}</p>
              </div>
            </div>
            <div className="fc-detail-list">
              {[
                ["Mobile", selectedFarmer.mobile],
                ["PIN code", selectedFarmer.pincode],
                ["State", selectedFarmer.state],
                ["District", selectedFarmer.district],
                ["Mandal", selectedFarmer.mandal],
                ["Village", selectedFarmer.village],
                [
                  "Language",
                  LANG[selectedFarmer.language] || selectedFarmer.language,
                ],
                ["Consent", selectedFarmer.consent ? "Granted" : "Not granted"],
                ["Consent version", selectedFarmer.consent_text_version],
                ["Source", selectedFarmer.source],
                ["Registered", dateText(selectedFarmer.created_at)],
              ].map(([k, v]) => (
                <div key={k}>
                  <small>{k}</small>
                  <b>{String(v || "—")}</b>
                </div>
              ))}
            </div>
            <section className="fc-community-membership">
              <div>
                <h3>Community membership</h3>
                <CommunityStatusBadge
                  status={selectedFarmer.community_status || "not_joined"}
                />
              </div>
              <Button
                kind="primary"
                onClick={() =>
                  updateCommunityStatus(
                    selectedFarmer.id,
                    selectedFarmer.community_status === "joined"
                      ? "not_joined"
                      : "joined"
                  )
                }
              >
                <CheckCircle2 size={15} />
                {selectedFarmer.community_status === "joined"
                  ? "Mark as Not Joined"
                  : "Mark as Joined"}
              </Button>
            </section>
            <h3>Selected interests</h3>
            <p>
              {(selectedFarmer.farmer_interests || [])
                .map((x: any) => x.interests?.name_en)
                .filter(Boolean)
                .join(", ") || "None"}
            </p>
            <h3>WhatsApp history</h3>
            <Table
              columns={["Status", "Sent", "Delivered", "Read"]}
              rows={(selectedFarmer.whatsapp_messages || []).map((m: any) => [
                <Pill value={m.status} />,
                dateText(m.sent_at),
                dateText(m.delivered_at),
                dateText(m.read_at),
              ])}
            />
            <h3>Audit history</h3>
            <Table
              columns={["Action", "Actor", "Date"]}
              rows={(selectedFarmer.audit_logs || []).map((a: any) => [
                a.action,
                a.actor,
                dateText(a.created_at),
              ])}
            />
            <div className="fc-drawer-actions">
              <Button
                kind="danger"
                onClick={() => deleteFarmer(selectedFarmer.id)}
              >
                <Trash2 size={15} /> Delete farmer
              </Button>
              <Button
                kind="primary"
                onClick={() => sendInvite(selectedFarmer.id)}
              >
                <Send size={15} /> Send invitation
              </Button>
            </div>
          </aside>
        </div>
      )}
      {farmerDraft && (
        <div className="fc-modal-backdrop">
          <form
            className="fc-modal"
            onSubmit={(e) => {
              e.preventDefault();
              saveFarmer();
            }}
          >
            <div className="fc-modal-head">
              <h2>{farmerDraft.id ? "Edit farmer" : "Add farmer"}</h2>
              <button type="button" onClick={() => setFarmerDraft(null)}>
                <X />
              </button>
            </div>
            {(
              [
                "name",
                "mobile",
                "pincode",
                "state",
                "district",
                "mandal",
                "village",
              ] as const
            ).map((k) => (
              <Field key={k} label={pretty(k)}>
                <input
                  required={["name", "mobile", "pincode"].includes(k)}
                  value={farmerDraft[k] || ""}
                  onChange={(e) =>
                    setFarmerDraft({ ...farmerDraft, [k]: e.target.value })
                  }
                />
              </Field>
            ))}
            <Field label="Language">
              <select
                value={farmerDraft.language || "te"}
                onChange={(e) =>
                  setFarmerDraft({ ...farmerDraft, language: e.target.value })
                }
              >
                {Object.entries(LANG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Interests">
              <div className="fc-interest-checks">
                {interests.map((i) => (
                  <label key={i.id}>
                    <input
                      type="checkbox"
                      checked={(farmerDraft.interests || []).includes(i.id)}
                      onChange={(e) =>
                        setFarmerDraft({
                          ...farmerDraft,
                          interests: e.target.checked
                            ? [...(farmerDraft.interests || []), i.id]
                            : (farmerDraft.interests || []).filter(
                                (x: string) => x !== i.id
                              ),
                        })
                      }
                    />
                    {i.name_en}
                  </label>
                ))}
              </div>
            </Field>
            <label className="fc-check">
              <input
                type="checkbox"
                checked={farmerDraft.consent ?? false}
                onChange={(e) =>
                  setFarmerDraft({ ...farmerDraft, consent: e.target.checked })
                }
              />{" "}
              WhatsApp consent granted
            </label>
            <div className="fc-modal-actions">
              <Button onClick={() => setFarmerDraft(null)}>Cancel</Button>
              <Button type="submit" kind="primary">
                Save farmer
              </Button>
            </div>
          </form>
        </div>
      )}
      {communityDraft && (
        <div className="fc-modal-backdrop">
          <form
            className="fc-modal"
            onSubmit={(e) => {
              e.preventDefault();
              saveCommunity();
            }}
          >
            <div className="fc-modal-head">
              <h2>{communityDraft.id ? "Edit community" : "Add community"}</h2>
              <button type="button" onClick={() => setCommunityDraft(null)}>
                <X />
              </button>
            </div>
            <Field label="Community name">
              <input
                required
                value={communityDraft.name || ""}
                onChange={(e) =>
                  setCommunityDraft({ ...communityDraft, name: e.target.value })
                }
              />
            </Field>
            <Field label="Interest">
              <select
                required
                value={communityDraft.interest_id || ""}
                onChange={(e) =>
                  setCommunityDraft({
                    ...communityDraft,
                    interest_id: e.target.value,
                  })
                }
              >
                {interests.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name_en}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="WhatsApp invite URL">
              <input
                required
                type="url"
                pattern="https://chat.whatsapp.com/.*"
                value={communityDraft.invite_url || ""}
                onChange={(e) =>
                  setCommunityDraft({
                    ...communityDraft,
                    invite_url: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Description">
              <textarea
                value={communityDraft.description || ""}
                onChange={(e) =>
                  setCommunityDraft({
                    ...communityDraft,
                    description: e.target.value,
                  })
                }
              />
            </Field>
            <label className="fc-check">
              <input
                type="checkbox"
                checked={communityDraft.active ?? true}
                onChange={(e) =>
                  setCommunityDraft({
                    ...communityDraft,
                    active: e.target.checked,
                  })
                }
              />{" "}
              Active
            </label>
            <div className="fc-modal-actions">
              <Button onClick={() => setCommunityDraft(null)}>Cancel</Button>
              <Button type="submit" kind="primary">
                Save community
              </Button>
            </div>
          </form>
        </div>
      )}
      {interestDraft && (
        <div className="fc-modal-backdrop">
          <form
            className="fc-modal"
            onSubmit={(e) => {
              e.preventDefault();
              saveInterest();
            }}
          >
            <div className="fc-modal-head">
              <h2>{interestDraft.id ? "Edit interest" : "Add interest"}</h2>
              <button type="button" onClick={() => setInterestDraft(null)}>
                <X />
              </button>
            </div>
            {(
              [
                "slug",
                "name_en",
                "name_te",
                "name_kn",
                "name_hi",
                "description_en",
              ] as const
            ).map((k) => (
              <Field key={k} label={pretty(k)}>
                <input
                  required={k !== "description_en"}
                  value={interestDraft[k] || ""}
                  onChange={(e) =>
                    setInterestDraft({ ...interestDraft, [k]: e.target.value })
                  }
                />
              </Field>
            ))}
            <label className="fc-check">
              <input
                type="checkbox"
                checked={interestDraft.active ?? true}
                onChange={(e) =>
                  setInterestDraft({
                    ...interestDraft,
                    active: e.target.checked,
                  })
                }
              />{" "}
              Active
            </label>
            <div className="fc-modal-actions">
              <Button onClick={() => setInterestDraft(null)}>Cancel</Button>
              <Button type="submit" kind="primary">
                Save interest
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
