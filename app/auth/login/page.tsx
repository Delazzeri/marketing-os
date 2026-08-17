import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-1">
      <div className="flex flex-1 items-center justify-center p-8">
        <LoginForm />
      </div>

      <div className="relative hidden flex-1 overflow-hidden lg:block">
        <Image
          src="/login-hero.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-12 text-foreground">
          <p className="max-w-sm text-2xl font-semibold tracking-tight text-balance">
            Conteúdo, prazos e equipe em perfeita sintonia.
          </p>
          <p className="mt-2 max-w-sm text-sm text-foreground/80">
            Quadros, calendário e aprovações para times de conteúdo.
          </p>
        </div>
      </div>
    </div>
  );
}
