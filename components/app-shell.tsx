import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-primary font-mono text-[0.6875rem] font-bold text-primary-foreground">
            MD
          </span>
          URL → Markdown
        </div>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col pb-12">{children}</main>
    </div>
  );
}
