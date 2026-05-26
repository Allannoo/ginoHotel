// Большая модалка для отображения юридических документов
// (политика конфиденциальности / условия использования).
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FileText, Shield } from 'lucide-react';
import {
  PRIVACY_POLICY, TERMS_OF_USE, POLICY_UPDATED_AT,
  type LegalSection,
} from '@/data/legal';

type DocKind = 'privacy' | 'terms';

const DOC_META: Record<DocKind, { title: string; subtitle: string; icon: React.ReactNode; sections: LegalSection[] }> = {
  privacy: {
    title: 'Политика конфиденциальности',
    subtitle: `Обработка персональных данных согласно ФЗ-152 · обновлено ${POLICY_UPDATED_AT}`,
    icon: <Shield className="h-5 w-5" />,
    sections: PRIVACY_POLICY,
  },
  terms: {
    title: 'Условия использования',
    subtitle: `Договор-оферта между пользователем и GinoHotel · обновлено ${POLICY_UPDATED_AT}`,
    icon: <FileText className="h-5 w-5" />,
    sections: TERMS_OF_USE,
  },
};

export function LegalModal({
  open, kind, onClose,
}: { open: boolean; kind: DocKind | null; onClose: () => void }) {
  const meta = kind ? DOC_META[kind] : null;
  return (
    <Modal
      open={open && !!meta}
      onClose={onClose}
      size="lg"
      title={meta ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-9 w-9 rounded-btn bg-primary/10 text-primary flex items-center justify-center">
            {meta.icon}
          </span>
          {meta.title}
        </span>
      ) : ''}
      subtitle={meta?.subtitle}
      footer={<Button onClick={onClose}>Закрыть</Button>}
    >
      {meta && (
        <div className="max-h-[65vh] overflow-y-auto pr-2 -mr-2 space-y-5 text-sm leading-relaxed text-text">
          {meta.sections.map((s) => (
            <section key={s.title}>
              <h3 className="font-display text-base text-text mb-2">{s.title}</h3>
              <div className="space-y-2 text-text-muted">
                {s.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}
          <p className="text-xs text-text-muted/80 pt-2 border-t border-border">
            Это рабочий черновик. Перед публичным релизом требуется юридическая проверка.
          </p>
        </div>
      )}
    </Modal>
  );
}
