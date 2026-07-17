import { WCAG_TEMPLATE, SEVERITY_LABEL } from "../constants/wcag";
import { PASS, FAIL, FOCUS, SLATE, AMBER } from "../constants/colors";
import type { AuditItem, AuditOverride, AuditStatus, Severity } from "../types";

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
// `recommendation` als Default "". Whitelist-Prüfung für status/severity.
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
  return {
    id: String(r.id ?? ""),
    project: Number(r.project ?? 0),
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
  projectId: number,
  overrides: Record<string, AuditOverride> = {},
): AuditItem[] =>
  WCAG_TEMPLATE.map((c) => ({
    id: `${projectId}-${c.code}`,
    project: projectId,
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
