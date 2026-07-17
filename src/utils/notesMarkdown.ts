import { slugify } from "./slug";
import type { Note, Project } from "../types";

const toIsoDate = (deDate: string): string => {
  const parts = deDate.split(".");
  if (parts.length !== 3) return todayIso();
  const [d, m, y] = parts;
  if (!d || !m || !y) return todayIso();
  return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};

const todayIso = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const noteFilename = (note: Note): string =>
  `${slugify(note.title)}-${toIsoDate(note.date)}.md`;

export const noteToMarkdown = (note: Note, project: Project | undefined): string => {
  const lines: string[] = [];
  lines.push(`# ${note.title || "Notiz"}`);
  lines.push("");

  const metaParts: string[] = [note.type];
  if (project?.name) metaParts.push(project.name);
  metaParts.push(note.date);
  lines.push(`_${metaParts.join(" · ")}_`);
  lines.push("");

  if (note.participants.trim()) {
    lines.push(`**Teilnehmer:innen:** ${note.participants.trim()}`);
    lines.push("");
  }

  const section = (heading: string, body: string) => {
    if (!body.trim()) return;
    lines.push(`## ${heading}`);
    lines.push("");
    lines.push(body.trim());
    lines.push("");
  };

  section("Protokoll", note.protocol);
  section("Offene Punkte", note.openPoints);
  section("Next Steps", note.nextSteps);

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
};

export const downloadMarkdown = (note: Note, project: Project | undefined): void => {
  const md = noteToMarkdown(note, project);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = noteFilename(note);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
