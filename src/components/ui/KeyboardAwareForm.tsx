import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Keyboard,
  Platform,
  Dimensions,
  ScrollViewProps,
  ViewStyle,
  StyleProp,
  TouchableWithoutFeedback,
  EmitterSubscription,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '@/constants/theme';

// ==========================================
// Form Context for Focus Tracking & Scrolling
// ==========================================

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

// ==========================================
// KeyboardAwareForm Props
// ==========================================

export interface KeyboardAwareFormProps extends Omit<ScrollViewProps, 'children'> {
  children: React.ReactNode;
  /**
   * Optional bottom action bar (e.g. <BottomActionBar> with Cancel/Save buttons).
   */
  bottomBar?: React.ReactNode;
  /**
   * If true, hides the bottom action bar while the software keyboard is open.
   * This gives 100% of the visible viewport to the form content and active field.
   * Default: true.
   */
  hideBottomBarOnKeyboard?: boolean;
  /**
   * Estimated header height for calculating visible viewport. Default: 64.
   */
  headerHeight?: number;
  /**
   * Extra breathing room in pixels above keyboard for the focused field. Default: 20.
   */
  extraKeyboardSpace?: number;
  /**
   * Optional container style.
   */
  containerStyle?: StyleProp<ViewStyle>;
}

// ==========================================
// KeyboardAwareForm Component
// ==========================================

export function KeyboardAwareForm({
  children,
  bottomBar,
  hideBottomBarOnKeyboard = true,
  headerHeight = 64,
  extraKeyboardSpace = 24,
  containerStyle,
  contentContainerStyle,
  ...scrollViewProps
}: KeyboardAwareFormProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef<number>(0);
  const fieldRefs = useRef<Map<string, React.RefObject<any>>>(new Map());
  const activeFieldIdRef = useRef<string | null>(null);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardHeightRef = useRef<number>(0);

  // Keep keyboardHeightRef up to date
  useEffect(() => {
    keyboardHeightRef.current = keyboardHeight;
  }, [keyboardHeight]);

  // Track scroll position
  const handleScroll = useCallback((event: any) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  // Measure and scroll a specific field into view
  const scrollToFieldInternal = useCallback(
    (fieldRef: React.RefObject<any>, currentKbHeight?: number) => {
      const node = fieldRef.current;
      if (!node || typeof node.measureInWindow !== 'function') return;

      const kbHeight = currentKbHeight ?? keyboardHeightRef.current;
      if (kbHeight <= 0) return;

      node.measureInWindow((x: number, y: number, width: number, height: number) => {
        // Guard against unmounted or zero-size elements
        if (width === 0 && height === 0) return;

        const windowHeight = Dimensions.get('window').height;
        const headerBottom = insets.top + headerHeight;
        const keyboardTop = windowHeight - kbHeight;

        // Space needed above keyboard
        const visibleBottom = keyboardTop - extraKeyboardSpace;
        const fieldBottom = y + height;
        const fieldTop = y;

        // If the bottom of the field (or its label/container) is below the visible area
        if (fieldBottom > visibleBottom) {
          const overlap = fieldBottom - visibleBottom;
          const targetY = Math.max(0, scrollYRef.current + overlap + 16);
          scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
        } else if (fieldTop < headerBottom + 12) {
          // If field is scrolled up behind the header
          const underHeader = headerBottom + 12 - fieldTop;
          const targetY = Math.max(0, scrollYRef.current - underHeader);
          scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
        }
      });
    },
    [extraKeyboardSpace, headerHeight, insets.top]
  );

  // Focus and register handlers for FormContext
  const registerField = useCallback((id: string, ref: React.RefObject<any>) => {
    fieldRefs.current.set(id, ref);
  }, []);

  const unregisterField = useCallback((id: string) => {
    fieldRefs.current.delete(id);
    if (activeFieldIdRef.current === id) {
      activeFieldIdRef.current = null;
    }
  }, []);

  const onFieldFocus = useCallback(
    (id: string) => {
      activeFieldIdRef.current = id;
      const ref = fieldRefs.current.get(id);
      if (!ref) return;

      // If keyboard is already open, measure and scroll immediately
      if (keyboardHeightRef.current > 0) {
        requestAnimationFrame(() => {
          scrollToFieldInternal(ref, keyboardHeightRef.current);
        });
      }
    },
    [scrollToFieldInternal]
  );

  const onFieldBlur = useCallback((id: string) => {
    if (activeFieldIdRef.current === id) {
      activeFieldIdRef.current = null;
    }
  }, []);

  const scrollToField = useCallback(
    (id: string) => {
      const ref = fieldRefs.current.get(id);
      if (ref) {
        scrollToFieldInternal(ref);
      }
    },
    [scrollToFieldInternal]
  );

  // Setup Keyboard Event Listeners
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      const height = e?.endCoordinates?.height || 0;
      setKeyboardHeight(height);
      setKeyboardVisible(true);
      keyboardHeightRef.current = height;

      // If a field is currently focused, scroll it into view
      if (activeFieldIdRef.current) {
        const ref = fieldRefs.current.get(activeFieldIdRef.current);
        if (ref) {
          // Delay briefly to allow Android adjustResize or iOS layout transition to settle
          setTimeout(() => {
            scrollToFieldInternal(ref, height);
          }, Platform.OS === 'android' ? 60 : 30);
        }
      }
    };

    const onHide = () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
      keyboardHeightRef.current = 0;
    };

    const showSubscription: EmitterSubscription = Keyboard.addListener(showEvent, onShow);
    const hideSubscription: EmitterSubscription = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      // Dismiss keyboard on unmount to prevent lingering keyboards
      Keyboard.dismiss();
    };
  }, [scrollToFieldInternal]);

  // Calculate dynamic bottom padding for ScrollView content
  const dynamicBottomPadding = keyboardVisible
    ? keyboardHeight + Spacing.lg
    : insets.bottom + (bottomBar ? 80 : Spacing.xl);

  const contextValue: FormContextValue = {
    registerField,
    unregisterField,
    onFieldFocus,
    onFieldBlur,
    scrollToField,
  };

  const shouldRenderBottomBar = Boolean(bottomBar) && (!hideBottomBarOnKeyboard || !keyboardVisible);

  return (
    <FormContext.Provider value={contextValue}>
      <View style={[styles.container, containerStyle]}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            contentContainerStyle,
            { paddingBottom: dynamicBottomPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          {...scrollViewProps}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.innerContainer}>{children}</View>
          </TouchableWithoutFeedback>
        </ScrollView>

        {shouldRenderBottomBar && (
          <View style={styles.bottomBarContainer}>{bottomBar}</View>
        )}
      </View>
    </FormContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  innerContainer: {
    flex: 1,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
