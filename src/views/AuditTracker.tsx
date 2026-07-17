import { useState } from "react";
import type { CSSProperties } from "react";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Pill } from "../components/Pill";
import { CompletedProjectPill } from "../components/Badges";
import { AuditItemModal } from "../components/AuditItemModal";
import { FAIL, FOCUS } from "../constants/colors";
import { PRINCIPLES } from "../constants/wcag";
import { auditStatusColor } from "../utils/audit";
import { cx } from "../utils/cx";
import type { AuditItem, Project } from "../types";
import styles from "./AuditTracker.module.scss";

type Props = {
  audit: AuditItem[];
  projects: Project[];
  onStartAudit: (projectId: number) => void;
  onUpdateItem: (item: AuditItem) => void;
  expanded: number | null;
  setExpanded: (id: number | null) => void;
};

export const AuditTracker = ({
  audit, projects, onStartAudit, onUpdateItem, expanded, setExpanded,
}: Props) => {
  const [openPrinciples, setOpenPrinciples] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedItem = audit.find((a) => a.id === selectedId) || null;

  const togglePrinciple = (key: string) =>
    setOpenPrinciples((o) => ({ ...o, [key]: !o[key] }));

  return (
    <div>
      <h1 className={cx(styles.h1, "aorg-h1")}>Audit-Tracker</h1>

      {projects.map((p) => {
        const items = audit.filter((a) => a.project === p.id);
        const isOpen = expanded === p.id;
        const doneCount = items.filter((i) => i.status === "erfüllt").length;
        const criticalOpen = items.filter((i) => i.severity === "kritisch" && i.status !== "erfüllt").length;

        return (
          <div key={p.id} className={styles.projectBlock}>
            <button onClick={() => setExpanded(isOpen ? null : p.id)} className={styles.projectHeader}>
              {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              {p.name}
              <CompletedProjectPill project={p} />
              {items.length > 0 ? (
                <span className={styles.projectMeta}>
                  ({doneCount}/{items.length} erfüllt{criticalOpen > 0 ? ` · ${criticalOpen} kritisch offen` : ""})
                </span>
              ) : (
                <span className={styles.projectMeta}>(kein Audit gestartet)</span>
              )}
            </button>

            {isOpen && (
              <div className={styles.projectBody}>
                {items.length === 0 ? (
                  <div className={styles.emptyBody}>
                    <p className={styles.emptyText}>
                      Für dieses Mandat wurde noch kein Audit gestartet. Ein Klick legt den vollständigen
                      WCAG 2.2 A/AA-Kriterienkatalog für dieses Mandat an.
                    </p>
                    <button onClick={() => onStartAudit(p.id)} className={styles.btnStart}>
                      <Plus size={13} /> Audit starten
                    </button>
                  </div>
                ) : (
                  <div className={styles.principles}>
                    {PRINCIPLES.map((principle) => {
                      const pItems = items.filter((i) => i.principle === principle);
                      if (!pItems.length) return null;
                      const key = `${p.id}-${principle}`;
                      const pOpen = openPrinciples[key] ?? false;
                      const pDone = pItems.filter((i) => i.status === "erfüllt").length;
                      return (
                        <div key={key}>
                          <button onClick={() => togglePrinciple(key)} className={styles.principleHeader}>
                            {pOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            {principle}
                            <span className={styles.principleCount}>
                              ({pDone}/{pItems.length})
                            </span>
                          </button>
                          {pOpen && (
                            <div className={styles.items}>
                              {pItems.map((a) => (
                                <button
                                  key={a.id}
                                  onClick={() => setSelectedId(a.id)}
                                  className={styles.item}
                                >
                                  <Pill color={FOCUS}>{a.code}</Pill>
                                  <span className={styles.itemName}>{a.name}</span>
                                  <span className={styles.itemLevel}>{a.level}</span>
                                  {a.severity === "kritisch" && a.status !== "erfüllt" && <Pill color={FAIL}>kritisch</Pill>}
                                  <span
                                    className={styles.itemStatus}
                                    style={{ ["--item-status-color" as string]: auditStatusColor(a.status) } as CSSProperties}
                                  >
                                    {a.status}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {selectedItem && (
        <AuditItemModal
          item={selectedItem}
          onClose={() => setSelectedId(null)}
          onSave={onUpdateItem}
        />
      )}
    </div>
  );
};
