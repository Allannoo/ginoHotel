// Онбординг-тур: 4 поп-апа при первом входе
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useUi } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { Sparkles } from 'lucide-react';

const STEPS = [
  { title: 'Добро пожаловать в HotelIQ!', text: 'Современная PMS-платформа для управления отелями и посуточной арендой. Давайте быстро покажем ключевые возможности.' },
  { title: 'Шахматка', text: 'Перетаскивайте брони мышкой, кликайте по ячейкам для быстрого создания. Поддерживается зум день/неделя/месяц.' },
  { title: 'AI-инсайты', text: 'На дашборде вы найдёте рекомендации по ценообразованию и предупреждения о просадках. Это сэкономит часы аналитики.' },
  { title: 'Готовы к работе?', text: 'Нажмите Cmd/Ctrl+K в любой момент — это глобальный поиск по всей платформе.' },
];

export function Onboarding() {
  const { onboardingDone, finishOnboarding } = useUi();
  const [step, setStep] = useState(0);

  if (onboardingDone) return null;

  const next = () => {
    if (step === STEPS.length - 1) finishOnboarding();
    else setStep(step + 1);
  };

  const s = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          key={step}
          className="bg-bg border border-border rounded-modal shadow-lift max-w-md w-full p-6"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl text-text">{s.title}</h2>
            </div>
          </div>
          <p className="text-sm text-text-muted leading-relaxed mb-6">{s.text}</p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={finishOnboarding}>Пропустить</Button>
              <Button size="sm" onClick={next}>{step === STEPS.length - 1 ? 'Начать' : 'Далее'}</Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
