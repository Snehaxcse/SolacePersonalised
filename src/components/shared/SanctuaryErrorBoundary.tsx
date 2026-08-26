import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class SanctuaryErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Sanctuary render error', error, info.componentStack);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    const devDetail = import.meta.env.DEV ? this.state.error.message : null;

    return (
      <main id="main" className="min-h-screen flex flex-col items-center justify-center px-8 text-center" style={{ backgroundColor: '#0e0e12' }}>
        <h1
          className="text-white text-2xl font-light mb-3"
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
        >
          this space had a moment.
        </h1>
        <p className="text-white/70 text-sm font-light mb-8 max-w-sm">
          You can return home and try again. The rest of Solace is still here.
        </p>
        {devDetail && (
          <pre className="text-left text-[11px] text-red-300/80 bg-white/5 rounded-xl px-4 py-3 mb-8 max-w-lg overflow-auto">
            {devDetail}
          </pre>
        )}
        <a
          href="/"
          className="px-8 py-3 rounded-full border border-white/30 text-white text-xs tracking-widest uppercase hover:border-white/50 hover:text-white transition-colors"
        >
          return home
        </a>
      </main>
    );
  }
}
