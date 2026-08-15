"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markAsRead(notificationId: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]", "layout");
}

export async function markAllAsRead(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw new Error(error.message);
  revalidatePath("/[workspaceSlug]", "layout");
}
