'use client';

import * as React from 'react';
import { Input, type InputProps } from '@/components/ui/input';

interface CurrencyInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value: number;
  onValueChange: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    const format = (num: number) => {
      if (isNaN(num)) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(num);
    };

    React.useEffect(() => {
      // Update display value only if the internal value is different
      const numericDisplayValue = parseFloat(displayValue.replace(/[^0-9]/g, '')) / 100;
      if (value !== numericDisplayValue) {
        setDisplayValue(format(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^0-9]/g, '');
      const numericValue = rawValue ? parseInt(rawValue, 10) / 100 : 0;
      
      onValueChange(numericValue);
      setDisplayValue(format(numericValue));
    };
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (value === 0) {
            setDisplayValue('');
        } else {
            setDisplayValue(format(value));
        }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (displayValue === '' || value === 0) {
             setDisplayValue(format(value || 0));
        }
    }


    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="R$ 0,00"
        type="text"
        inputMode="decimal"
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
