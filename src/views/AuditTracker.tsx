import { useState } from "react";
import type { CSSProperties } from "react";
import { Plus, ChevronDown, ChevronRight, Download, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Pill } from "../components/Pill";
import { CompletedProjectPill } from "../components/Badges";
import { AuditItemModal } from "../components/AuditItemModal";
import { FOCUS } from "../constants/colors";
import { PRINCIPLES } from "../constants/wcag";
import { auditStatusColor, severityColor, severityLabel } from "../utils/audit";
import { downloadAuditCsv } from "../utils/auditCsv";
import { cx } from "../utils/cx";
import type { AuditItem, AuditPage, Project } from "../types";
import styles from "./AuditTracker.module.scss";

type Props = {
  audit: AuditItem[];
  auditPages: AuditPage[];
  projects: Project[];
  onAddPage: (projectId: number, title: string, url: string) => void;
  onUpdatePage: (pageId: string, patch: { title?: string; url?: string }) => void;
  onDeletePage: (pageId: string) => void;
  onUpdateItem: (item: AuditItem) => void;
  expanded: number | null;
  setExpanded: (id: number | null) => void;
};

type AddDraft = { title: string; url: string };
type EditDraft = { title: string; url: string };

export const AuditTracker = ({
  audit, auditPages, projects, onAddPage, onUpdatePage, onDeletePage, onUpdateItem, expanded, setExpanded,
}: Props) => {
  const [openPrinciples, setOpenPrinciples] = useState<Record<string, boolean>>({});
  const [openPages, setOpenPages] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingFor, setAddingFor] = useState<number | null>(null);
  const [addDraft, setAddDraft] = useState<AddDraft>({ title: "", url: "" });
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({ title: "", url: "" });

  const selectedItem = audit.find((a) => a.id === selectedId) || null;

  const togglePrinciple = (key: string) =>
    setOpenPrinciples((o) => ({ ...o, [key]: !o[key] }));
  const togglePage = (pageId: string) =>
    setOpenPages((o) => ({ ...o, [pageId]: !o[pageId] }));

  const submitAdd = (projectId: number) => {
    const title = addDraft.title.trim();
    if (!title) return;
    onAddPage(projectId, title, addDraft.url.trim());
    setAddingFor(null);
    setAddDraft({ title: "", url: "" });
  };

  const startEdit = (page: AuditPage) => {
    setEditingPageId(page.id);
    setEditDraft({ title: page.title, url: page.url });
  };

  const submitEdit = (pageId: string) => {
    const title = editDraft.title.trim();
    if (!title) return;
    onUpdatePage(pageId, { title, url: editDraft.url.trim() });
    setEditingPageId(null);
  };

  const confirmAndDelete = (page: AuditPage) => {
    const ok = window.confirm(
      `Seite "${page.title}" und alle zugehörigen Audit-Kriterien wirklich löschen?`,
    );
    if (ok) onDeletePage(page.id);
  };

  return (
    <div>
      <h1 className={cx(styles.h1, "aorg-h1")}>Audit-Tracker</h1>

      {projects.map((p) => {
        const projectItems = audit.filter((a) => a.project === p.id);
        const projectPages = auditPages.filter((pg) => pg.project === p.id);
        const isOpen = expanded === p.id;
        const doneCount = projectItems.filter((i) => i.status === "erfüllt").length;
        const severeOpen = projectItems.filter(
          (i) => (i.severity === "kritisch" || i.severity === "schwerwiegend") && i.status !== "erfüllt",
        ).length;
        const isAdding = addingFor === p.id;

        return (
          <div key={p.id} className={styles.projectBlock}>
            <button onClick={() => setExpanded(isOpen ? null : p.id)} className={styles.projectHeader}>
              {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              {p.name}
              <CompletedProjectPill project={p} />
              {projectPages.length > 0 ? (
                <span className={styles.projectMeta}>
                  ({projectPages.length} Seite{projectPages.length === 1 ? "" : "n"}
                  {projectItems.length > 0 ? ` · ${doneCount}/${projectItems.length} erfüllt` : ""}
                  {severeOpen > 0 ? ` · ${severeOpen} schwer offen` : ""})
                </span>
              ) : (
                <span className={styles.projectMeta}>(kein Audit gestartet)</span>
              )}
            </button>

            {isOpen && (
              <div className={styles.projectBody}>
                <div className={styles.pages}>
                  {projectPages.map((page) => {
                    const pageItems = projectItems.filter((i) => i.page === page.id);
                    const pageDone = pageItems.filter((i) => i.status === "erfüllt").length;
                    const pageSevere = pageItems.filter(
                      (i) => (i.severity === "kritisch" || i.severity === "schwerwiegend") && i.status !== "erfüllt",
                    ).length;
                    const pageOpen = openPages[page.id] ?? false;
                    const isEditing = editingPageId === page.id;

                    return (
                      <div key={page.id} className={styles.pageBlock}>
                        {isEditing ? (
                          <div className={styles.pageForm}>
                            <input
                              autoFocus
                              value={editDraft.title}
                              onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                              placeholder="Seitentitel (z. B. Warenkorb)"
                              className={styles.pageInput}
                            />
                            <input
                              value={editDraft.url}
                              onChange={(e) => setEditDraft((d) => ({ ...d, url: e.target.value }))}
                              placeholder="URL (optional)"
                              className={styles.pageInput}
                              type="url"
                            />
                            <button onClick={() => submitEdit(page.id)} className={styles.btnPrimary}>Speichern</button>
                            <button onClick={() => setEditingPageId(null)} className={styles.btnGhost}>Abbrechen</button>
                          </div>
                        ) : (
                          <div className={styles.pageHeaderRow}>
                            <button onClick={() => togglePage(page.id)} className={styles.pageHeader}>
                              {pageOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              <span className={styles.pageTitle}>{page.title}</span>
                              {page.url && (
                                <a
                                  href={page.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className={styles.pageUrl}
                                  title={page.url}
                                >
                                  <ExternalLink size={13} /> {page.url.replace(/^https?:\/\//, "")}
                                </a>
                              )}
                              <span className={styles.pageMeta}>
                                {pageDone}/{pageItems.length} erfüllt
                                {pageSevere > 0 ? ` · ${pageSevere} schwer offen` : ""}
                              </span>
                            </button>
                            <div className={styles.pageActions}>
                              <button
                                onClick={() => downloadAuditCsv(pageItems, p, page)}
                                title="Diese Seite als CSV exportieren"
                                aria-label="CSV-Export"
                                className={styles.iconBtn}
                              >
                                <Download size={13} />
                              </button>
                              <button
                                onClick={() => startEdit(page)}
                                title="Seite bearbeiten"
                                aria-label="Seite bearbeiten"
                                className={styles.iconBtn}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => confirmAndDelete(page)}
                                title="Seite löschen"
                                aria-label="Seite löschen"
                                className={cx(styles.iconBtn, styles.iconBtnDanger)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )}

                        {pageOpen && !isEditing && (
                          <div className={styles.principles}>
                            {PRINCIPLES.map((principle) => {
                              const prItems = pageItems.filter((i) => i.principle === principle);
                              if (!prItems.length) return null;
                              const key = `${page.id}-${principle}`;
                              const prOpen = openPrinciples[key] ?? false;
                              const prDone = prItems.filter((i) => i.status === "erfüllt").length;
                              return (
                                <div key={key}>
                                  <button onClick={() => togglePrinciple(key)} className={styles.principleHeader}>
                                    {prOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                    {principle}
                                    <span className={styles.principleCount}>
                                      ({prDone}/{prItems.length})
                                    </span>
                                  </button>
                                  {prOpen && (
                                    <div className={styles.items}>
                                      {prItems.map((a) => (
                                        <button
                                          key={a.id}
                                          onClick={() => setSelectedId(a.id)}
                                          className={styles.item}
                                        >
                                          <Pill color={FOCUS}>{a.code}</Pill>
                                          <span className={styles.itemName}>{a.name}</span>
                                          {a.severity && (
                                            <Pill color={severityColor(a.severity)}>{severityLabel(a.severity)}</Pill>
                                          )}
                                          <span className={styles.itemLevel}>{a.level}</span>
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
                    );
                  })}

                  {isAdding ? (
                    <div className={styles.pageForm}>
                      <input
                        autoFocus
                        value={addDraft.title}
                        onChange={(e) => setAddDraft((d) => ({ ...d, title: e.target.value }))}
                        placeholder="Seitentitel (z. B. Warenkorb)"
                        className={styles.pageInput}
                      />
                      <input
                        value={addDraft.url}
                        onChange={(e) => setAddDraft((d) => ({ ...d, url: e.target.value }))}
                        placeholder="URL (optional, z. B. https://…)"
                        className={styles.pageInput}
                        type="url"
                      />
                      <button onClick={() => submitAdd(p.id)} className={styles.btnPrimary}>Anlegen</button>
                      <button
                        onClick={() => { setAddingFor(null); setAddDraft({ title: "", url: "" }); }}
                        className={styles.btnGhost}
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingFor(p.id)}
                      className={styles.btnAddPage}
                    >
                      <Plus size={13} /> Neue Seite auditieren
                    </button>
                  )}
                </div>
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
