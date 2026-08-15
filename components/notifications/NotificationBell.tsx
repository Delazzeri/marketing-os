"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markAsRead, markAllAsRead } from "@/lib/actions/notifications";
import type { AppNotification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export function NotificationBell({
  userId,
  notifications,
}: {
  userId: string;
  notifications: AppNotification[];
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleNotificationClick(notification: AppNotification, event: React.MouseEvent) {
    event.preventDefault();
    setOpen(false);
    const href = `/${notification.payload.workspaceSlug}/boards/${notification.payload.boardId}/items/${notification.payload.itemId}`;
    if (notification.read) {
      router.push(href);
      return;
    }
    startTransition(async () => {
      await markAsRead(notification.id);
      router.push(href);
    });
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className="relative"
      >
        <Bell />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-72 rounded-lg border border-border bg-popover text-popover-foreground shadow-md">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">Notificações</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => startTransition(() => markAllAsRead(userId))}
                className="text-xs text-muted-foreground hover:underline"
              >
                marcar todas como lidas
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">Nenhuma notificação.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={`/${notification.payload.workspaceSlug}/boards/${notification.payload.boardId}/items/${notification.payload.itemId}`}
                    onClick={(event) => handleNotificationClick(notification, event)}
                    className={`block px-3 py-2 text-sm hover:bg-accent ${
                      notification.read ? "text-muted-foreground" : "font-medium"
                    }`}
                  >
                    {notification.payload.itemTitle || "Item atualizado"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
