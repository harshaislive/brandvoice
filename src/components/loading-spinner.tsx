import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-primary border-t-transparent',
      sizeClasses[size],
      className
    )} />
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-lg font-medium text-primary">Loading...</h2>
        <p className="text-muted-foreground">Please wait while we load your content</p>
      </div>
    </div>
  )
}