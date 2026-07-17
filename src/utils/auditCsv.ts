import { WCAG_TEMPLATE } from "../constants/wcag";
import { slugify } from "./slug";
import { severityLabel } from "./audit";
import type { AuditItem, Project } from "../types";

export const AUDIT_CSV_COLUMNS = [
  "Nr.",
  "Kriterium",
  "Prinzip",
  "Konformitätsstufe",
  "Richtlinie",
  "Bewertung",
  "Schweregrad",
  "Anmerkung",
  "Beispiel/Nachweis",
  "Empfehlung",
] as const;

const CSV_BOM = "﻿";
const DELIM = ";";
const NEWLINE = "\r\n";

const escapeCell = (val: string): string => {
  if (val === "") return "";
  if (/[";\r\n]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
};

export const auditToCsvRow = (item: AuditItem): string[] => [
  item.code,
  item.name,
  item.principle,
  item.level,
  item.guideline,
  item.status,
  severityLabel(item.severity),
  item.note,
  item.codeExample,
  item.recommendation,
];

const templateIndex = (code: string): number => {
  const i = WCAG_TEMPLATE.findIndex((c) => c.code === code);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

const sortByTemplate = (items: AuditItem[]): AuditItem[] =>
  [...items].sort((a, b) => templateIndex(a.code) - templateIndex(b.code));

export const auditToCsv = (items: AuditItem[]): string => {
  const rows = [
    AUDIT_CSV_COLUMNS.map(escapeCell).join(DELIM),
    ...sortByTemplate(items).map((it) =>
      auditToCsvRow(it).map(escapeCell).join(DELIM),
    ),
  ];
  return CSV_BOM + rows.join(NEWLINE) + NEWLINE;
};

const todayIso = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const csvFilename = (project: Project): string =>
  `${slugify(project.name, "projekt")}-wcag-audit-${todayIso()}.csv`;

export const downloadAuditCsv = (items: AuditItem[], project: Project): void => {
  const csv = auditToCsv(items);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = csvFilename(project);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
