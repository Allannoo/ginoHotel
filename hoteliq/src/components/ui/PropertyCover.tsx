// Премиальная "обложка" объекта: градиент + lucide-иконка.
// Подбирается по ключу cover из мок-данных.
import type { LucideIcon } from 'lucide-react';
import { Building2, Hotel, Palmtree, Home, Castle, Building, LandPlot, Warehouse, MapPin } from 'lucide-react';
import { cn } from '@/utils/format';

export type CoverKey =
  | 'hotel-classic' | 'hotel-boutique' | 'hotel-resort'
  | 'apt-modern' | 'apt-loft' | 'apt-sky' | 'apt-park'
  | 'apt-center' | 'apt-light' | 'apt-avenue' | 'apt-residence';

const COVERS: Record<CoverKey, { gradient: string; Icon: LucideIcon }> = {
  'hotel-classic':   { gradient: 'from-primary via-primary/80 to-gold/70', Icon: Hotel },
  'hotel-boutique':  { gradient: 'from-info via-primary to-primary/80',    Icon: Castle },
  'hotel-resort':    { gradient: 'from-success via-info to-gold/70',       Icon: Palmtree },
  'apt-modern':      { gradient: 'from-primary/80 to-info/60',             Icon: Building2 },
  'apt-loft':        { gradient: 'from-text via-primary to-info/60',       Icon: Warehouse },
  'apt-sky':         { gradient: 'from-info/70 to-primary',                Icon: Building },
  'apt-park':        { gradient: 'from-success/60 to-primary/70',          Icon: LandPlot },
  'apt-center':      { gradient: 'from-gold/70 to-primary',                Icon: MapPin },
  'apt-light':       { gradient: 'from-info/40 to-primary/60',             Icon: Home },
  'apt-avenue':      { gradient: 'from-primary/60 to-gold/60',             Icon: Building },
  'apt-residence':   { gradient: 'from-primary/80 to-text',                Icon: Building2 },
};

export function PropertyCover({
  cover, className, size = 'md',
}: { cover: string; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const key = (cover as CoverKey) in COVERS ? (cover as CoverKey) : 'hotel-classic';
  const { gradient, Icon } = COVERS[key];
  const iconSize = size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-6 w-6' : 'h-12 w-12';
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br flex items-center justify-center', gradient, className)}>
      {/* Декоративные круги для премиального вида */}
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
      <Icon className={cn('text-white/95 drop-shadow-lg', iconSize)} strokeWidth={1.2} />
    </div>
  );
}
