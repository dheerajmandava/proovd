import * as React from 'react'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'warning'
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    // Base styles
    let baseStyles = 'relative w-full rounded-lg border p-4'
    
    // Variant styles
    let variantStyles = ''
    switch (variant) {
      case 'default':
        variantStyles = 'bg-gray-50 border-gray-200 text-gray-900'
        break
      case 'destructive':
        variantStyles = 'bg-red-50 border-red-500 text-red-900'
        break
      case 'warning':
        variantStyles = 'bg-amber-50 border-amber-500 text-amber-900'
        break
    }
    
    const alertStyles = `${baseStyles} ${variantStyles} ${className || ''}`
    
    return (
      <div
        ref={ref}
        role="alert"
        className={alertStyles}
        {...props}
      />
    )
  }
)
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={`mb-1 font-medium leading-none tracking-tight ${className || ''}`}
    {...props}
  />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm text-gray-600 ${className || ''}`}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription } 