export default function Home() {
  return (
    <div className="onboarding-bg min-h-dvh flex items-center justify-center px-4">
      <main className="flex flex-col items-center gap-8 text-center max-w-md w-full">
        {/* Glowing purple hexagon logo */}
        <div className="animate-fadeSlideIn delay-1 relative">
          <div className="absolute inset-0 blur-2xl opacity-40 bg-primary rounded-full scale-150" />
          <svg
            width="72"
            height="80"
            viewBox="0 0 72 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative drop-shadow-[0_0_24px_rgba(124,58,237,0.5)]"
          >
            <defs>
              <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="50%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#5b21b6" />
              </linearGradient>
            </defs>
            <path
              d="M36 4L68 22V58L36 76L4 58V22L36 4Z"
              stroke="url(#hexGrad)"
              strokeWidth="2"
              fill="rgba(124, 58, 237, 0.08)"
            />
            <path
              d="M36 16L56 28V52L36 64L16 52V28L36 16Z"
              stroke="url(#hexGrad)"
              strokeWidth="1.5"
              fill="rgba(124, 58, 237, 0.04)"
              opacity="0.6"
            />
            <circle cx="36" cy="40" r="4" fill="url(#hexGrad)" opacity="0.9" />
          </svg>
        </div>

        {/* Decorative top line */}
        <div className="animate-fadeSlideIn delay-2 flex items-center gap-3">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        {/* Heading */}
        <h1 className="animate-fadeSlideIn delay-3 font-heading text-5xl font-bold tracking-tight text-foreground">
          PPL Onboarding
        </h1>

        {/* Subtitle */}
        <p className="animate-fadeSlideIn delay-4 text-base text-muted-foreground max-w-xs font-sans">
          Broker onboarding portal is running.
        </p>

        {/* Decorative bottom line */}
        <div className="animate-fadeSlideIn delay-5 flex items-center gap-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/30" />
          <div className="w-1 h-1 rounded-full bg-primary/40" />
          <div className="w-2 h-px bg-primary/20" />
          <div className="w-1 h-1 rounded-full bg-primary/40" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-primary/30" />
        </div>

        {/* Thin accent bar */}
        <div className="animate-fadeSlideIn delay-6 w-24 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </main>
    </div>
  );
}
