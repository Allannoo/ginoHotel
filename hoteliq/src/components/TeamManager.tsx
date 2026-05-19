// Менеджер команды/сотрудников. Используется и на странице «Команда», и во вкладке «Сотрудники» в Настройках.
// Идентичный UI в обоих местах: одна и та же база данных и логика.
import { useState, useEffect } from 'react';
import { Plus, Trash2, ShieldCheck, UserPlus, KeyRound, Mail, Power, Pencil, Upload } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useAuth, useCurrentUser, PERMISSION_LABEL, ROLE_LABEL,
  DEFAULT_ROLE_PERMISSIONS, ALL_PERMISSIONS,
} from '@/store/auth';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/format';
import type { PermissionKey, UserRole, User } from '@/types';

export function TeamManager({ showHeading = true }: { showHeading?: boolean }) {
  const current = useCurrentUser();
  const team = useAuth((s) => s.team);
  const addMember = useAuth((s) => s.addMember);
  const removeMember = useAuth((s) => s.removeMember);
  const togglePermission = useAuth((s) => s.togglePermission);
  const updateMember = useAuth((s) => s.updateMember);
  const { push } = useToast();

  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);

  // Подчинённые = вся команда кроме самого директора
  const subordinates = team.filter((u) => u.id !== current?.id);

  return (
    <div>
      {showHeading && (
        <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 className="font-display text-2xl text-text">Сотрудники</h2>
            <p className="text-sm text-text-muted">{subordinates.length} в команде · управление доступом и ролями</p>
          </div>
          <Button size="md" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            Добавить сотрудника
          </Button>
        </div>
      )}

      {/* Карточка-владелец */}
      {current && (
        <Card padding="md" className="mb-4 border-primary/30 bg-gradient-to-br from-primary/5 to-gold/5">
          <div className="flex items-center gap-4">
            <Avatar name={current.name} src={current.avatar} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-display text-lg text-text">{current.name}</p>
                <Badge tone="gold"><span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Директор</span></Badge>
              </div>
              <p className="text-sm text-text-muted">{current.email} · Полный доступ ко всем разделам</p>
            </div>
          </div>
        </Card>
      )}

      {subordinates.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<UserPlus className="h-12 w-12 text-text-muted" />}
            title="Пока никого нет"
            description="Добавьте своих сотрудников и выберите, к каким разделам им разрешён доступ."
            action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Добавить сотрудника</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {subordinates.map((u) => (
            <Card key={u.id} padding="md">
              <div className="flex items-start gap-4 flex-wrap">
                <Avatar name={u.name} src={u.avatar} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-text">{u.name}</p>
                    <Badge tone={u.active ? 'success' : 'neutral'} dot>{u.active ? 'Активен' : 'Отключён'}</Badge>
                    <Badge tone="primary">{ROLE_LABEL[u.role]}</Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> {u.email}{u.phone ? ` · ${u.phone}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost" size="sm"
                    leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => setEditTarget(u)}
                  >
                    Редактировать
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    leftIcon={<Power className="h-3.5 w-3.5" />}
                    onClick={() => {
                      updateMember(u.id, { active: !u.active });
                      push({ tone: 'success', title: u.active ? 'Сотрудник отключён' : 'Сотрудник активирован' });
                    }}
                  >
                    {u.active ? 'Отключить' : 'Включить'}
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => {
                      if (confirm(`Удалить ${u.name}?`)) {
                        removeMember(u.id);
                        push({ tone: 'success', title: 'Сотрудник удалён' });
                      }
                    }}
                  >
                    Удалить
                  </Button>
                </div>
              </div>

              {/* Чекбоксы доступа */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-bold uppercase text-text-muted mb-3 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> Доступ к разделам
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {ALL_PERMISSIONS.map((perm) => {
                    const checked = u.permissions.includes(perm);
                    return (
                      <label
                        key={perm}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-btn border cursor-pointer transition-colors text-sm',
                          checked
                            ? 'border-primary/40 bg-primary/5 text-text'
                            : 'border-border text-text-muted hover:bg-surface-2',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(u.id, perm)}
                          className="accent-primary h-4 w-4"
                        />
                        <span className="font-semibold">{PERMISSION_LABEL[perm]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddMemberModal
        open={open}
        onClose={() => setOpen(false)}
        onAdd={(data) => {
          addMember(data);
          push({ tone: 'success', title: 'Сотрудник добавлен', description: data.name });
          setOpen(false);
        }}
      />

      <EditMemberModal
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={(patch) => {
          if (!editTarget) return;
          updateMember(editTarget.id, patch);
          push({ tone: 'success', title: 'Сохранено' });
          setEditTarget(null);
        }}
      />
    </div>
  );
}

// ===================== Модал добавления =====================
function AddMemberModal({
  open, onClose, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; email: string; role: UserRole; permissions: PermissionKey[] }) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('reception');
  const [perms, setPerms] = useState<PermissionKey[]>([...DEFAULT_ROLE_PERMISSIONS.reception]);

  const handleRole = (r: UserRole) => {
    setRole(r);
    setPerms([...DEFAULT_ROLE_PERMISSIONS[r]]);
  };

  const toggle = (p: PermissionKey) => {
    setPerms((arr) => (arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]));
  };

  const reset = () => {
    setName(''); setEmail(''); setRole('reception');
    setPerms([...DEFAULT_ROLE_PERMISSIONS.reception]);
  };

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); reset(); }}
      title="Новый сотрудник"
      subtitle="Регистрация подчинённого и настройка прав"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => { onClose(); reset(); }}>Отмена</Button>
          <Button
            disabled={!name.trim() || !email.trim()}
            onClick={() => {
              onAdd({ name: name.trim(), email: email.trim(), role, permissions: perms });
              reset();
            }}
          >
            Добавить
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Имя и фамилия" placeholder="Мария Кузнецова" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" placeholder="m.kuznetsova@hotel.ru" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Select
          label="Роль"
          value={role}
          onChange={(e) => handleRole(e.target.value as UserRole)}
          options={(Object.keys(ROLE_LABEL) as UserRole[])
            .filter((r) => r !== 'admin')
            .map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
        />
        <div>
          <p className="text-xs font-bold uppercase text-text-muted mb-2">Доступные разделы</p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_PERMISSIONS.map((p) => (
              <label
                key={p}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-btn border cursor-pointer text-sm',
                  perms.includes(p)
                    ? 'border-primary/40 bg-primary/5 text-text'
                    : 'border-border text-text-muted hover:bg-surface-2',
                )}
              >
                <input
                  type="checkbox"
                  className="accent-primary h-4 w-4"
                  checked={perms.includes(p)}
                  onChange={() => toggle(p)}
                />
                <span className="font-semibold">{PERMISSION_LABEL[p]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ===================== Модал редактирования =====================
function EditMemberModal({ user, onClose, onSave }: {
  user: User | null;
  onClose: () => void;
  onSave: (patch: Partial<User>) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('reception');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone ?? '');
      setRole(user.role);
      setAvatar(user.avatar);
    }
  }, [user?.id]);

  if (!user) return null;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { alert('Файл больше 2 МБ'); return; }
    const r = new FileReader();
    r.onload = () => setAvatar(String(r.result));
    r.readAsDataURL(f);
  };

  const reset = () => { setName(''); setEmail(''); setPhone(''); setAvatar(undefined); };

  return (
    <Modal
      open={!!user}
      onClose={() => { onClose(); reset(); }}
      title="Редактирование сотрудника"
      subtitle={user.email}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => { onClose(); reset(); }}>Отмена</Button>
          <Button
            disabled={!name.trim() || !email.trim()}
            onClick={() => {
              onSave({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, role, avatar });
              reset();
            }}
          >
            Сохранить
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar name={name || user.name} src={avatar} size="lg" />
          <div className="flex-1">
            <p className="text-xs uppercase font-bold text-text-muted mb-1">Аватар</p>
            <label className="inline-flex items-center gap-2 px-3 h-9 rounded-btn border border-border cursor-pointer hover:bg-surface-2 text-sm font-semibold">
              <Upload className="h-4 w-4" />
              Загрузить
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
            {avatar && (
              <Button size="sm" variant="ghost" className="ml-2" onClick={() => setAvatar(undefined)}>Убрать</Button>
            )}
            <p className="text-[11px] text-text-muted mt-1">PNG/JPG до 2 МБ</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Имя и фамилия" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" />
          <Select
            label="Роль"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={(Object.keys(ROLE_LABEL) as UserRole[]).filter((r) => r !== 'admin').map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
          />
        </div>
      </div>
    </Modal>
  );
}
