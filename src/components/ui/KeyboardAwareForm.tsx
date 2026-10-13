import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, ScrollViewProps, Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Spacing, Colors } from '@/constants/theme';

export interface FormContextValue {
  registerField: (id: string, ref: React.RefObject<any>) => void;
  unregisterField: (id: string) => void;
  onFieldFocus: (id: string) => void;
  onFieldBlur: (id: string) => void;
  scrollToField: (id: string) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext() {
  return useContext(FormContext);
}

export interface KeyboardAwareFormProps extends Omit<ScrollViewProps, 'children'> {
  children: React.ReactNode;
  bottomBar?: React.ReactNode;
  hideBottomBarOnKeyboard?: boolean;
  headerHeight?: number;
  extraKeyboardSpace?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

export function KeyboardAwareForm({
  children,
  bottomBar,
  hideBottomBarOnKeyboard = true,
  headerHeight = 64,
  extraKeyboardSpace = 80,
  containerStyle,
  contentContainerStyle,
  ...scrollViewProps
}: KeyboardAwareFormProps) {
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const contextValue: FormContextValue = {
    registerField: () => {},
    unregisterField: () => {},
    onFieldFocus: () => {},
    onFieldBlur: () => {},
    scrollToField: () => {},
  };

  const bottomInset = insets.bottom;
  const dynamicBottomPadding = (bottomBar ? 120 : 0) + Math.max(bottomInset, Spacing.md) + Spacing.lg;
  const showBottomBar = bottomBar && (!hideBottomBarOnKeyboard || !isKeyboardVisible);

  return (
    <FormContext.Provider value={contextValue}>
      <View style={[styles.container, containerStyle]}>
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            contentContainerStyle,
            { paddingBottom: dynamicBottomPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={extraKeyboardSpace}
          {...scrollViewProps as any}
        >
          {children}
        </KeyboardAwareScrollView>
        {showBottomBar && (
          <View style={styles.bottomBarContainer}>{bottomBar}</View>
        )}
      </View>
    </FormContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  bottomBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
