import { useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "./api";
import { translations, convertDataText } from "./i18n";
import { exportRecordsToExcel } from "./exportExcel";

// ── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext();
const useApp = () => useContext(AppContext);

// ── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const fmt = (n, lang = "ta") => new Intl.NumberFormat(lang === "ta" ? "ta-IN" : "en-IN").format(n || 0);
const fmtDate = (d, lang = "ta") =>
  d
    ? new Date(d).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const formatDateForInput = (d) => {
  if (!d) return "";
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return "";
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div
      className="toast-container"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className="toast-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              background: t.type === "success" ? "#065f46" : "#7f1d1d",
              color: "#fff",
              padding: "12px 20px",
              borderRadius: 12,
              fontSize: 14,
              fontFamily: "'Noto Sans Tamil', sans-serif",
              maxWidth: 340,
              boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
              fontWeight: 500,
            }}
          >
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Modal / Mobile Bottom Sheet ──────────────────────────────────────────────
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ y: 60, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: 24,
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div className="mobile-sheet-handle" style={{ justifyContent: "center", marginBottom: 12 }}>
          <div style={{ width: 44, height: 5, borderRadius: 3, background: "#cbd5e1" }} />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "#1a1a1a",
              fontFamily: "'Noto Sans Tamil', sans-serif",
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              cursor: "pointer",
              color: "#64748b",
              lineHeight: 1,
              minHeight: 36,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function Confirm({ open, msg, onYes, onNo }) {
  const { t } = useApp();
  return (
    <Modal open={open} title={t("confirmTitle")} onClose={onNo}>
      <p
        style={{
          fontSize: 15,
          color: "#444",
          marginBottom: 20,
          fontFamily: "'Noto Sans Tamil', sans-serif",
        }}
      >
        {msg}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onNo} style={btnStyle("#f3f4f6", "#374151")}>
          {t("cancel")}
        </button>
        <button onClick={onYes} style={btnStyle("#dc2626", "#fff")}>
          {t("delete")}
        </button>
      </div>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid #e2e8f0",
  borderRadius: 10,
  fontSize: 15,
  fontFamily: "'Noto Sans Tamil', sans-serif",
  outline: "none",
  boxSizing: "border-box",
  color: "#0f172a",
  background: "#f8fafc",
  minHeight: 44,
};
const btnStyle = (bg, color) => ({
  background: bg,
  color,
  border: "none",
  borderRadius: 10,
  padding: "11px 20px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Noto Sans Tamil', sans-serif",
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
});
const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#475569",
  marginBottom: 6,
  display: "block",
  fontFamily: "'Noto Sans Tamil', sans-serif",
};

// Preset Event Options for Dropdown
const eventOptions = [
  { ta: "திருமணம்", en: "Wedding (திருமணம்)" },
  { ta: "வரவேற்பு", en: "Reception (வரவேற்பு)" },
  { ta: "காதுகுத்து", en: "Ear Piercing (காதுகுத்து)" },
  { ta: "புதுமனை புகுவிழா", en: "Housewarming (புதுமனை புகுவிழா)" },
  { ta: "மஞ்சள் நீராட்டு விழா", en: "Puberty Function (மஞ்சள் நீராட்டு)" },
  { ta: "வளைகாப்பு", en: "Baby Shower (வளைகாப்பு)" },
  { ta: "பிறந்தநாள்", en: "Birthday (பிறந்தநாள்)" },
  { ta: "நிச்சயதார்த்தம்", en: "Engagement (நிச்சயதார்த்தம்)" },
  { ta: "other", en: "Other... (மற்றவை)" },
];

