import React from 'react';

export function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  hover = false,
  onClick,
}) {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  const classes = `
    bg-white rounded-2xl
    ${paddingStyles[padding]}
    ${shadowStyles[shadow]}
    ${hover ? 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-dark ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-light-300 ${className}`}>
      {children}
    </div>
  );
}

export default Card;
