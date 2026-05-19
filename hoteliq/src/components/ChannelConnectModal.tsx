// Модальное окно подключения мессенджера/канала рассылки.
// Поддерживает Telegram-бот, MAX-бот, WhatsApp (Green-API/Wazzup/Twilio),
// SMTP-почту и SMS-провайдеров. Делает мок-проверку подключения, после чего
// сохраняет данные в settings.connections.
import { useState } from 'react';
import { Bot, MessageCircle, Mail, Phone, Copy, Check, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useSettings, type MessengerKey, type MessengerConnection } from '@/store/settings';
import { cn } from '@/utils/format';

interface Props {
  open: boolean;
  channel: MessengerKey;
  onClose: () => void;
}

const META: Record<MessengerKey, { title: string; icon: React.ComponentType<{ className?: string }>; color: string; brand: string }> = {
  telegram: { title: 'Подключить Telegram-бот', icon: Bot, color: 'from-info to-primary', brand: 'Telegram' },
  max: { title: 'Подключить MAX-бот', icon: Bot, color: 'from-primary to-gold', brand: 'MAX' },
  whatsapp: { title: 'Подключить WhatsApp', icon: MessageCircle, color: 'from-success to-info', brand: 'WhatsApp' },
  email: { title: 'Подключить SMTP / Email', icon: Mail, color: 'from-warning to-gold', brand: 'Email' },
  sms: { title: 'Подключить SMS-шлюз', icon: Phone, color: 'from-error to-warning', brand: 'SMS' },
};

