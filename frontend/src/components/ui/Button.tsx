import type { ButtonHTMLAttributes } from 'react'

import '../../styles/ui.css'

type ButtonVariant = 'primary' | 'secondary'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual style of the button. */
  variant?: ButtonVariant
}

export function Button({
  variant = 'primary',
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  return <button type={type} className={classes} {...rest} />
}
