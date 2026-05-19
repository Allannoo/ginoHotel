// Стартовый экран: split-screen с премиальным брендингом + формой входа/регистрации.
// Любые данные принимаются (mock-режим): если пользователя нет, он создаётся как директор.
import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, Mail, Lock, User as UserIcon, Eye, EyeOff,
  CalendarRange, BarChart3, Building2, Radio, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/store/auth';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/format';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = useAuth((s) => s.login);
  const register = useAuth((s) => s.register);
  const { push } = useToast();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      push({ tone: 'warning', title: 'Заполните поля', description: 'Email и пароль обязательны' });
      return;
    }
    if (mode === 'register' && !name.trim()) {
      push({ tone: 'warning', title: 'Укажите имя' });
      return;
    }
    setLoading(true);
    // Имитация запроса
    setTimeout(() => {
      try {
        const user = mode === 'login'
          ? login(email.trim(), password, name.trim() || undefined)
          : register({ name: name.trim(), email: email.trim(), password });
        push({ tone: 'success', title: `Добро пожаловать, ${user.name}!` });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Ошибка входа';
        push({ tone: 'error', title: 'Не удалось войти', description: msg });
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen w-full bg-bg grid lg:grid-cols-[1.1fr_1fr] overflow-hidden">
      {/* === Левая половина: брендинг === */}
      <BrandingPane />

      {/* === Правая половина: форма === */}
      <div className="relative flex items-center justify-center px-6 py-10 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md"
        >
          {/* Лого на мобилке */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-gold flex items-center justify-center text-white font-display text-xl shadow-soft">G</div>
            <div>
              <p className="font-display text-xl text-text leading-none">GinoHotel</p>
              <p className="text-[11px] text-text-muted mt-0.5">PMS Platform</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="inline-flex p-1 rounded-btn bg-surface-2 mb-6">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  'relative px-5 h-9 text-sm font-bold rounded-md transition-colors',
                  mode === m ? 'text-text' : 'text-text-muted hover:text-text',
                )}
              >
                {mode === m && (
                  <motion.span
                    layoutId="auth-tab"
                    className="absolute inset-0 bg-bg rounded-md shadow-soft"
                    transition={{ duration: 0.25 }}
                  />
                )}
                <span className="relative">{m === 'login' ? 'Войти' : 'Регистрация'}</span>
              </button>
            ))}
          </div>

          <h1 className="font-display text-3xl text-text leading-tight">
            {mode === 'login' ? 'С возвращением' : 'Создайте аккаунт'}
          </h1>
          <p className="text-sm text-text-muted mt-2">
            {mode === 'login'
              ? 'Войдите, чтобы продолжить управлять вашими объектами.'
              : 'Регистрация занимает меньше минуты. Любой email и пароль подойдёт для демо.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Field
                    icon={<UserIcon className="h-4 w-4" />}
                    label="Имя и фамилия"
                    type="text"
                    placeholder="Алексей Смирнов"
                    value={name}
                    onChange={setName}
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Field
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              type="email"
              placeholder="director@hotel.ru"
              value={email}
              onChange={setEmail}
              autoFocus={mode === 'login'}
            />

            <Field
              icon={<Lock className="h-4 w-4" />}
              label="Пароль"
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="text-text-muted hover:text-text transition-colors"
                  aria-label={showPwd ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="accent-primary" />
                  <span className="text-text-muted">Запомнить меня</span>
                </label>
                <button type="button" className="text-primary font-semibold hover:underline">
                  Забыли пароль?
                </button>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              disabled={loading}
            >
              {loading ? 'Подождите…' : mode === 'login' ? 'Войти в платформу' : 'Создать аккаунт'}
            </Button>

            <div className="text-center text-xs text-text-muted pt-1">
              {mode === 'login' ? (
                <>Нет аккаунта?{' '}
                  <button type="button" onClick={() => setMode('register')} className="text-primary font-bold hover:underline">
                    Зарегистрироваться
                  </button>
                </>
              ) : (
                <>Уже зарегистрированы?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-primary font-bold hover:underline">
                    Войти
                  </button>
                </>
              )}
            </div>
          </form>

          <p className="text-[11px] text-text-muted/80 text-center mt-10 leading-relaxed">
            Продолжая, вы принимаете <a className="underline">условия использования</a> и <a className="underline">политику конфиденциальности</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ====================== Поле ввода ======================
function Field({
  icon, label, type = 'text', placeholder, value, onChange, rightAction, autoFocus,
}: {
  icon: React.ReactNode;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  rightAction?: React.ReactNode;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-text-muted mb-1.5">{label}</span>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">{icon}</span>
        <input
          type={type}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 pl-11 pr-12 rounded-btn bg-surface border border-border text-sm text-text placeholder:text-text-muted/70 focus-ring transition-colors"
        />
        {rightAction && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightAction}</span>
        )}
      </div>
    </label>
  );
}

// ====================== Левая брендинговая часть ======================
function BrandingPane() {
  return (
    <div className="hidden lg:flex relative overflow-hidden">
      {/* Фоновый градиент */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#143055] to-[#08111f]" />
      {/* Декоративные blobs */}
      <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-gold/30 blur-3xl" />
      <div className="absolute bottom-0 -right-24 h-[480px] w-[480px] rounded-full bg-primary/40 blur-3xl" />
      <div className="absolute top-1/3 left-1/2 h-[260px] w-[260px] rounded-full bg-white/5 blur-2xl" />

      {/* Сетка-pattern */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />

      <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
        {/* Лого */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center font-display text-2xl shadow-soft">G</div>
          <div>
            <p className="font-display text-2xl leading-none">GinoHotel</p>
            <p className="text-[11px] text-white/60 mt-1 tracking-wider uppercase">Premium PMS · 2026</p>
          </div>
        </div>

        {/* Центр: заголовок */}
        <div className="max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>AI-управление недвижимостью</span>
          </div>
          <h1 className="font-display text-5xl xl:text-6xl leading-[1.05]">
            Управляйте отелями и квартирами как премиальная сеть.
          </h1>
          <p className="text-white/70 mt-6 text-base leading-relaxed">
            Единая платформа для брони, гостей, каналов продаж и финансов.
            Календарь броней, синхронизация с каналами и умные рекомендации в одном месте.
          </p>

          {/* Feature-чипы */}
          <div className="mt-10 grid grid-cols-2 gap-3 max-w-md">
            {[
              { icon: CalendarRange, text: 'Календарь броней' },
              { icon: Radio, text: 'Channel Manager' },
              { icon: BarChart3, text: 'Финансы и отчёты' },
              { icon: Building2, text: 'Отели / квартиры' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-2.5 px-3 py-2.5 rounded-btn bg-white/5 border border-white/10 backdrop-blur-sm">
                <f.icon className="h-4 w-4 text-gold shrink-0" />
                <span className="text-sm font-semibold">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Низ: социальное доказательство */}
        <div className="flex items-center gap-6 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>SOC 2 · 152-ФЗ</span>
          </div>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>Уже с нами 1 200+ объектов</span>
        </div>
      </div>
    </div>
  );
}