// ── Record Form ───────────────────────────────────────────────────────────────
function RecordForm({ initial = {}, onSave, onClose, mode = "cash" }) {
  const { t, lang } = useApp();
  const formatInitialData = (data) => ({
    relativeName: data.relativeName || "",
    city: data.city || "",
    amount: data.amount !== undefined ? data.amount : "",
    grams: data.grams !== undefined ? data.grams : "",
    eventName: data.eventName || "திருமணம்",
    date: data.date ? formatDateForInput(data.date) : "",
    notes: data.notes || "",
  });

  const [form, setForm] = useState(() => formatInitialData(initial));
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const [selectedEventOption, setSelectedEventOption] = useState(() => {
    if (!initial.eventName) return "திருமணம்";
    const matched = eventOptions.find(
      (opt) => opt.ta.toLowerCase() === initial.eventName.toLowerCase()
    );
    return matched ? matched.ta : "other";
  });

  const [customEvent, setCustomEvent] = useState(() => {
    const matched = eventOptions.find(
      (opt) => opt.ta.toLowerCase() === (initial.eventName || "").toLowerCase()
    );
    return matched ? "" : initial.eventName || "";
  });

  useEffect(() => {
    const formatted = formatInitialData(initial);
    setForm(formatted);
    const matched = eventOptions.find(
      (opt) => opt.ta.toLowerCase() === (formatted.eventName || "").toLowerCase()
    );
    if (matched) {
      setSelectedEventOption(matched.ta);
      setCustomEvent("");
    } else if (formatted.eventName) {
      setSelectedEventOption("other");
      setCustomEvent(formatted.eventName);
    } else {
      setSelectedEventOption("திருமணம்");
      setCustomEvent("");
      setForm((p) => ({ ...p, eventName: "திருமணம்" }));
    }
  }, [initial]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={labelStyle}>{t("relativeNameLabel")}</label>
        <input
          style={inputStyle}
          placeholder={t("relativeNamePlaceholder")}
          value={form.relativeName}
          onChange={(e) => set("relativeName", e.target.value)}
        />
      </div>
      <div>
        <label style={labelStyle}>{t("cityLabel")}</label>
        <input
          style={inputStyle}
          placeholder={t("cityPlaceholder")}
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
        />
      </div>
      {mode === "cash" ? (
        <div>
          <label style={labelStyle}>{t("amountLabel")}</label>
          <input
            style={inputStyle}
            type="number"
            placeholder="0"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
          />
        </div>
      ) : (
        <div>
          <label style={labelStyle}>{t("gramsLabel")}</label>
          <input
            style={inputStyle}
            type="number"
            placeholder="0.00"
            step="0.01"
            value={form.grams}
            onChange={(e) => set("grams", e.target.value)}
          />
        </div>
      )}
      <div>
        <label style={labelStyle}>{t("eventNameLabel")}</label>
        <select
          style={inputStyle}
          value={selectedEventOption}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedEventOption(val);
            if (val === "other") {
              set("eventName", customEvent);
            } else {
              set("eventName", val);
            }
          }}
        >
          {eventOptions.map((opt) => (
            <option key={opt.ta} value={opt.ta}>
              {lang === "ta" ? opt.ta : opt.en}
            </option>
          ))}
        </select>

        {selectedEventOption === "other" && (
          <input
            style={{ ...inputStyle, marginTop: 8 }}
            placeholder={t("eventNamePlaceholder")}
            value={customEvent}
            onChange={(e) => {
              setCustomEvent(e.target.value);
              set("eventName", e.target.value);
            }}
          />
        )}
      </div>
      <div>
        <label style={labelStyle}>{t("dateLabel")}</label>
        <input
          style={inputStyle}
          type="date"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
        />
      </div>
      <div>
        <label style={labelStyle}>{t("notesLabel")}</label>
        <textarea
          style={{ ...inputStyle, height: 80, minHeight: 80, resize: "vertical" }}
          placeholder={t("notesPlaceholder")}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          marginTop: 6,
        }}
      >
        <button onClick={onClose} style={btnStyle("#f3f4f6", "#374151")}>
          {t("cancel")}
        </button>
        <button
          onClick={() => onSave(form)}
          style={btnStyle(
            "linear-gradient(135deg,#d97706,#b45309)",
            "#fff"
          )}
        >
          {t("save")}
        </button>
      </div>
    </div>
  );
}