export function ChannelConnectModal({ open, channel, onClose }: Props) {
  const { push } = useToast();
  const existing = useSettings((s) => s.connections[channel]);
  const connect = useSettings((s) => s.connectMessenger);
  const disconnect = useSettings((s) => s.disconnectMessenger);
  const meta = META[channel];
  const Icon = meta.icon;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<MessengerConnection>(existing);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const setField = <K extends keyof MessengerConnection>(k: K, v: MessengerConnection[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleTest = async () => {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setTesting(false);
    connect(channel, draft);
    push({ tone: 'success', title: 'Канал подключен', description: `${meta.brand} готов к отправке сообщений` });
    setStep(1);
    onClose();
  };

  const handleDisconnect = () => {
    disconnect(channel);
    push({ tone: 'info', title: 'Канал отключен', description: meta.brand });
    onClose();
  };

  // Если уже подключён — показываем краткую сводку
  if (existing.connected) {
    return (
      <Modal open={open} onClose={onClose} title={meta.title} size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-btn bg-success/10 border border-success/30">
            <div className={cn('h-12 w-12 rounded-btn bg-gradient-to-br flex items-center justify-center text-white shadow-soft', meta.color)}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-text flex items-center gap-2">{meta.brand} <Badge tone="success" dot>Подключено</Badge></p>
              <p className="text-xs text-text-muted mt-0.5">Подключено {existing.connectedAt ? new Date(existing.connectedAt).toLocaleString('ru-RU') : ''}</p>
            </div>
          </div>
          {existing.botUsername && (
            <Field label="Бот">{existing.botUsername}</Field>
          )}
          {existing.chatId && <Field label="Chat ID">{existing.chatId}</Field>}
          {existing.phoneNumber && <Field label="Номер">{existing.phoneNumber}</Field>}
          {existing.smtpHost && <Field label="SMTP">{existing.smtpHost}:{existing.smtpPort}</Field>}
          {existing.provider && <Field label="Провайдер">{existing.provider}</Field>}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleDisconnect}>Отключить</Button>
            <Button onClick={onClose}>Готово</Button>
          </div>
        </div>
      </Modal>
    );
  }

  // ===== Мастер подключения =====
  return (
    <Modal open={open} onClose={onClose} title={meta.title} size="md">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className={cn('h-14 w-14 rounded-btn bg-gradient-to-br flex items-center justify-center text-white shadow-soft', meta.color)}>
            <Icon className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-text">{meta.brand}</p>
            <p className="text-xs text-text-muted">Шаг {step} из 3</p>
            <div className="mt-2 h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
          </div>
        </div>

        {channel === 'telegram' && (
          <TelegramWizard step={step} draft={draft} setField={setField} copy={copy} copied={copied} />
        )}
        {channel === 'max' && (
          <MaxWizard step={step} draft={draft} setField={setField} copy={copy} copied={copied} />
        )}
        {channel === 'whatsapp' && (
          <WhatsAppWizard step={step} draft={draft} setField={setField} />
        )}
        {channel === 'email' && (
          <EmailWizard step={step} draft={draft} setField={setField} />
        )}
        {channel === 'sms' && (
          <SmsWizard step={step} draft={draft} setField={setField} />
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <div className="flex gap-2">
            {step > 1 && <Button variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>Назад</Button>}
            {step < 3 && <Button onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}>Далее</Button>}
            {step === 3 && (
              <Button onClick={handleTest} loading={testing} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                {testing ? 'Проверка...' : 'Проверить и подключить'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-text-muted w-32 shrink-0">{label}</span>
      <span className="text-sm font-mono text-text">{children}</span>
    </div>
  );
}

function StepCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-btn bg-info/10 border border-info/30 text-sm text-text leading-relaxed">
      {children}
    </div>
  );
}

function CopyBlock({ value, onCopy, copied }: { value: string; onCopy: (v: string) => void; copied: boolean }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-btn bg-surface-2 border border-border font-mono text-xs">
      <code className="flex-1 break-all">{value}</code>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="shrink-0 p-1.5 rounded-btn hover:bg-bg text-text-muted hover:text-text transition"
        aria-label="Скопировать"
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ====== Telegram ======
function TelegramWizard({ step, draft, setField, copy, copied }: {
  step: 1 | 2 | 3;
  draft: MessengerConnection;
  setField: <K extends keyof MessengerConnection>(k: K, v: MessengerConnection[K]) => void;
  copy: (v: string) => void;
  copied: boolean;
}) {
  if (step === 1) return (
    <div className="space-y-3">
      <StepCallout>
        <p className="font-semibold mb-1">1. Создайте бота через @BotFather</p>
        <ol className="text-xs text-text-muted space-y-1 list-decimal pl-4">
          <li>Откройте Telegram и найдите <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">@BotFather <ExternalLink className="h-3 w-3" /></a></li>
          <li>Отправьте команду <code className="px-1 bg-surface-2 rounded">/newbot</code></li>
          <li>Придумайте имя и username (должен заканчиваться на <code className="px-1 bg-surface-2 rounded">_bot</code>)</li>
          <li>Скопируйте полученный токен — он понадобится на следующем шаге</li>
        </ol>
      </StepCallout>
      <Input
        label="Username бота"
        placeholder="@my_hotel_bot"
        value={draft.botUsername ?? ''}
        onChange={(e) => setField('botUsername', e.target.value)}
      />
    </div>
  );
  if (step === 2) return (
    <div className="space-y-3">
      <StepCallout>
        Вставьте <b>HTTP API токен</b>, который прислал BotFather. Он выглядит примерно так:
        <CopyBlock value="123456789:AAH-EXAMPLE-token-1234567890abcdefghij" onCopy={copy} copied={copied} />
      </StepCallout>
      <Input
        label="Токен бота"
        placeholder="123456789:AA..."
        value={draft.botToken ?? ''}
        onChange={(e) => setField('botToken', e.target.value)}
      />
    </div>
  );
  return (
    <div className="space-y-3">
      <StepCallout>
        <p className="font-semibold mb-1">3. Привяжите чат для получения уведомлений</p>
        <ol className="text-xs text-text-muted space-y-1 list-decimal pl-4">
          <li>Откройте созданного бота и нажмите <b>«Запустить»</b></li>
          <li>Отправьте боту любое сообщение (например <code className="px-1 bg-surface-2 rounded">/start</code>)</li>
          <li>Скопируйте код приглашения и вставьте в боте:</li>
        </ol>
        <div className="mt-2">
          <CopyBlock value="/connect HQ-9847" onCopy={copy} copied={copied} />
        </div>
      </StepCallout>
      <Input
        label="Chat ID (получите автоматически после /connect)"
        placeholder="например 285619273"
        value={draft.chatId ?? ''}
        onChange={(e) => setField('chatId', e.target.value)}
      />
    </div>
  );
}

// ====== MAX ======
function MaxWizard({ step, draft, setField, copy, copied }: Parameters<typeof TelegramWizard>[0]) {
  if (step === 1) return (
    <div className="space-y-3">
      <StepCallout>
        <p className="font-semibold mb-1">1. Создайте бота в MAX (мессенджер VK)</p>
        <ol className="text-xs text-text-muted space-y-1 list-decimal pl-4">
          <li>Откройте MAX и найдите <code className="px-1 bg-surface-2 rounded">@MasterBot</code></li>
          <li>Команда <code className="px-1 bg-surface-2 rounded">/create</code> → задайте имя и иконку</li>
          <li>Получите токен в формате <code className="px-1 bg-surface-2 rounded">MAX:token:...</code></li>
        </ol>
      </StepCallout>
      <Input label="Username бота" placeholder="@hotel_max_bot" value={draft.botUsername ?? ''} onChange={(e) => setField('botUsername', e.target.value)} />
    </div>
  );
  if (step === 2) return (
    <div className="space-y-3">
      <StepCallout>Вставьте токен, полученный от MasterBot.</StepCallout>
      <Input label="Токен MAX-бота" placeholder="MAX:token:..." value={draft.botToken ?? ''} onChange={(e) => setField('botToken', e.target.value)} />
    </div>
  );
  return (
    <div className="space-y-3">
      <StepCallout>
        Отправьте боту команду:
        <CopyBlock value="/connect HQ-9847" onCopy={copy} copied={copied} />
      </StepCallout>
      <Input label="Chat ID" placeholder="auto" value={draft.chatId ?? ''} onChange={(e) => setField('chatId', e.target.value)} />
    </div>
  );
}

// ====== WhatsApp ======
function WhatsAppWizard({ step, draft, setField }: {
  step: 1 | 2 | 3;
  draft: MessengerConnection;
  setField: <K extends keyof MessengerConnection>(k: K, v: MessengerConnection[K]) => void;
}) {
  if (step === 1) return (
    <div className="space-y-3">
      <StepCallout>
        <p className="font-semibold mb-1">Выберите провайдера WhatsApp Business API</p>
        <p className="text-xs text-text-muted">Каждый провайдер требует регистрации и проверки номера. Рекомендуем Green-API для быстрого старта.</p>
      </StepCallout>
      <Select
        label="Провайдер"
        value={draft.provider ?? 'green-api'}
        onChange={(e) => setField('provider', e.target.value as MessengerConnection['provider'])}
        options={[
          { value: 'green-api', label: 'Green-API (быстрый старт)' },
          { value: 'wazzup', label: 'Wazzup24 (CRM-интеграция)' },
          { value: 'twilio', label: 'Twilio (международный)' },
        ]}
      />
    </div>
  );
  if (step === 2) return (
    <div className="space-y-3">
      <StepCallout>Войдите в личный кабинет провайдера, создайте инстанс и скопируйте идентификатор и API-токен.</StepCallout>
      <Input label="Instance ID" placeholder="1101234567" value={draft.instanceId ?? ''} onChange={(e) => setField('instanceId', e.target.value)} />
      <Input label="API ключ / Token" type="password" placeholder="••••••" value={draft.apiKey ?? ''} onChange={(e) => setField('apiKey', e.target.value)} />
    </div>
  );
  return (
    <div className="space-y-3">
      <StepCallout>Укажите номер WhatsApp, с которого будут уходить сообщения. На этот номер мы пошлём тестовое сообщение.</StepCallout>
      <Input label="Номер WhatsApp" placeholder="+7 999 123-45-67" value={draft.phoneNumber ?? ''} onChange={(e) => setField('phoneNumber', e.target.value)} />
    </div>
  );
}

// ====== Email / SMTP ======
function EmailWizard({ step, draft, setField }: Parameters<typeof WhatsAppWizard>[0]) {
  if (step === 1) return (
    <div className="space-y-3">
      <StepCallout>
        Подключите SMTP-сервер вашего почтового провайдера. Например <b>smtp.yandex.ru:465</b> для Яндекс.Почты или <b>smtp.gmail.com:587</b> для Google.
      </StepCallout>
      <div className="grid grid-cols-3 gap-3">
        <Input label="SMTP-хост" className="col-span-2" placeholder="smtp.yandex.ru" value={draft.smtpHost ?? ''} onChange={(e) => setField('smtpHost', e.target.value)} />
        <Input label="Порт" type="number" placeholder="465" value={draft.smtpPort ?? ''} onChange={(e) => setField('smtpPort', Number(e.target.value))} />
      </div>
    </div>
  );
  if (step === 2) return (
    <div className="space-y-3">
      <StepCallout>Введите логин и пароль почтового ящика, от имени которого будут отправляться письма гостям.</StepCallout>
      <Input label="Логин (email)" type="email" placeholder="bot@ginohotel.ru" value={draft.smtpUser ?? ''} onChange={(e) => setField('smtpUser', e.target.value)} />
      <Input label="Пароль / App password" type="password" value={draft.smtpPass ?? ''} onChange={(e) => setField('smtpPass', e.target.value)} />
    </div>
  );
  return (
    <div className="space-y-3">
      <StepCallout>Имя отправителя — то, что гость видит в поле «От кого».</StepCallout>
      <Input label="Имя отправителя" placeholder="GinoHotel · Бронирование" value={draft.fromName ?? ''} onChange={(e) => setField('fromName', e.target.value)} />
    </div>
  );
}

// ====== SMS ======
function SmsWizard({ step, draft, setField }: Parameters<typeof WhatsAppWizard>[0]) {
  if (step === 1) return (
    <div className="space-y-3">
      <StepCallout>Выберите SMS-провайдера. Для России рекомендуем SMS.ru или SMS Aero — самые низкие тарифы.</StepCallout>
      <Select
        label="Провайдер"
        value={draft.provider ?? 'sms-ru'}
        onChange={(e) => setField('provider', e.target.value as MessengerConnection['provider'])}
        options={[
          { value: 'sms-ru', label: 'SMS.ru' },
          { value: 'sms-aero', label: 'SMS Aero' },
          { value: 'twilio', label: 'Twilio' },
        ]}
      />
    </div>
  );
  if (step === 2) return (
    <div className="space-y-3">
      <StepCallout>Скопируйте API-ключ из личного кабинета провайдера.</StepCallout>
      <Input label="API ключ" type="password" value={draft.apiKey ?? ''} onChange={(e) => setField('apiKey', e.target.value)} />
    </div>
  );
  return (
    <div className="space-y-3">
      <StepCallout>Укажите имя отправителя — оно отображается у гостя вместо номера. Обычно нужно отдельно зарегистрировать у провайдера.</StepCallout>
      <Input label="Имя отправителя (Alpha Name)" placeholder="GinoHotel" value={draft.fromName ?? ''} onChange={(e) => setField('fromName', e.target.value)} />
      <Input label="Тестовый номер для проверки" placeholder="+7 999 123-45-67" value={draft.phoneNumber ?? ''} onChange={(e) => setField('phoneNumber', e.target.value)} />
    </div>
  );
}

// ====== Используется для отображения иконки/статуса в строке канала ======
export { META as CHANNEL_META };
