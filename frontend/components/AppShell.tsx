"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, FileText, Layers3, LineChart, Sparkles } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/deals", label: "Deals", icon: Building2 },
  { href: "/sectors", label: "Sectors", icon: Layers3 },
  { href: "/reports", label: "Reports", icon: FileText }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 border-r border-line/80 bg-[#071016]/96 px-5 py-6 lg:block">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-mint/10 text-mint">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-normal">DealLenseAI</span>
            <span className="text-xs text-slate-400">M&A intelligence</span>
          </span>
        </Link>
        <nav className="mt-10 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                  active ? "bg-mint/10 text-mint" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-6 left-5 right-5 rounded-md border border-gold/20 bg-gold/10 p-4">
          <p className="text-xs font-medium text-gold">Public-source mode</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Real public records plus clearly labeled demo data.</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-line/80 bg-ink/86 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-semibold">DealLenseAI</Link>
            <div className="flex gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md p-2 text-slate-300 hover:bg-white/5"
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
