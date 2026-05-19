import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface State { error: Error | null; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('[GinoHotel ErrorBoundary]', error); }
  reset = () => this.setState({ error: null });
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
        <div className="max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-error mx-auto mb-4" />
          <h1 className="font-display text-2xl text-text mb-2">Что-то пошло не так</h1>
          <p className="text-sm text-text-muted mb-6">{this.state.error.message}</p>
          <Button onClick={this.reset}>Попробовать снова</Button>
        </div>
      </div>
    );
  }
}
