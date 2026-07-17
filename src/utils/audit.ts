import { WCAG_TEMPLATE, SEVERITY_LABEL } from "../constants/wcag";
import { PASS, FAIL, FOCUS, SLATE, AMBER } from "../constants/colors";
import type { AuditItem, AuditOverride, AuditPage, AuditStatus, Severity } from "../types";

export const defaultPageId = (projectId: number): string => `${projectId}-default`;

// Erzeugt für jede Page-Referenz aus items, für die es kein AuditPage-Doc gibt,
// eine Default-Page "Startseite" (ohne URL). Legacy-Audits ohne page-Feld werden
// so nachträglich unter einer echten Page angesiedelt.
export const ensureDefaultPages = (
  items: AuditItem[],
  pages: AuditPage[],
): AuditPage[] => {
  const known = new Set(pages.map((p) => p.id));
  const missing = new Map<string, AuditPage>();
  for (const it of items) {
    if (!it.page || known.has(it.page) || missing.has(it.page)) continue;
    missing.set(it.page, {
      id: it.page,
      project: it.project,
      title: it.page === defaultPageId(it.project) ? "Startseite" : "Seite",
      url: "",
    });
  }
  return missing.size ? [...pages, ...missing.values()] : pages;
};

export const auditStatusColor = (s: AuditStatus): string =>
  s === "erfüllt" ? PASS
  : s === "teilweise erfüllt" ? AMBER
  : s === "nicht erfüllt" ? FAIL
  : s === "wird geprüft" ? FOCUS
  : SLATE;

export const severityColor = (s: Severity | null): string => {
  switch (s) {
    case "kritisch": return FAIL;
    case "schwerwiegend": return AMBER;
    case "moderat": return SLATE;
    case "gering": return SLATE;
    default: return SLATE;
  }
};

export const severityLabel = (s: Severity | null): string =>
  s ? SEVERITY_LABEL[s] : "";

const STATUSES: AuditStatus[] = [
  "wird geprüft", "erfüllt", "teilweise erfüllt", "nicht erfüllt", "nicht anwendbar",
];
const SEVERITY_VALUES: Severity[] = ["kritisch", "schwerwiegend", "moderat", "gering"];

// Runtime-Migration alter Firestore-Docs: `critical: boolean` → `severity: Severity | null`,
// fehlendes `page` → Default-Page pro Projekt. Whitelist-Prüfung für status/severity.
export const migrateAuditItem = (raw: unknown): AuditItem => {
  const r = raw as Record<string, unknown>;
  const status: AuditStatus = STATUSES.includes(r.status as AuditStatus)
    ? (r.status as AuditStatus)
    : "wird geprüft";
  let severity: Severity | null = null;
  if (SEVERITY_VALUES.includes(r.severity as Severity)) {
    severity = r.severity as Severity;
  } else if (r.critical === true) {
    severity = "kritisch";
  }
  const project = Number(r.project ?? 0);
  const page = typeof r.page === "string" && r.page ? r.page : defaultPageId(project);
  return {
    id: String(r.id ?? ""),
    project,
    page,
    code: String(r.code ?? ""),
    name: String(r.name ?? ""),
    level: r.level === "AA" ? "AA" : "A",
    principle: r.principle as AuditItem["principle"],
    guideline: String(r.guideline ?? ""),
    status,
    severity,
    note: String(r.note ?? ""),
    codeExample: String(r.codeExample ?? ""),
    recommendation: String(r.recommendation ?? ""),
  };
};

export const makeAudit = (
  pageId: string,
  projectId: number,
  overrides: Record<string, AuditOverride> = {},
): AuditItem[] =>
  WCAG_TEMPLATE.map((c) => ({
    id: `${pageId}::${c.code}`,
    project: projectId,
    page: pageId,
    code: c.code,
    name: c.name,
    level: c.level,
    principle: c.principle,
    guideline: c.guideline,
    status: "wird geprüft",
    severity: null,
    note: "",
    codeExample: "",
    recommendation: "",
    ...(overrides[c.code] || {}),
  }));
