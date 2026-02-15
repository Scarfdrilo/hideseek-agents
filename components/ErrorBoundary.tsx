'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a12',
          color: '#fff',
          fontFamily: 'monospace',
          padding: 20,
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 48, marginBottom: 16 }}>💥</span>
          <h1 style={{ color: '#ff4444', marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: '#888', marginBottom: 24, maxWidth: 400 }}>
            A client-side error occurred. This might be a wallet connection issue.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            style={{
              padding: '12px 24px',
              background: '#00ff88',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            🔄 Reload Page
          </button>
          {this.state.error && (
            <details style={{ marginTop: 24, color: '#666', fontSize: 12 }}>
              <summary style={{ cursor: 'pointer' }}>Error details</summary>
              <pre style={{ 
                marginTop: 8, 
                padding: 12, 
                background: '#111', 
                borderRadius: 4,
                textAlign: 'left',
                maxWidth: '80vw',
                overflow: 'auto',
              }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
