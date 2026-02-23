import React from 'react';

const variantStyles = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  accent: 'bg-accent/20 text-dark-700 border-accent/30',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-orange-100 text-orange-700 border-orange-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  gray: 'bg-light-200 text-dark-500 border-light-300',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-medium rounded-full border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
}

export default Badge;
