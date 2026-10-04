import * as XLSX from "xlsx";
import { convertDataText } from "./i18n";

export function exportRecordsToExcel(records, mode = "cash", lang = "ta") {
  if (!records || records.length === 0) {
    alert(lang === "ta" ? "பதிவிறக்கம் செய்ய பதிவுகள் இல்லை!" : "No records to export!");
    return;
  }

  const isTa = lang === "ta";

  // Map data to clean excel rows
  const dataRows = records.map((r, index) => {
    let typeText = "";
    if (r.type === "received") {
      typeText = isTa ? "உறவினர் கொடுத்தது" : "Received Gift";
    } else if (r.type === "given") {
      typeText = isTa ? "நாம் கொடுத்தது" : "Given Gift";
    } else {
      typeText = isTa ? "முடிந்தவை" : "Completed";
    }

    const value = mode === "cash" 
      ? `₹ ${Number(r.amount || 0).toLocaleString(isTa ? "ta-IN" : "en-IN")}`
      : `${r.grams} g`;

    const formattedDate = r.date
      ? new Date(r.date).toLocaleDateString(isTa ? "ta-IN" : "en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

    return {
      [isTa ? "வரிசை எண்" : "S.No"]: index + 1,
      [isTa ? "உறவினர் பெயர்" : "Relative Name"]: convertDataText(r.relativeName, lang),
      [isTa ? "நகரம்" : "City"]: r.city ? convertDataText(r.city, lang) : "—",
      [isTa ? "வகை" : "Type"]: typeText,
      [mode === "cash" ? (isTa ? "தொகை (₹)" : "Amount (₹)") : (isTa ? "தங்கம் (கிராம்)" : "Gold (Grams)")]: value,
      [isTa ? "நிகழ்வு" : "Event Name"]: r.eventName ? convertDataText(r.eventName, lang) : "—",
      [isTa ? "தேதி" : "Date"]: formattedDate,
      [isTa ? "குறிப்புகள்" : "Notes"]: r.notes ? convertDataText(r.notes, lang) : "—",
    };
  });

  // Create sheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  
  // Set auto column widths
  const colWidths = Object.keys(dataRows[0] || {}).map((key) => ({
    wch: Math.max(key.length + 5, 18),
  }));
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  const sheetName = isTa 
    ? (mode === "cash" ? "ரொக்க மொய்" : "தங்க மொய்")
    : (mode === "cash" ? "Cash Moi" : "Gold Moi");

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate file name with current date
  const today = new Date().toISOString().split("T")[0];
  const filename = `Moi_Records_${mode}_${lang}_${today}.xlsx`;

  // Download
  XLSX.writeFile(workbook, filename);
}
