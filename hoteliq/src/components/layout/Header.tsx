import { Bell, Menu, Search, Plus } from 'lucide-react';
import { useUi } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { useEffect } from 'react';

export function Header() {
  const { setMobileDrawer, setCmdk } = useUi();

  // Горячая клавиша Cmd/Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdk(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setCmdk]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-bg/80 backdrop-blur-md border-b border-border flex items-center px-4 lg:px-6 gap-3">
      <button
        onClick={() => setMobileDrawer(true)}
        className="lg:hidden h-10 w-10 rounded-btn hover:bg-surface-2 flex items-center justify-center text-text"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Поиск (Cmd+K) */}
      <button
        onClick={() => setCmdk(true)}
        className="flex items-center gap-3 h-10 px-3.5 rounded-btn bg-surface border border-border text-text-muted text-sm hover:bg-surface-2 transition-colors flex-1 max-w-md"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Поиск по платформе…</span>
        <span className="hidden md:inline ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-bg">⌘K</span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Button size="md" leftIcon={<Plus className="h-4 w-4" />} className="hidden sm:inline-flex">
          Новая бронь
        </Button>

        <button className="relative h-10 w-10 rounded-btn hover:bg-surface-2 flex items-center justify-center text-text-muted">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-error ring-2 ring-bg" />
        </button>

        <button className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-gold text-white font-bold text-sm flex items-center justify-center shadow-soft">
          АС
        </button>
      </div>
    </header>
  );
}
