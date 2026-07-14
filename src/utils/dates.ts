// Wandelt zwischen dem deutschen Anzeigeformat (TT.MM.JJJJ) und dem ISO-Format
// (JJJJ-MM-TT) um, das native <input type="date">-Felder für Wert/Picker brauchen.
export const deToISO = (deStr: string): string => {
  if (!deStr) return "";
  const parts = deStr.split(".");
  if (parts.length !== 3) return "";
  const [d, m, y] = parts;
  if (!d || !m || !y) return "";
  return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};

export const isoToDE = (isoStr: string): string => {
  if (!isoStr) return "";
  const parts = isoStr.split("-");
  if (parts.length !== 3) return "";
  const [y, m, d] = parts;
  if (!y || !m || !d) return "";
  return `${d}.${m}.${y}`;
};

export const parseGermanDate = (str: string): number | null => {
  if (!str) return null;
  const parts = str.split(".").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [d, m, y] = parts;
  return new Date(y, m - 1, d).getTime();
};

export const parseGermanDateTime = (dateStr: string, timeStr: string): number | null => {
  const d = parseGermanDate(dateStr);
  if (d == null) return null;
  const [h, m] = (timeStr || "00:00").split(":").map(Number);
  return d + (h || 0) * 3600000 + (m || 0) * 60000;
};

export const formatDEDate = (d: Date): string =>
  d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
