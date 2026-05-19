// Стор: отчёты в МВД для иностранных гостей (eFMS)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MvdReport, MvdReportStatus } from '@/types';

interface MvdState {
  reports: MvdReport[];
  hydrated: boolean;
  upsertReport: (r: MvdReport) => void;
  setStatus: (id: string, status: MvdReportStatus, extra?: { rejectionReason?: string; externalId?: string }) => void;
  removeReport: (id: string) => void;
}

export const useMvd = create<MvdState>()(
  persist(
    (set) => ({
      reports: [],
      hydrated: false,
      upsertReport: (r) =>
        set((s) => {
          const ix = s.reports.findIndex((x) => x.id === r.id);
          if (ix === -1) return { reports: [r, ...s.reports] };
          const next = [...s.reports];
          next[ix] = r;
          return { reports: next };
        }),
      setStatus: (id, status, extra) =>
        set((s) => ({
          reports: s.reports.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status,
                  submittedAt: status === 'submitted' ? new Date().toISOString() : x.submittedAt,
                  acceptedAt: status === 'accepted' ? new Date().toISOString() : x.acceptedAt,
                  rejectionReason: extra?.rejectionReason ?? x.rejectionReason,
                  externalId: extra?.externalId ?? x.externalId,
                }
              : x
          ),
        })),
      removeReport: (id) => set((s) => ({ reports: s.reports.filter((x) => x.id !== id) })),
    }),
    {
      name: 'ginohotel-mvd',
      onRehydrateStorage: () => (state) => { if (state) state.hydrated = true; },
    }
  )
);

export const MVD_STATUS_LABEL: Record<MvdReportStatus, string> = {
  draft: 'Черновик',
  submitted: 'Отправлен',
  accepted: 'Принят',
  rejected: 'Отклонён',
};

/** Список стран, считающихся иностранными для отчётности в МВД РФ. */
export function isForeign(country: string): boolean {
  const russian = ['Россия', 'РФ', 'Russia', 'RU'];
  return !russian.some((c) => country.toLowerCase().includes(c.toLowerCase()));
}
