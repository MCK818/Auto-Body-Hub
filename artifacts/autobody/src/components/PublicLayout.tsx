import { Link } from "wouter";
import { Wrench } from "lucide-react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Wrench className="h-6 w-6 text-primary" />
            <span>Apex AutoBody</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/track" className="text-sm font-medium hover:text-primary transition-colors">
              Track Repair
            </Link>
            <Link href="/admin/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Staff Portal
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-8 mt-auto bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Apex AutoBody. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
