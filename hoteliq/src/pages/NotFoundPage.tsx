import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="font-display text-9xl text-primary mb-4">404</div>
      <h1 className="font-display text-3xl text-text mb-2">Страница не найдена</h1>
      <p className="text-text-muted mb-6">Возможно, вы попали сюда по ошибке.</p>
      <Link to="/"><Button>Вернуться на дашборд</Button></Link>
    </div>
  );
}
