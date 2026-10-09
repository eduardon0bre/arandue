import React from 'react';

export default function FormInput({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error = null,
  helperText = null,
  rows = 3,
  min,
  max,
  step,
  disabled = false,
  className = ''
}) {
  const inputId = id || name;
  const isTextarea = type === 'textarea';

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required" title="Campo obrigatório">*</span>}
        </label>
      )}

      {isTextarea ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={`form-textarea ${error ? 'error' : ''}`}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`form-input ${error ? 'error' : ''}`}
        />
      )}

      {error && <span className="form-error">{error}</span>}
      {helperText && !error && <span className="form-helper">{helperText}</span>}
    </div>
  );
}
