"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInFieldsSchema } from "@/lib/validation/auth";
import { GUIDED_TOUR_COOKIE } from "@/lib/guided-tour";

export type SignInState = { error?: string };

export async function signIn(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  let fields;
  try {
    fields = signInFieldsSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  } catch {
    return { error: "Confira os campos obrigatórios." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(fields);

  if (error) return { error: "Email ou senha incorretos." };

  // Accounts flagged with app_metadata.guided_tour (set only via the service
  // role, so users can't toggle it themselves) get the onboarding tour on
  // every login. The cookie is what the workspace layout checks; it's cleared
  // when the tour ends or on sign-out.
  const cookieStore = await cookies();
  if (data.user?.app_metadata?.guided_tour === true) {
    cookieStore.set(GUIDED_TOUR_COOKIE, "1", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  } else {
    cookieStore.delete(GUIDED_TOUR_COOKIE);
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(GUIDED_TOUR_COOKIE);
  redirect("/auth/login");
}

export async function endGuidedTour() {
  (await cookies()).delete(GUIDED_TOUR_COOKIE);
}
