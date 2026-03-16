import { NumericFormat } from 'react-number-format';

import { Input } from '@/components/ui/input';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CurrencyInput({ value, onChange, placeholder = '0,00' }: CurrencyInputProps) {
  return (
    <NumericFormat
      value={value}
      customInput={Input}
      allowNegative={false}
      decimalScale={2}
      fixedDecimalScale
      decimalSeparator=","
      thousandSeparator="."
      prefix="R$ "
      placeholder={placeholder}
      onValueChange={(values) => onChange(values.value)}
    />
  );
}
