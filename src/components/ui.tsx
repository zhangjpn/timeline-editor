import React from 'react';

type BasicProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

type ButtonProps = BasicProps & {
  type?: 'primary' | 'danger' | 'text' | string;
  size?: 'small' | string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export const Container: React.FC<BasicProps> = ({ children, className, style }) => (
  <div className={className || 'app-container'} style={style}>{children}</div>
);

export const Header: React.FC<BasicProps> = ({ children, className, style }) => (
  <header className={className || 'app-header'} style={style}>{children}</header>
);

export const Main: React.FC<BasicProps> = ({ children, className, style }) => (
  <main className={className || 'app-main'} style={style}>{children}</main>
);

export const Card: React.FC<BasicProps & { onClick?: (event: React.MouseEvent<HTMLDivElement>) => void }> = ({
  children,
  className,
  style,
  onClick
}) => (
  <section className={className ? `ui-card ${className}` : 'ui-card'} style={style} onClick={onClick}>
    {children}
  </section>
);

export const Button: React.FC<ButtonProps> = ({ children, className, type, size, style, onClick }) => (
  <button
    className={[
      'ui-button',
      type ? `ui-button-${type}` : '',
      size ? `ui-button-${size}` : '',
      className || ''
    ].filter(Boolean).join(' ')}
    style={style}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
);

type FormComponent = React.FC<BasicProps & { labelWidth?: string }> & {
  Item: React.FC<BasicProps & { label?: string; required?: boolean }>;
};

export const Form: FormComponent = ({ children, className, style }) => (
  <div className={className || 'ui-form'} style={style}>{children}</div>
) as React.ReactElement;

Form.Item = ({ children, label, required, className, style }) => (
  <label className={className || 'ui-form-item'} style={style}>
    {label && <span className="ui-form-label">{label}{required ? ' *' : ''}</span>}
    <span className="ui-form-control">{children}</span>
  </label>
);

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> & {
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  size?: string;
  type?: string;
};

export const Input: React.FC<InputProps> = ({ value = '', onChange, type, rows, size, style, ...props }) => {
  if (type === 'textarea') {
    return (
      <textarea
        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        className="ui-input"
        rows={rows}
        value={value}
        style={style}
        onChange={(event) => onChange?.(event.target.value)}
      />
    );
  }

  return (
    <input
      {...props}
      className="ui-input"
      type={type || 'text'}
      value={value}
      style={style}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
};

export const Row: React.FC<BasicProps & { gutter?: number }> = ({ children, style }) => (
  <div className="ui-row" style={style}>{children}</div>
);

export const Col: React.FC<BasicProps & { span?: number }> = ({ children, span = 24, style }) => (
  <div className="ui-col" style={{ flex: `0 0 ${(span / 24) * 100}%`, ...style }}>{children}</div>
);

type DialogProps = BasicProps & {
  title: string;
  visible: boolean;
  width?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
};

export const Dialog: React.FC<DialogProps> = ({ title, visible, width, children, onCancel, onConfirm }) => {
  if (!visible) return null;

  return (
    <div className="ui-dialog-backdrop" onClick={onCancel}>
      <div className="ui-dialog" style={{ maxWidth: width }} onClick={(event) => event.stopPropagation()}>
        <div className="ui-dialog-header">
          <h3>{title}</h3>
          <Button type="text" onClick={onCancel}>Close</Button>
        </div>
        <div className="ui-dialog-body">{children}</div>
        {onConfirm && (
          <div className="ui-dialog-footer">
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" onClick={onConfirm}>OK</Button>
          </div>
        )}
      </div>
    </div>
  );
};

const toDateTimeLocal = (value?: Date) => {
  if (!value) return '';

  const date = value;
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

export const DatePicker: React.FC<{
  value?: Date;
  onChange?: (date?: Date) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  type?: string;
}> = ({ value, onChange, placeholder, style }) => (
  <input
    className="ui-input"
    type="datetime-local"
    value={toDateTimeLocal(value)}
    placeholder={placeholder}
    style={style}
    onChange={(event) => onChange?.(event.target.value ? new Date(event.target.value) : undefined)}
  />
);

export const ColorPicker: React.FC<{
  value?: string;
  onChange?: (color: string) => void;
}> = ({ value = '#409eff', onChange }) => (
  <input className="ui-color" type="color" value={value} onChange={(event) => onChange?.(event.target.value)} />
);

export const Slider: React.FC<{
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  style?: React.CSSProperties;
  showInput?: boolean;
}> = ({ value = 0, min = 0, max = 100, step = 1, onChange, style, showInput }) => (
  <span className="ui-slider" style={style}>
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onChange?.(Number(event.target.value))}
    />
    {showInput && (
      <input
        className="ui-number"
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange?.(Number(event.target.value))}
      />
    )}
  </span>
);

export const Switch: React.FC<{
  value?: boolean;
  onChange?: (value: boolean) => void;
}> = ({ value = false, onChange }) => (
  <input type="checkbox" checked={value} onChange={(event) => onChange?.(event.target.checked)} />
);

type SelectComponent = React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  children?: React.ReactNode;
}> & {
  Option: React.FC<{ label: string; value: string; children?: React.ReactNode }>;
};

export const Select: SelectComponent = ({ value = '', onChange, placeholder, allowClear, children }) => (
  <select className="ui-input" value={value || ''} onChange={(event) => onChange?.(event.target.value)}>
    {allowClear && <option value="">{placeholder || 'None'}</option>}
    {children}
  </select>
) as React.ReactElement;

Select.Option = ({ label, value }) => <option value={value}>{label}</option>;

export const Upload: React.FC<{
  beforeUpload: (file: File) => boolean;
  showFileList?: boolean;
  accept?: string;
  children?: React.ReactNode;
}> = ({ beforeUpload, accept, children }) => (
  <label className="ui-upload">
    {children}
    <input
      type="file"
      accept={accept}
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) beforeUpload(file);
        event.target.value = '';
      }}
    />
  </label>
);

export const Icon: React.FC<{ name: string }> = ({ name }) => <span aria-hidden="true">{name}</span>;

export const Message = {
  success: (message: string) => window.alert(message),
  error: (message: string) => window.alert(message)
};

export const Modal = Dialog;
export const Tabs: React.FC<BasicProps> = ({ children }) => <div>{children}</div>;
export const TabPane: React.FC<BasicProps> = ({ children }) => <div>{children}</div>;