// ── Records Table & Mobile Cards ──────────────────────────────────────────────
function RecordsTable({ records, mode, onEdit, onDelete }) {
  const { lang, t, convertDataText } = useApp();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  const cities = [...new Set(records.map((r) => r.city).filter(Boolean))];

  const filtered = records.filter((r) => {
    const s = search.toLowerCase();
    const relName = convertDataText(r.relativeName, lang).toLowerCase();
    const evtName = convertDataText(r.eventName, lang).toLowerCase();
    const matchSearch =
      !s ||
      relName.includes(s) ||
      evtName.includes(s) ||
      r.relativeName?.toLowerCase().includes(s);
    const matchCity = !cityFilter || r.city === cityFilter;
    return matchSearch && matchCity;
  });

  const valueKey = mode === "cash" ? "amount" : "grams";
  const total = filtered.reduce((s, r) => s + parseFloat(r[valueKey] || 0), 0);

  return (
    <div>
      <div
        className="filter-row"
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}
      >
        <input
          style={{ ...inputStyle, maxWidth: 220 }}
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={{ ...inputStyle, maxWidth: 160 }}
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">{t("allCities")}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {convertDataText(c, lang)}
            </option>
          ))}
        </select>

        <button
          onClick={() => exportRecordsToExcel(filtered, mode, lang)}
          style={{
            ...btnStyle("#065f46", "#ffffff"),
            marginLeft: "auto",
            padding: "8px 16px",
            fontSize: 13,
            borderRadius: 10,
            minHeight: 42,
          }}
        >
          {t("exportExcel")}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 16px",
            color: "#9ca3af",
            fontFamily: "'Noto Sans Tamil', sans-serif",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ margin: 0 }}>{t("noRecordsFound")}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div
            className="desktop-table-view"
            style={{
              overflowX: "auto",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                fontFamily: "'Noto Sans Tamil', sans-serif",
              }}
            >
              <thead>
                <tr style={{ background: "#fef3c7" }}>
                  {[
                    t("relative"),
                    t("city"),
                    mode === "cash" ? t("amount") : t("grams"),
                    t("event"),
                    t("date"),
                    t("actions"),
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 14px",
                        textAlign: "left",
                        fontWeight: 700,
                        color: "#78350f",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <motion.tr
                    key={r._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={{
                      borderTop: "1px solid #f3f4f6",
                      background: i % 2 === 0 ? "#fff" : "#fafafa",
                    }}
                  >
                    <td
                      style={{
                        padding: "11px 14px",
                        fontWeight: 600,
                        color: "#1a1a1a",
                      }}
                    >
                      {convertDataText(r.relativeName, lang)}
                    </td>
                    <td style={{ padding: "11px 14px", color: "#6b7280" }}>
                      {r.city ? convertDataText(r.city, lang) : "—"}
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        fontWeight: 700,
                        color: "#d97706",
                      }}
                    >
                      {mode === "cash" ? `₹${fmt(r.amount, lang)}` : `${r.grams} ${lang === "ta" ? "கி" : "g"}`}
                    </td>
                    <td style={{ padding: "11px 14px", color: "#374151" }}>
                      {r.eventName ? convertDataText(r.eventName, lang) : "—"}
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtDate(r.date, lang)}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => onEdit(r)}
                          style={{
                            background: "#eff6ff",
                            border: "none",
                            borderRadius: 8,
                            padding: "6px 12px",
                            cursor: "pointer",
                            color: "#2563eb",
                            fontSize: 12,
                            fontWeight: 600,
                            minHeight: 36,
                          }}
                        >
                          ✏️ {t("edit")}
                        </button>
                        <button
                          onClick={() => setConfirmId(r._id)}
                          style={{
                            background: "#fef2f2",
                            border: "none",
                            borderRadius: 8,
                            padding: "6px 12px",
                            cursor: "pointer",
                            color: "#dc2626",
                            fontSize: 12,
                            fontWeight: 600,
                            minHeight: 36,
                          }}
                        >
                          🗑️ {t("delete")}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="mobile-cards-view" style={{ flexDirection: "column", gap: 12 }}>
            {filtered.map((r, i) => (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  background: "#ffffff",
                  borderRadius: 14,
                  padding: "16px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                      {convertDataText(r.relativeName, lang)}
                    </div>
                    {r.city && (
                      <span style={{ display: "inline-block", marginTop: 4, fontSize: 12, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 6, fontWeight: 500 }}>
                        📍 {convertDataText(r.city, lang)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "#d97706", background: "#fef3c7", padding: "4px 10px", borderRadius: 8 }}>
                    {mode === "cash" ? `₹${fmt(r.amount, lang)}` : `${r.grams} ${lang === "ta" ? "கி" : "g"}`}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#64748b", borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
                  <div>🎉 {r.eventName ? convertDataText(r.eventName, lang) : "—"}</div>
                  <div>📅 {fmtDate(r.date, lang)}</div>
                </div>

                {r.notes && (
                  <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic", background: "#f8fafc", padding: "6px 10px", borderRadius: 6 }}>
                    📝 {convertDataText(r.notes, lang)}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => onEdit(r)}
                    style={{
                      flex: 1,
                      background: "#eff6ff",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                      color: "#2563eb",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      minHeight: 44,
                    }}
                  >
                    ✏️ {t("edit")}
                  </button>
                  <button
                    onClick={() => setConfirmId(r._id)}
                    style={{
                      flex: 1,
                      background: "#fef2f2",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                      color: "#dc2626",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      minHeight: 44,
                    }}
                  >
                    🗑️ {t("delete")}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div
            style={{
              marginTop: 14,
              padding: "12px 16px",
              background: "#fef3c7",
              borderRadius: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "#78350f",
                fontFamily: "'Noto Sans Tamil', sans-serif",
                fontWeight: 600,
              }}
            >
              {t("total")}: {filtered.length} {t("recordsCount")}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#92400e",
                fontFamily: "'Noto Sans Tamil', sans-serif",
              }}
            >
              {mode === "cash"
                ? `₹${fmt(Math.round(total), lang)}`
                : `${total.toFixed(2)} ${lang === "ta" ? "கிராம்" : "g"}`}
            </span>
          </div>
        </>
      )}

      <Confirm
        open={!!confirmId}
        msg={t("confirmDeleteMsg")}
        onYes={() => {
          onDelete(confirmId);
          setConfirmId(null);
        }}
        onNo={() => setConfirmId(null)}
      />
    </div>
  );
}

