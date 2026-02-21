import Image from "next/image";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Left branding panel — desktop only */}
      <div className="relative hidden w-[45%] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-aquario-primary to-aquario-primary/70 md:flex">
        {/* Decorative blur blobs */}
        <svg
          className="absolute -left-20 -top-20 h-72 w-72 opacity-20"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="100" fill="white" />
        </svg>
        <svg
          className="absolute -bottom-16 -right-16 h-64 w-64 opacity-15"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="100" fill="white" />
        </svg>

        <Image
          src="/logo3.svg"
          alt="Aquário"
          width={120}
          height={120}
          className="relative z-10 mb-6 brightness-0 invert"
        />
        <p className="relative z-10 mt-2 max-w-[260px] text-center text-sm text-white/80">
          O portal do Centro de Informática da UFPB
        </p>
      </div>

      {/* Right content panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6">
        {/* Mobile logo */}
        <div className="mb-6 md:hidden">
          <Image
            src="/logo.png"
            alt="Logo do Aquário"
            width={56}
            height={56}
            className="rounded-full"
          />
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </div>
    </div>
  );
}
