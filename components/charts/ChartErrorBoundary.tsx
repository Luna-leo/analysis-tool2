import React, { Component, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error Boundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>チャートの表示エラー</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>チャートの表示中にエラーが発生しました。</p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    エラーの詳細
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto bg-muted p-2 rounded">
                    {this.state.error.toString()}
                    {this.state.errorInfo && (
                      <>
                        {'\n\nComponent Stack:\n'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}
              <Button
                onClick={this.handleReset}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                再試行
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook for error recovery in functional components
 */
export function useChartErrorRecovery() {
  const [error, setError] = React.useState<Error | null>(null)
  const [isRecovering, setIsRecovering] = React.useState(false)

  const recover = React.useCallback(async (recoveryFn?: () => Promise<void>) => {
    setIsRecovering(true)
    setError(null)
    
    try {
      if (recoveryFn) {
        await recoveryFn()
      }
    } catch (e) {
      setError(e as Error)
    } finally {
      setIsRecovering(false)
    }
  }, [])

  const reportError = React.useCallback((error: Error) => {
    console.error('Chart error reported:', error)
    setError(error)
  }, [])

  return {
    error,
    isRecovering,
    recover,
    reportError
  }
}