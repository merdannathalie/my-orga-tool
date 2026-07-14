import { Pill } from "./Pill";
import { SLATE, PASS, FAIL, FOCUS } from "../constants/colors";
import { PRIORITY_LABEL, PRIORITY_COLOR } from "../constants/nav";
import type { NoteType, Priority, Project } from "../types";

type CompletedProjectPillProps = { project: Project | undefined };
export const CompletedProjectPill = ({ project }: CompletedProjectPillProps) => {
  if (!project?.completed) return null;
  return <Pill color={SLATE}>Projekt abgeschlossen</Pill>;
};

type PriorityPillProps = { priority: Priority | undefined };
export const PriorityPill = ({ priority }: PriorityPillProps) => {
  if (!priority) return null;
  return <Pill color={PRIORITY_COLOR[priority]}>{PRIORITY_LABEL[priority]}</Pill>;
};

const NOTE_TYPE_COLOR: Record<NoteType, string> = {
  "Kunden-Call": FOCUS,
  Intern: SLATE,
  "Kick-off": PASS,
  Review: FAIL,
};

type NoteTypeBadgeProps = { type: NoteType };
export const NoteTypeBadge = ({ type }: NoteTypeBadgeProps) => (
  <Pill color={NOTE_TYPE_COLOR[type] || SLATE}>{type}</Pill>
);
