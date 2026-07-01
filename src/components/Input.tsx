import type { InputHTMLAttributes, ReactNode } from 'react'
import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  containerClassName?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, containerClassName, id, icon, type, ...props },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  const control = (
    <div className="relative">
      {icon ? (
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[var(--td-text-muted)]">
          {icon}
        </span>
      ) : null}
      <input
        ref={ref}
        id={id}
        type={inputType}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          'trackdocs-input h-12 w-full trackdocs-text-input transition duration-200 placeholder:text-[color:var(--td-text-muted)]',
          icon ? 'pl-11' : 'pl-4',
          isPassword ? 'pr-11' : 'pr-4',
          error &&
            'border-[rgba(220,62,62,0.42)] focus:border-[rgba(220,62,62,0.65)] focus:shadow-[0_0_0_4px_rgba(220,62,62,0.12)]',
          className,
        )}
        {...props}
      />
      {isPassword ? (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-4 flex items-center text-[var(--td-text-muted)] hover:text-[var(--td-text-strong)] transition-colors focus:outline-none"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      ) : null}
    </div>
  )

  if (!label && !hint && !error) {
    return control
  }

  return (
    <label className={cn('block', containerClassName)} htmlFor={id}>
      {label ? <span className="trackdocs-text-label">{label}</span> : null}
      <div className={label ? 'mt-2' : ''}>{control}</div>
      {hint && !error ? <p className="trackdocs-text-helper mt-2">{hint}</p> : null}
      {error ? <p className="trackdocs-text-helper mt-2 font-medium text-[#c94040]">{error}</p> : null}
    </label>
  )
})
