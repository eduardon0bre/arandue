import React from 'react';

export default function FormSelect({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  required = false,
  error = null,
  helperText = null,
  placeholder = 'Selecione uma opção...',
  disabled = false,
  className = ''
}) {
  const selectId = id || name;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && <span className="required" title="Campo obrigatório">*</span>}
        </label>
      )}

      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`form-select ${error ? 'error' : ''}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => {
          const optValue = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={optValue} value={optValue}>
              {optLabel}
            </option>
          );
        })}
      </select>

      {error && <span className="form-error">{error}</span>}
      {helperText && !error && <span className="form-helper">{helperText}</span>}
    </div>
  );
}
