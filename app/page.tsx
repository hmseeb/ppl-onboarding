export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_center,_#0E0E14_0%,_#07070A_70%)]">
      <main className="flex flex-col items-center gap-6 text-center px-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-primary/50" />
          <div className="w-1.5 h-1.5 rotate-45 bg-primary/70" />
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-primary/50" />
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
          PPL Onboarding
        </h1>
        <p className="text-base text-muted-foreground max-w-xs">
          Broker onboarding portal is running.
        </p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/30" />
          <div className="w-1 h-1 rotate-45 bg-primary/40" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-primary/30" />
        </div>
      </main>
    </div>
  );
}
