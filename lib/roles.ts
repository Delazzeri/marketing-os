// Shared role labels/types for workspace_members.role. Centralized here to
// replace the duplicated ROLE_LABELS that used to live separately in
// TeamPanel.tsx and BoardHeader.tsx.
export type WorkspaceRole = "owner" | "coordinator" | "member" | "viewer";

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Admin",
  coordinator: "Coordenador",
  member: "Membro",
  viewer: "Visualizador",
};

// Roles that map to InvitePersonModal's role selector — "owner" is legacy
// and never assigned via invite anymore.
export const ASSIGNABLE_ROLES: readonly WorkspaceRole[] = ["coordinator", "member", "viewer"];

export function canManageTeam(role: WorkspaceRole | null, isAdmin: boolean): boolean {
  return isAdmin || role === "owner" || role === "coordinator";
}

export function canWrite(role: WorkspaceRole | null, isAdmin: boolean): boolean {
  return isAdmin || role === "owner" || role === "coordinator" || role === "member";
}
