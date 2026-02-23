import React from 'react';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary: 'bg-primary text-white hover:bg-primary-600 active:bg-primary-700',
  secondary: 'bg-secondary text-white hover:bg-secondary-600 active:bg-secondary-700',
  accent: 'bg-accent text-dark hover:bg-accent-500 active:bg-accent-600',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  ghost: 'text-dark hover:bg-light-200',
  danger: 'bg-coral text-white hover:bg-red-500 active:bg-red-600',
  success: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-xl
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;

  const classes = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      )}
      {children}
    </button>
  );
}

export default Button;
