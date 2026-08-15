"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInFieldsSchema } from "@/lib/validation/auth";

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
  const { error } = await supabase.auth.signInWithPassword(fields);

  if (error) return { error: "Email ou senha incorretos." };

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
