import React, { useState } from 'react';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';

/**
 * Reusable accessible PasswordInput with show/hide toggle.
 *
 * @param {object} props
 * @param {string} [props.id]
 * @param {string} [props.name]
 * @param {string} props.value
 * @param {function} props.onChange
 * @param {string} [props.placeholder="••••••••"]
 * @param {boolean} [props.required=false]
 * @param {string} [props.autoComplete="current-password"]
 * @param {string} [props.className=""]
 * @param {boolean} [props.disabled=false]
 * @param {number} [props.minLength]
 * @param {string} [props.label]
 * @param {string} [props.error]
 */
const PasswordInput = ({
  id,
  name = 'password',
  value,
  onChange,
  placeholder = '••••••••',
  required = false,
  autoComplete = 'current-password',
  className = '',
  disabled = false,
  minLength,
  label,
  error,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold text-neutral-700 uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          minLength={minLength}
          className={`w-full border-2 border-neutral-900 rounded-xl px-3.5 py-2.5 pr-11 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-lime-400 bg-white text-neutral-900 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:bg-neutral-100 ${
            error ? 'border-rose-500 ring-1 ring-rose-400' : ''
          } ${className}`}
          {...rest}
        />

        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          tabIndex={0}
          className="absolute right-3 p-1 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer rounded focus:outline-none focus:ring-2 focus:ring-lime-400 disabled:opacity-40"
        >
          {showPassword ? (
            <IoEyeOffOutline className="w-5 h-5" aria-hidden="true" />
          ) : (
            <IoEyeOutline className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-600 mt-0.5">{error}</p>
      )}
    </div>
  );
};

export default PasswordInput;
