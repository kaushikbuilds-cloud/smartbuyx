"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { markAllNotificationsRead, markNotificationRead } from "@/features/notifications/actions";
import { describeNotification, type NotificationRow } from "@/features/notifications/utils";

export function NotificationBell({
  unreadCount,
  recent,
}: {
  unreadCount: number;
  recent: NotificationRow[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border bg-card hover:bg-muted"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border bg-card p-2 shadow-lg">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 ? (
                <button
                  disabled={pending}
                  onClick={() => startTransition(async () => { await markAllNotificationsRead(); })}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              ) : null}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {recent.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
              ) : (
                <ul className="space-y-0.5">
                  {recent.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => startTransition(async () => { await markNotificationRead(n.id); })}
                        className={cn(
                          "w-full rounded-lg px-2 py-2 text-left text-xs hover:bg-muted",
                          !n.read_at && "bg-purple-50 dark:bg-purple-900/20"
                        )}
                      >
                        <p className={cn("capitalize", !n.read_at && "font-medium")}>{describeNotification(n)}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {new Date(n.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
