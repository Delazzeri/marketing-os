"use client";

import { useActionState, useState } from "react";
import { signIn, type SignInState } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

const initialState: SignInState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Marketing OS</h1>
        <p className="text-sm text-muted-foreground">Entre para acessar seus boards.</p>
      </div>

      <form action={formAction} className="flex flex-col gap-3">
        <div className="rounded-lg bg-gradient-to-br from-primary/60 via-accent/40 to-primary/60 p-px">
          <Input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="rounded-[calc(var(--radius-lg)-1px)] border-0 bg-popover"
          />
        </div>

        <div className="relative rounded-lg bg-gradient-to-br from-primary/60 via-accent/40 to-primary/60 p-px">
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Senha"
            required
            className="rounded-[calc(var(--radius-lg)-1px)] border-0 bg-popover pr-9"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <Button type="submit" disabled={pending} className="mt-1">
          {pending ? "Entrando..." : "Entrar"}
        </Button>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          {/* Non-functional for now — no signup/recovery flow exists yet. */}
          <span className="cursor-not-allowed opacity-60">Esqueci minha senha</span>
          <span className="cursor-not-allowed opacity-60">Ainda não tenho conta</span>
        </div>
      </form>
    </div>
  );
}
