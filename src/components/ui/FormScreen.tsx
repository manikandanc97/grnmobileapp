import React from 'react';
import { ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { KeyboardAwareForm, KeyboardAwareFormProps } from '@/components/ui/KeyboardAwareForm';

export interface FormScreenProps extends Omit<KeyboardAwareFormProps, 'children'> {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  wrapperStyle?: StyleProp<ViewStyle>;
}

export function FormScreen({
  title,
  subtitle,
  showBack = true,
  headerRight,
  children,
  bottomBar,
  hideBottomBarOnKeyboard = true,
  wrapperStyle,
  ...keyboardAwareFormProps
}: FormScreenProps) {
  return (
    <ScreenWrapper style={[styles.wrapper, wrapperStyle]} withBottomInset={false}>
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        actionButton={headerRight}
      />
      <KeyboardAwareForm
        bottomBar={bottomBar}
        hideBottomBarOnKeyboard={hideBottomBarOnKeyboard}
        {...keyboardAwareFormProps}
      >
        {children}
      </KeyboardAwareForm>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
