import React from 'react';
import { Text, TextProps } from 'react-native';
import { formatCurrency } from '@/lib/finance';

interface MoneyProps extends TextProps {
  amount: number | null | undefined;
}

export function Money({ amount, style, ...props }: MoneyProps) {
  return (
    <Text style={style} {...props}>
      {formatCurrency(amount)}
    </Text>
  );
}
