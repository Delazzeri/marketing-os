import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-1">
      <div className="flex flex-1 items-center justify-center p-8">
        <LoginForm />
      </div>

      <div className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-primary via-accent to-primary/70 lg:block">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2), transparent 45%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-end p-12 text-primary-foreground">
          <p className="max-w-sm text-2xl font-semibold tracking-tight text-balance">
            Boards, atualizações e o Portal do cliente — tudo num só lugar.
          </p>
          <p className="mt-2 max-w-sm text-sm text-primary-foreground/80">
            Substitua planilha, WhatsApp e Trello solto pelo fluxo de trabalho da sua agência.
          </p>
        </div>
      </div>
    </div>
  );
}
