import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';

// Global error boundary — shows a readable message instead of white screen
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '24px',
          fontFamily: 'system-ui, sans-serif', textAlign: 'center', gap: '12px',
        }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <p style={{ fontWeight: 600, fontSize: '16px', margin: 0 }}>
            Something went wrong
          </p>
          <p style={{ color: '#888', fontSize: '13px', margin: 0, maxWidth: '320px' }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '8px', padding: '10px 20px', borderRadius: '12px',
              border: 'none', background: '#18181b', color: '#fff',
              fontSize: '14px', cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