// ── Section (Cash or Gold) ────────────────────────────────────────────────────
function Section({ mode }) {
  const {
    cashRecords,
    goldRecords,
    setCashRecords,
    setGoldRecords,
    toast,
    t,
  } = useApp();
  const [tab, setTab] = useState("received");
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const records = mode === "cash" ? cashRecords : goldRecords;
  const setRecords = mode === "cash" ? setCashRecords : setGoldRecords;

  const tabs = [
    { key: "received", label: t("receivedTab"), icon: "⬇️" },
    { key: "given", label: t("givenTab"), icon: "⬆️" },
    { key: "completed", label: t("completedTab"), icon: "✅" },
  ];

  const filtered = records.filter((r) => r.type === tab);

  const handleSave = async (form) => {
    const requiredField = mode === "cash" ? "amount" : "grams";
    if (!form.relativeName || !form[requiredField]) {
      toast(t("reqFieldsErr"), "error");
      return;
    }

    try {
      if (editRecord) {
        const updatedDoc = await api.updateRecord(editRecord._id, {
          ...form,
          mode,
          type: tab,
        });
        const updated = records.map((r) =>
          r._id === editRecord._id ? updatedDoc : r
        );
        setRecords(updated);
        toast(t("recordUpdated"));
      } else {
        const newDoc = await api.createRecord({ ...form, mode, type: tab });
        const updated = [newDoc, ...records];
        setRecords(updated);
        toast(t("recordAdded"));
      }
      setShowForm(false);
      setEditRecord(null);
    } catch (error) {
      toast(error.message || "Error saving record!", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteRecord(id);
      const updated = records.filter((r) => r._id !== id);
      setRecords(updated);
      toast(t("recordDeleted"));
    } catch (error) {
      toast(error.message || "Error deleting record!", "error");
    }
  };

  const handleEdit = (r) => {
    setEditRecord(r);
    setShowForm(true);
  };

  return (
    <div>
      {/* Tab Bar */}
      <div
        className="section-tab-bar"
        style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}
      >
        {tabs.map((tItem) => (
          <button
            key={tItem.key}
            onClick={() => setTab(tItem.key)}
            style={{
              ...btnStyle(
                tab === tItem.key
                  ? "linear-gradient(135deg,#d97706,#92400e)"
                  : "#ffffff",
                tab === tItem.key ? "#fff" : "#374151"
              ),
              borderRadius: 20,
              padding: "8px 16px",
              fontSize: 13,
              border: tab === tItem.key ? "none" : "1.5px solid #e2e8f0",
              minHeight: 40,
            }}
          >
            {tItem.icon} {tItem.label}
          </button>
        ))}
        <button
          className="new-record-btn"
          onClick={() => {
            setEditRecord(null);
            setShowForm(true);
          }}
          style={{
            ...btnStyle(
              "linear-gradient(135deg,#059669,#047857)",
              "#fff"
            ),
            marginLeft: "auto",
            borderRadius: 20,
            padding: "8px 18px",
            fontSize: 13,
            minHeight: 40,
          }}
        >
          {t("newRecord")}
        </button>
      </div>

      <RecordsTable
        records={filtered}
        mode={mode}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={showForm}
        title={editRecord ? t("editRecordTitle") : t("addRecordTitle")}
        onClose={() => {
          setShowForm(false);
          setEditRecord(null);
        }}
      >
        <RecordForm
          initial={editRecord || {}}
          mode={mode}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditRecord(null);
          }}
        />
      </Modal>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const { cashRecords, goldRecords, lang, t, convertDataText } = useApp();

  const totalCashReceived = cashRecords
    .filter((r) => r.type === "received")
    .reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const totalCashGiven = cashRecords
    .filter((r) => r.type === "given")
    .reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const totalGoldReceived = goldRecords
    .filter((r) => r.type === "received")
    .reduce((s, r) => s + parseFloat(r.grams || 0), 0);
  const totalGoldGiven = goldRecords
    .filter((r) => r.type === "given")
    .reduce((s, r) => s + parseFloat(r.grams || 0), 0);
  const pendingCash = cashRecords.filter((r) => r.type !== "completed").length;
  const completedAll =
    cashRecords.filter((r) => r.type === "completed").length +
    goldRecords.filter((r) => r.type === "completed").length;

  const cards = [
    {
      label: t("totalCashReceived"),
      value: `₹${fmt(Math.round(totalCashReceived), lang)}`,
      icon: "📥",
      bg: "#ecfdf5",
      color: "#065f46",
    },
    {
      label: t("totalCashGiven"),
      value: `₹${fmt(Math.round(totalCashGiven), lang)}`,
      icon: "📤",
      bg: "#fef3c7",
      color: "#78350f",
    },
    {
      label: t("totalGoldReceived"),
      value: `${totalGoldReceived.toFixed(2)} ${lang === "ta" ? "கி" : "g"}`,
      icon: "🥇",
      bg: "#fef9e7",
      color: "#b45309",
    },
    {
      label: t("totalGoldGiven"),
      value: `${totalGoldGiven.toFixed(2)} ${lang === "ta" ? "கி" : "g"}`,
      icon: "💛",
      bg: "#fff7ed",
      color: "#c2410c",
    },
    {
      label: t("pending"),
      value: pendingCash,
      icon: "⏳",
      bg: "#eff6ff",
      color: "#1d4ed8",
    },
    {
      label: t("completed"),
      value: completedAll,
      icon: "✅",
      bg: "#f0fdf4",
      color: "#166534",
    },
  ];

  const recent = [...cashRecords, ...goldRecords]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2
            style={{
              margin: "0 0 4px",
              fontSize: 22,
              fontWeight: 800,
              color: "#1a1a1a",
              fontFamily: "'Noto Sans Tamil', sans-serif",
            }}
          >
            {t("welcome")}
          </h2>
          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontFamily: "'Noto Sans Tamil', sans-serif",
              fontSize: 14,
            }}
          >
            {t("dashboardDesc")}
          </p>
        </div>

        <button
          onClick={() => exportRecordsToExcel([...cashRecords, ...goldRecords], "all", lang)}
          style={{
            ...btnStyle("#065f46", "#ffffff"),
            padding: "8px 16px",
            fontSize: 13,
            borderRadius: 10,
            minHeight: 40,
          }}
        >
          {t("exportExcel")}
        </button>
      </div>

      <div
        className="stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: c.bg,
              borderRadius: 16,
              padding: "18px 16px",
              border: `1.5px solid ${c.color}22`,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: c.color,
                fontFamily: "'Noto Sans Tamil', sans-serif",
              }}
            >
              {c.value}
            </div>
            <div
              style={{
                fontSize: 12,
                color: c.color + "bb",
                fontFamily: "'Noto Sans Tamil', sans-serif",
                marginTop: 4,
                lineHeight: 1.3,
                fontWeight: 600,
              }}
            >
              {c.label}
            </div>
          </motion.div>
        ))}
      </div>

      {recent.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#374151",
              fontFamily: "'Noto Sans Tamil', sans-serif",
              marginBottom: 12,
            }}
          >
            {t("recentRecords")}
          </h3>
          <div
            style={{
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              background: "#ffffff",
            }}
          >
            {recent.map((r, i) => (
              <div
                key={r._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderTop: i > 0 ? "1px solid #f3f4f6" : "none",
                  background: i % 2 === 0 ? "#fff" : "#fafafa",
                }}
              >
                <div style={{ fontSize: 22 }}>
                  {r.type === "received"
                    ? "⬇️"
                    : r.type === "given"
                    ? "⬆️"
                    : "✅"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "#111",
                      fontFamily: "'Noto Sans Tamil', sans-serif",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {convertDataText(r.relativeName, lang)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      fontFamily: "'Noto Sans Tamil', sans-serif",
                    }}
                  >
                    {r.eventName ? convertDataText(r.eventName, lang) : "—"} · {fmtDate(r.date, lang)}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#d97706",
                    fontFamily: "'Noto Sans Tamil', sans-serif",
                    fontSize: 15,
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.amount
                    ? `₹${fmt(r.amount, lang)}`
                    : r.grams
                    ? `${r.grams} ${lang === "ta" ? "கி" : "g"}`
                    : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recent.length === 0 && (
        <div
          style={{ textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}
        >
          <div style={{ fontSize: 56, marginBottom: 12 }}>🏠</div>
          <p
            style={{
              margin: 0,
              fontFamily: "'Noto Sans Tamil', sans-serif",
              fontSize: 15,
            }}
          >
            {t("noRecordsYet")}
            <br />
            {t("addFirstRecord")}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
function Profile() {
  const { user, setUser, setPage, toast, t, lang, toggleLang } = useApp();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "" });
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });

  const handleUpdateProfile = async () => {
    if (!form.name) {
      toast(t("reqFieldsErr"), "error");
      return;
    }
    try {
      const updatedUser = await api.updateProfile(form.name);
      const newSession = { ...user, name: updatedUser.name };
      localStorage.setItem("moi_loggedIn", JSON.stringify(newSession));
      setUser(newSession);
      toast(t("profileUpdated"));
    } catch (error) {
      toast(error.message || "Error updating profile!", "error");
    }
  };

  const handleChangePw = async () => {
    if (!pwForm.current || !pwForm.newPw) {
      toast(t("reqFieldsErr"), "error");
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      toast("Passwords do not match!", "error");
      return;
    }
    try {
      await api.changePassword(pwForm.current, pwForm.newPw);
      toast(t("pwChanged"));
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (error) {
      toast(error.message || "Error changing password!", "error");
    }
  };

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
          background: "linear-gradient(135deg,#fef3c7,#fff7ed)",
          borderRadius: 16,
          padding: 20,
          border: "1px solid #fef08a",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#d97706,#92400e)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1a1a1a",
              fontFamily: "'Noto Sans Tamil', sans-serif",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user?.name}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              fontFamily: "'Noto Sans Tamil', sans-serif",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user?.email}
          </div>
        </div>
      </div>

      {/* Language Toggle in Profile */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1.5px solid #e5e7eb",
          padding: 20,
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
            🌐 {lang === "ta" ? "மொழி (Language)" : "Language (மொழி)"}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            {lang === "ta" ? "தற்போதைய மொழி: தமிழ்" : "Current language: English"}
          </div>
        </div>
        <button
          onClick={toggleLang}
          style={{
            ...btnStyle("linear-gradient(135deg,#3b82f6,#1d4ed8)", "#ffffff"),
            padding: "8px 16px",
            fontSize: 13,
            borderRadius: 20,
            minHeight: 40,
          }}
        >
          🔄 {t("langSwitch")}
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1.5px solid #e5e7eb",
          padding: 20,
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            margin: "0 0 16px",
            fontSize: 15,
            fontWeight: 700,
            color: "#374151",
            fontFamily: "'Noto Sans Tamil', sans-serif",
          }}
        >
          {t("editProfileTitle")}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>{t("nameLabel")}</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label style={labelStyle}>{t("emailLabel")}</label>
            <input
              style={{ ...inputStyle, background: "#f3f4f6", color: "#9ca3af" }}
              value={form.email}
              disabled
            />
          </div>
          <button
            onClick={handleUpdateProfile}
            style={btnStyle(
              "linear-gradient(135deg,#d97706,#b45309)",
              "#fff"
            )}
          >
            {t("update")}
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1.5px solid #e5e7eb",
          padding: 20,
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            margin: "0 0 16px",
            fontSize: 15,
            fontWeight: 700,
            color: "#374151",
            fontFamily: "'Noto Sans Tamil', sans-serif",
          }}
        >
          {t("changePasswordTitle")}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            ["current", t("currentPasswordLabel")],
            ["newPw", t("newPasswordLabel")],
            ["confirm", t("confirmPasswordLabel")],
          ].map(([k, l]) => (
            <div key={k}>
              <label style={labelStyle}>{l}</label>
              <input
                style={inputStyle}
                type="password"
                value={pwForm[k]}
                onChange={(e) =>
                  setPwForm((p) => ({ ...p, [k]: e.target.value }))
                }
              />
            </div>
          ))}
          <button
            onClick={handleChangePw}
            style={btnStyle(
              "linear-gradient(135deg,#1d4ed8,#1e40af)",
              "#fff"
            )}
          >
            {t("changePasswordBtn")}
          </button>
        </div>
      </div>

      <button
        onClick={() => {
          localStorage.removeItem("moi_loggedIn");
          setUser(null);
          setPage("login");
        }}
        style={{
          ...btnStyle("#fef2f2", "#dc2626"),
          width: "100%",
          border: "1.5px solid #fecaca",
          marginTop: 8,
        }}
      >
        {t("logout")}
      </button>
    </div>
  );
}

