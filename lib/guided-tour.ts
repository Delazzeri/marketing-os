// Shared between the sign-in action (sets it) and the workspace layout
// (reads it). Lives outside lib/actions because "use server" files may only
// export async functions.
export const GUIDED_TOUR_COOKIE = "guided_tour";

// sessionStorage key holding the tour's current step. Cleared on every login
// submit so a new login always starts the tour from the beginning.
export const GUIDED_TOUR_STEP_KEY = "guided-tour:step";

export type GuidedTourAnchor =
  | "sidebar-boards"
  | "sign-out"
  | "view-tabs"
  | "group-header"
  | "item-title"
  | "status-cell"
  | "new-item"
  | "portal";
