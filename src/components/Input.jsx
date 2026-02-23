import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  labelClassName = '',
  type = 'text',
  id,
  required = false,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyles = `
    w-full px-4 py-3
    bg-white border-2 border-light-300
    rounded-xl
    text-dark placeholder-gray-400
    transition-all duration-200
    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
    disabled:bg-light-100 disabled:cursor-not-allowed
  `;

  const errorStyles = error
    ? 'border-secondary focus:border-secondary focus:ring-secondary/20'
    : '';

  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block mb-2 text-sm font-medium text-dark-700 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-secondary ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`${baseStyles} ${errorStyles} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-sm text-secondary"
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p
          id={`${inputId}-helper`}
          className="mt-1.5 text-sm text-dark-400"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export function TextArea({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  labelClassName = '',
  id,
  rows = 4,
  required = false,
  ...props
}) {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyles = `
    w-full px-4 py-3
    bg-white border-2 border-light-300
    rounded-xl
    text-dark placeholder-gray-400
    transition-all duration-200
    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
    disabled:bg-light-100 disabled:cursor-not-allowed
    resize-none
  `;

  const errorStyles = error
    ? 'border-secondary focus:border-secondary focus:ring-secondary/20'
    : '';

  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block mb-2 text-sm font-medium text-dark-700 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-secondary ml-1">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`${baseStyles} ${errorStyles} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-sm text-secondary"
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p
          id={`${inputId}-helper`}
          className="mt-1.5 text-sm text-dark-400"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

export function Select({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  labelClassName = '',
  id,
  options = [],
  required = false,
  placeholder = 'Seleccionar...',
  ...props
}) {
  const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyles = `
    w-full px-4 py-3
    bg-white border-2 border-light-300
    rounded-xl
    text-dark
    transition-all duration-200
    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
    disabled:bg-light-100 disabled:cursor-not-allowed
    appearance-none
    bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")] bg-[position:right_0.75rem_center] bg-no-repeat bg-[length:1.5em_1.5em] pr-10
  `;

  const errorStyles = error
    ? 'border-secondary focus:border-secondary focus:ring-secondary/20'
    : '';

  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block mb-2 text-sm font-medium text-dark-700 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-secondary ml-1">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={`${baseStyles} ${errorStyles} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-sm text-secondary"
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p
          id={`${inputId}-helper`}
          className="mt-1.5 text-sm text-dark-400"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

export default Input;
