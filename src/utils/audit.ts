import { WCAG_TEMPLATE } from "../constants/wcag";
import { PASS, FAIL, FOCUS, SLATE } from "../constants/colors";
import type { AuditItem, AuditOverride, AuditStatus } from "../types";

export const auditStatusColor = (s: AuditStatus): string =>
  s === "erfüllt" ? PASS : s === "nicht erfüllt" ? FAIL : s === "wird geprüft" ? FOCUS : SLATE;

// Legt für ein Mandat den vollständigen WCAG-A/AA-Kriterienkatalog an.
// overrides: { "1.4.3": { status: "...", critical: true, note: "...", codeExample: "..." } }
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
    critical: false,
    note: "",
    codeExample: "",
    ...(overrides[c.code] || {}),
  }));
