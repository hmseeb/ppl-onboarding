export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-6 text-center px-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-border" />
          <div className="w-1 h-4 bg-primary/60 rounded-full" />
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-border" />
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
          PPL Onboarding
        </h1>
        <p className="text-base text-muted-foreground max-w-xs">
          Broker onboarding portal is running.
        </p>
        <div className="flex items-center gap-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-border/60" />
          <div className="w-0.5 h-3 bg-primary/30 rounded-full" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-border/60" />
        </div>
      </main>
    </div>
  );
}
