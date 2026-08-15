export type { WorkspaceMemberSummary as WorkspaceMember } from "@/lib/column-types/person";

export interface ItemUpdate {
  id: number;
  itemId: number;
  authorId: string | null;
  body: string;
  mentionedUserIds: string[];
  createdAt: string;
}

export interface ItemAttachment {
  id: number;
  itemId: number;
  fileUrl: string;
  fileName: string;
  uploadedBy: string | null;
  createdAt: string;
}

export interface NotificationPayload {
  boardId: number;
  itemId: number;
  itemTitle: string;
  workspaceSlug: string;
}

export interface AppNotification {
  id: number;
  userId: string;
  type: string;
  payload: NotificationPayload;
  read: boolean;
  createdAt: string;
}

export type AutomationTriggerType = "status_changed" | "due_date_passed" | "item_created";
export type AutomationActionType =
  | "notify_assignee"
  | "mark_overdue"
  | "show_in_portal_update"
  | "set_default_assignee";

export interface Automation {
  id: number;
  boardId: number;
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
  actionType: AutomationActionType;
  actionConfig: Record<string, unknown>;
  enabled: boolean;
}

export interface PortalToken {
  id: number;
  boardId: number;
  token: string;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}
