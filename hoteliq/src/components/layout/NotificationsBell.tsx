// Поповер уведомлений-колокольчик в шапке.
import { useEffect, useRef, useState } from 'react';
import { Bell, Check, Trash2, ShieldCheck, BellOff, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, NOTIF_CATEGORY_LABEL, type NotifTone } from '@/store/notifications';
import { useSettings } from '@/store/settings';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, fmtDateLong } from '@/utils/format';

const TONE_STYLE: Record<NotifTone, string> = {
  info: 'border-l-info bg-info/5',
  success: 'border-l-success bg-success/5',
  warning: 'border-l-warning bg-warning/5',
  error: 'border-l-error bg-error/5',
};

const TONE_DOT: Record<NotifTone, string> = {
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { items, markAllRead, markRead, remove, clear, permission, requestBrowserPermission } = useNotifications();
  const pushPref = useSettings((s) => s.notifications.push);
  const setNotifications = useSettings((s) => s.setNotifications);

  const unread = items.filter((i) => !i.read).length;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const handleEnable = async () => {
    const res = await requestBrowserPermission();
    if (res === 'granted') {
      setNotifications({ push: true });
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-10 w-10 rounded-btn hover:bg-surface-2 flex items-center justify-center text-text-muted"
        title="Уведомления"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-bg">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-card shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-text">Уведомления</p>
              <p className="text-[11px] text-text-muted">{unread} непрочитанных из {items.length}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={markAllRead} className="text-[11px] text-primary hover:underline disabled:opacity-40" disabled={unread === 0}>
                Прочитать всё
              </button>
            </div>
          </div>

          {/* Включение браузерных push */}
          {permission !== 'granted' && (
            <div className="px-4 py-3 border-b border-border bg-primary/5 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-text">Включить уведомления в браузере</p>
                <p className="text-[11px] text-text-muted leading-snug">
                  Чтобы получать сигналы даже когда вкладка свёрнута. Звук — короткий «динг».
                </p>
                <Button size="sm" className="mt-2" onClick={handleEnable}>Разрешить</Button>
              </div>
            </div>
          )}
          {permission === 'granted' && !pushPref && (
            <div className="px-4 py-2 border-b border-border bg-warning/5 flex items-center gap-2 text-[11px]">
              <BellOff className="h-3.5 w-3.5 text-warning" />
              <span className="text-text-muted">Push отключены в «Настройки → Уведомления».</span>
            </div>
          )}

          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 && (
              <div className="py-10 text-center text-xs text-text-muted">Пусто. Когда что-то произойдёт — увидите здесь.</div>
            )}
            {items.slice(0, 30).map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  if (n.link) {
                    setOpen(false);
                    navigate(n.link);
                  }
                }}
                className={cn(
                  'group px-4 py-2.5 border-b border-border last:border-0 cursor-pointer hover:bg-surface-2/40 border-l-4 transition',
                  TONE_STYLE[n.tone],
                  n.read && 'opacity-60'
                )}
              >
                <div className="flex items-start gap-2">
                  <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', TONE_DOT[n.tone], n.read && 'opacity-30')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-text truncate">{n.title}</p>
                      {n.link && <ExternalLink className="h-3 w-3 text-text-muted shrink-0" />}
                    </div>
                    {n.body && <p className="text-[11px] text-text-muted leading-snug mt-0.5">{n.body}</p>}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge tone="neutral" className="!text-[9px]">{NOTIF_CATEGORY_LABEL[n.category]}</Badge>
                      <span className="text-[10px] text-text-muted">{fmtDateLong(n.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                    {!n.read && (
                      <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        className="h-6 w-6 rounded-btn hover:bg-surface-2 flex items-center justify-center"
                        title="Прочитано">
                        <Check className="h-3 w-3 text-text-muted" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                      className="h-6 w-6 rounded-btn hover:bg-surface-2 flex items-center justify-center"
                      title="Удалить">
                      <Trash2 className="h-3 w-3 text-error" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border px-4 py-2 flex items-center justify-between bg-surface-2/40">
            <button onClick={clear} className="text-[11px] text-text-muted hover:text-error inline-flex items-center gap-1">
              <Trash2 className="h-3 w-3" /> Очистить
            </button>
            <button onClick={() => { setOpen(false); navigate('/settings'); }} className="text-[11px] text-primary hover:underline">
              Настройки уведомлений →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
