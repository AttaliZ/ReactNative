// app/(tabs)/src/components/CustomTextInput.tsx
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import {
    NativeSyntheticEvent,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TextInputSubmitEditingEventData,
    View,
} from 'react-native';

interface CustomTextInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  required?: boolean;

  // โฟกัสช่องถัดไป
  refKey?: string;
  nextRefKey?: string;
  inputRefs?: React.MutableRefObject<{ [key: string]: TextInput | null }>;
  focusNextInput?: (nextRefKey: string) => void;
}

const CustomTextInput = forwardRef<TextInput, CustomTextInputProps>(
  (
    {
      label,
      value,
      onChangeText,
      placeholder,
      required,
      secureTextEntry,
      keyboardType,
      multiline,
      numberOfLines,
      refKey,
      nextRefKey,
      inputRefs,
      focusNextInput,
      returnKeyType = 'next',
      onSubmitEditing,
      autoComplete,
      textContentType,
      autoFocus,
      style,
      autoCapitalize,
      autoCorrect,
      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => inputRef.current as TextInput);

    useEffect(() => {
      if (refKey && inputRefs) {
        inputRefs.current[refKey] = inputRef.current;
        return () => {
          inputRefs.current[refKey] = null;
        };
      }
    }, [refKey, inputRefs]);

    // default ที่เหมาะกับ username/email/password
    const isCredentialField =
      textContentType === 'username' ||
      textContentType === 'emailAddress' ||
      textContentType === 'password' ||
      keyboardType === 'email-address';

    const computedAutoCapitalize =
      autoCapitalize ?? (isCredentialField ? 'none' : 'sentences');

    const computedAutoCorrect =
      typeof autoCorrect === 'boolean' ? autoCorrect : !isCredentialField;

    // ถ้ามี nextRefKey หรือ returnKeyType === 'next' ไม่ควร blur ตอน submit
    const shouldBlurOnSubmit =
      (nextRefKey ? true : false) || returnKeyType === 'next' ? false : true;

    const handleSubmitEditing = (
      e: NativeSyntheticEvent<TextInputSubmitEditingEventData>
    ) => {
      if ((nextRefKey || returnKeyType === 'next') && focusNextInput && nextRefKey) {
        // ไปโฟกัสช่องถัดไป แทนที่จะ blur
        focusNextInput(nextRefKey);
      } else if (onSubmitEditing) {
        // ส่ง event ต่อให้ผู้ใช้คอมโพเนนต์
        onSubmitEditing(e);
      }
    };

    // บนเว็บ บางครั้ง onSubmitEditing อาจไม่ทำงานตามคาดเมื่อกด Enter
    // จึงดัก keypress เพื่อให้ประสบการณ์เหมือน input บนเว็บ
    const handleKeyPress = (e: any) => {
      if (Platform.OS !== 'web') return;
      const key = e?.nativeEvent?.key;
      const isEnter = key === 'Enter';
      const isShiftPressed = e?.nativeEvent?.shiftKey;

      if (!multiline && isEnter && !isShiftPressed) {
        e.preventDefault && e.preventDefault();
        if ((nextRefKey || returnKeyType === 'next') && focusNextInput && nextRefKey) {
          focusNextInput(nextRefKey);
        } else if (onSubmitEditing) {
          // สร้างอีเวนต์เทียมแบบง่าย ๆ ให้ใช้งานต่อได้
          onSubmitEditing(e);
        }
      }
    };

    return (
      <View style={styles.container}>
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>

        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            isFocused && styles.inputFocused,
            style, // allow overriding styles fromภายนอก
          ]}
          value={value ?? ''} // กัน undefined/null
          onChangeText={(t) => onChangeText(t ?? '')}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          returnKeyType={returnKeyType}
          onSubmitEditing={handleSubmitEditing}
          onKeyPress={handleKeyPress}
          autoComplete={autoComplete}
          textContentType={textContentType as any}
          autoFocus={autoFocus}
          autoCapitalize={computedAutoCapitalize}
          autoCorrect={computedAutoCorrect}
          blurOnSubmit={shouldBlurOnSubmit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest} // ส่งต่อ prop อื่น ๆ ทั้งหมด
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default React.memo(CustomTextInput);
export { CustomTextInput };

