// Minimaler classnames-Helper: kettet Klassen, filtert falsy Werte raus.
// cx("a", cond && "b", other ? "c" : null)  →  "a c"  wenn cond=false, other truthy.
type Cls = string | false | null | undefined;

export const cx = (...classes: Cls[]): string =>
  classes.filter(Boolean).join(" ");