// ── Auth Pages ────────────────────────────────────────────────────────────────
function AuthPage({ type, onSwitch, onLogin }) {
  const { t, lang, toggleLang } = useApp() || { t: (k) => translations.ta[k] || k, lang: "ta" };
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handle = async () => {
    setErr("");
    if (!form.email || !form.password) {
      setErr(lang === "ta" ? "மின்னஞ்சல் மற்றும் கடவுச்சொல் கட்டாயம்!" : "Email and password are required!");
      return;
    }
    try {
      if (type === "register") {
        if (!form.name) {
          setErr(lang === "ta" ? "பெயர் கட்டாயம்!" : "Name is required!");
          return;
        }
        if (form.password !== form.confirm) {
          setErr(lang === "ta" ? "கடவுச்சொற்கள் பொருந்தவில்லை!" : "Passwords do not match!");
          return;
        }
        const data = await api.register(form.name, form.email, form.password);
        onLogin(data);
      } else {
        const data = await api.login(form.email, form.password);
        onLogin(data);
      }
    } catch (error) {
      setErr(error.message || (lang === "ta" ? "அங்கீகார பிழை!" : "Authentication error!"));
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#fef3c7 0%,#fff7ed 50%,#ecfdf5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "'Noto Sans Tamil', sans-serif",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <button
          onClick={toggleLang}
          style={{
            ...btnStyle("rgba(255,255,255,0.9)", "#d97706"),
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 13,
            minHeight: 36,
            border: "1px solid #fde68a",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          🌐 {lang === "ta" ? "English" : "தமிழ்"}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: "32px 24px",
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🪙</div>
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: 26,
              fontWeight: 800,
              background: "linear-gradient(135deg,#d97706,#065f46)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("appTitle")}
          </h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
            {t("appSubtitle")}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {type === "register" && (
            <div>
              <label style={labelStyle}>{t("fullName")}</label>
              <input
                style={inputStyle}
                placeholder={lang === "ta" ? "உங்கள் பெயர்" : "Your Name"}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>{t("emailLabel")}</label>
            <input
              style={inputStyle}
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>{t("password")}</label>
            <div style={{ position: "relative" }}>
              <input
                style={inputStyle}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handle()}
              />
              <button
                onClick={() => setShowPw((p) => !p)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  fontSize: 18,
                  minHeight: 36,
                  padding: "0 6px",
                }}
              >
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          {type === "register" && (
            <div>
              <label style={labelStyle}>{t("confirmPassword")}</label>
              <input
                style={inputStyle}
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
              />
            </div>
          )}

          {err && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                padding: "10px 14px",
                color: "#dc2626",
                fontSize: 13,
              }}
            >
              {err}
            </div>
          )}

          <button
            onClick={handle}
            style={{
              ...btnStyle("linear-gradient(135deg,#d97706,#065f46)", "#fff"),
              width: "100%",
              padding: "12px 20px",
              fontSize: 15,
              borderRadius: 12,
              marginTop: 4,
            }}
          >
            {type === "register" ? t("register") : t("login")}
          </button>

          <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: 13, color: "#6b7280" }}>
            {type === "register" ? t("alreadyHaveAccount") : t("dontHaveAccount")}
            <button
              onClick={onSwitch}
              style={{
                background: "none",
                border: "none",
                color: "#d97706",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "'Noto Sans Tamil', sans-serif",
                minHeight: 36,
                padding: "4px 8px",
              }}
            >
              {type === "register" ? t("login") : t("register")}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main App Component ─────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("moi_loggedIn"));
    } catch {
      return null;
    }
  });

  // Language state (default: Tamil 'ta')
  const [lang, setLang] = useState(() => localStorage.getItem("moi_lang") || "ta");

  const toggleLang = () => {
    const nextLang = lang === "ta" ? "en" : "ta";
    setLang(nextLang);
    localStorage.setItem("moi_lang", nextLang);
  };

  const t = (key) => (translations[lang] && translations[lang][key]) || translations.ta[key] || key;

  const [authMode, setAuthMode] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [cashRecords, setCashRecords] = useState([]);
  const [goldRecords, setGoldRecords] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toast = (msg, type = "success") => {
    const id = uid();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3200);
  };

  useEffect(() => {
    if (user) {
      const fetchRecords = async () => {
        setLoading(true);
        try {
          const records = await api.getRecords();
          setCashRecords(records.filter((r) => r.mode === "cash"));
          setGoldRecords(records.filter((r) => r.mode === "gold"));
        } catch (error) {
          toast(error.message || "Error fetching records!", "error");
        } finally {
          setLoading(false);
        }
      };
      fetchRecords();
    } else {
      setCashRecords([]);
      setGoldRecords([]);
    }
  }, [user]);

  const appContextValue = {
    user,
    setUser,
    page,
    setPage,
    cashRecords,
    goldRecords,
    setCashRecords,
    setGoldRecords,
    toast,
    lang,
    setLang,
    toggleLang,
    t,
    convertDataText,
  };

  if (!user)
    return (
      <AppContext.Provider value={appContextValue}>
        <AuthPage
          type={authMode}
          onSwitch={() => setAuthMode((p) => (p === "login" ? "register" : "login"))}
          onLogin={(u) => {
            localStorage.setItem("moi_loggedIn", JSON.stringify(u));
            setUser(u);
            setPage("dashboard");
          }}
        />
      </AppContext.Provider>
    );

  const navItems = [
    { key: "dashboard", label: t("dashboard"), icon: "🏠" },
    { key: "cash", label: t("cashMoi"), icon: "💵" },
    { key: "gold", label: t("goldMoi"), icon: "🥇" },
    { key: "profile", label: t("profile"), icon: "👤" },
  ];

  const titles = {
    dashboard: t("dashboard"),
    cash: t("cashMoi"),
    gold: t("goldMoi"),
    profile: t("profile"),
  };

  const Sidebar = ({ mobile }) => (
    <div
      style={{
        width: mobile ? "100%" : 220,
        background: "linear-gradient(180deg,#1c1917 0%,#292524 100%)",
        height: mobile ? "auto" : "100vh",
        display: "flex",
        flexDirection: "column",
        padding: mobile ? "16px 0" : "28px 0",
        flexShrink: 0,
      }}
    >
      {!mobile && (
        <div
          style={{ padding: "0 20px 24px", borderBottom: "1px solid #44403c" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>🪙</span>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  color: "#fbbf24",
                  fontFamily: "'Noto Sans Tamil', sans-serif",
                }}
              >
                {t("appTitle")}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#78716c",
                  fontFamily: "'Noto Sans Tamil', sans-serif",
                }}
              >
                {t("appSubtitle")}
              </div>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          flex: 1,
          padding: "12px 12px 0",
          display: "flex",
          flexDirection: mobile ? "row" : "column",
          flexWrap: mobile ? "wrap" : "nowrap",
          gap: 4,
        }}
      >
        {navItems.map((n) => (
          <button
            key={n.key}
            onClick={() => {
              setPage(n.key);
              setSidebarOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 10,
              background:
                page === n.key
                  ? "linear-gradient(135deg,#d97706,#92400e)"
                  : "transparent",
              border: "none",
              cursor: "pointer",
              color: page === n.key ? "#fff" : "#a8a29e",
              fontFamily: "'Noto Sans Tamil', sans-serif",
              fontSize: 13,
              fontWeight: page === n.key ? 700 : 400,
              width: mobile ? "auto" : "100%",
              textAlign: "left",
              flex: mobile ? 1 : "unset",
              minHeight: 44,
            }}
          >
            <span style={{ fontSize: 16 }}>{n.icon}</span> {n.label}
          </button>
        ))}
      </div>

      {/* Language Switch Button in Sidebar */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #44403c" }}>
        <button
          onClick={toggleLang}
          style={{
            ...btnStyle("#292524", "#fbbf24"),
            width: "100%",
            border: "1px solid #78350f",
            fontSize: 13,
            padding: "8px 12px",
            borderRadius: 8,
            minHeight: 38,
          }}
        >
          🌐 {lang === "ta" ? "English Mode" : "தமிழ் முறை"}
        </button>
      </div>

      {!mobile && (
        <div style={{ padding: "16px 20px", borderTop: "1px solid #44403c" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#d97706,#92400e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {user.name
                ?.split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#e7e5e4",
                  fontFamily: "'Noto Sans Tamil', sans-serif",
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name}
              </div>
              <div style={{ fontSize: 11, color: "#78716c", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AppContext.Provider value={appContextValue}>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          fontFamily: "'Noto Sans Tamil', sans-serif",
          background: "#f8fafc",
        }}
      >
        {/* Desktop Sidebar */}
        <div className="desktop-sidebar">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay (Drawer) */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 950,
              }}
              onClick={() => setSidebarOpen(false)}
            >
              <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{ background: "#1c1917" }}
              >
                <Sidebar mobile />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content container */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Top bar */}
          <div
            style={{
              background: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              position: "sticky",
              top: 0,
              zIndex: 100,
            }}
          >
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen((p) => !p)}
              style={{
                background: "none",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                color: "#374151",
                minHeight: 40,
                padding: "0 6px",
              }}
            >
              ☰
            </button>
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {titles[page]}
              </h1>
            </div>

            {/* Header Language Switcher Badge */}
            <button
              onClick={toggleLang}
              style={{
                background: "#fef3c7",
                border: "1px solid #fde68a",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 700,
                color: "#b45309",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                minHeight: 36,
              }}
            >
              🌐 {t("langSwitch")}
            </button>

            <div style={{ fontSize: 22 }}>🪙</div>
          </div>

          {/* Page content */}
          <div
            className="page-container"
            style={{
              flex: 1,
              padding: "24px 20px",
              maxWidth: 960,
              width: "100%",
              margin: "0 auto",
              boxSizing: "border-box",
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "200px",
                  fontSize: "16px",
                  color: "#6b7280",
                  fontFamily: "'Noto Sans Tamil', sans-serif",
                }}
              >
                {t("loading")}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {page === "dashboard" && <Dashboard />}
                  {page === "cash" && <Section mode="cash" />}
                  {page === "gold" && <Section mode="gold" />}
                  {page === "profile" && <Profile />}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav className="bottom-nav-bar" aria-label="Mobile Navigation">
        {navItems.map((n) => {
          const active = page === n.key;
          return (
            <button
              key={n.key}
              onClick={() => {
                setPage(n.key);
                setSidebarOpen(false);
              }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: 48,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px 0",
                color: active ? "#d97706" : "#64748b",
                position: "relative",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {active && (
                <motion.div
                  layoutId="activeTabPill"
                  style={{
                    position: "absolute",
                    top: 2,
                    width: 28,
                    height: 3,
                    borderRadius: 3,
                    background: "linear-gradient(90deg, #d97706, #f59e0b)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.span
                animate={{ scale: active ? 1.15 : 1, y: active ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={{ fontSize: 22, lineHeight: 1 }}
              >
                {n.icon}
              </motion.span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  fontFamily: "'Noto Sans Tamil', sans-serif",
                  marginTop: 3,
                  lineHeight: 1.1,
                }}
              >
                {n.label}
              </span>
            </button>
          );
        })}
      </nav>

      <Toast toasts={toasts} />
    </AppContext.Provider>
  );
}
