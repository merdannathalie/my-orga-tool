// Farb-Tokens als CSS-Variablen-Referenzen — werden nur noch dort in JS gebraucht,
// wo Lucide-Icons oder dynamische CSS-Custom-Properties Farbe brauchen. Statisches
// Styling passiert über die .module.scss-Dateien.

export const INK = "var(--c-ink)";
export const PAPER = "var(--c-paper)";
export const SLATE = "var(--c-slate)";
export const PASS = "var(--c-pass)";
export const FAIL = "var(--c-fail)";
export const AMBER = "var(--c-amber)";
export const FOCUS = "var(--c-focus)";
export const CARD = "var(--c-card)";
export const BORDER = "var(--c-border)";
// Textfarbe auf Akzent-Buttons (FOCUS/FAIL-Hintergrund) — bewusst von PAPER entkoppelt.
export const ON_ACCENT = "var(--c-on-accent)";

// Sidebar-Farben sind Branding-fest und nicht Teil des Theme-Umschaltens.
export const SIDEBAR_BG = "linear-gradient(165deg, #5A3468 0%, #2E2438 65%)";
export const LANE_BG = "var(--c-lane-bg)";
export const SELECTED_BG = "var(--c-selected-bg)";
export const NOTE_BG = "var(--c-note-bg)";
export const CODE_BG = "var(--c-code-bg)";
export const CODE_TEXT = "var(--c-code-text)";
export const INPUT_BG = "var(--c-input-bg)";
