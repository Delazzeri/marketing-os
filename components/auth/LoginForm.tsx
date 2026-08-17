"use client";

import { useActionState, useState } from "react";
import { signIn, type SignInState } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

const initialState: SignInState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground">
          MOS
        </div>
        <span className="text-sm font-medium">Marketing OS</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">
          Faça seu Login<span className="text-primary">.</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Entre para acompanhar seus quadros e o calendário editorial.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="login-email"
            name="email"
            type="email"
            placeholder="voce@email.com"
            required
            className="h-11 rounded-lg px-3.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-password" className="text-sm font-medium">
            Senha
          </label>
          <div className="relative">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              className="h-11 rounded-lg px-3.5 pr-10 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="text-right">
            {/* Non-functional for now — no recovery flow exists yet. */}
            <span className="cursor-not-allowed text-xs text-muted-foreground underline underline-offset-2">
              Esqueci minha senha
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-1 h-11 w-full rounded-lg bg-gradient-to-r from-primary via-accent to-[#c98b5e] text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <p className="text-center text-xs text-muted-foreground">
          {/* Non-functional for now — no signup flow exists yet. */}
          <span className="cursor-not-allowed underline underline-offset-2">Ainda não tenho uma conta</span>
        </p>
      </form>
    </div>
  );
}
