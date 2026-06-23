import type { InputHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { cn } from '../lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  containerClassName?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, containerClassName, id, icon, ...props },
  ref,
) {
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
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          'trackdocs-input h-12 w-full trackdocs-text-ui text-sm transition duration-200 placeholder:text-[color:var(--td-text-muted)]',
          icon ? 'pl-11 pr-4' : 'px-4',
          error &&
            'border-[rgba(220,62,62,0.42)] focus:border-[rgba(220,62,62,0.65)] focus:shadow-[0_0_0_4px_rgba(220,62,62,0.12)]',
          className,
        )}
        {...props}
      />
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
