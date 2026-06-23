import type { ReactNode, SelectHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '../lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  containerClassName?: string
  children: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, hint, error, containerClassName, id, children, ...props },
  ref,
) {
  const control = (
      <select
      ref={ref}
      id={id}
      aria-invalid={Boolean(error) || undefined}
      className={cn(
        'trackdocs-input trackdocs-text-ui h-12 w-full appearance-none px-4 pr-10 text-sm transition duration-200 placeholder:text-[color:var(--td-text-muted)]',
        error &&
          'border-[rgba(220,62,62,0.42)] focus:border-[rgba(220,62,62,0.65)] focus:shadow-[0_0_0_4px_rgba(220,62,62,0.12)]',
        className,
      )}
      {...props}
    >
      {children}
    </select>
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
