import React, { useState, ReactNode } from 'react';
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Text } from '@/components/ui/text';
import { Icon, EyeIcon, EyeOffIcon } from '@/components/ui/icon';
import { ActivityIndicator } from 'react-native';

interface StyledInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  secureTextEntry?: boolean;
  onChangeText: (text: string) => void;
  // optional end/icon slot to allow an action (like a search icon) inside the input
  endIcon?: ReactNode;
  onEndIconPress?: () => void;
  endIconDisabled?: boolean;
}
export default function StyledInput({label, placeholder, value, secureTextEntry, onChangeText, endIcon, onEndIconPress, endIconDisabled, onFocus, onBlur}: StyledInputProps & { onFocus?: () => void; onBlur?: () => void }) {
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = !!secureTextEntry && !showPassword;

  return (
    <>
      {label && <Text size="sm" className="text-gray-600 my-2">{label}</Text>}
      <Input variant="outline" className="mb-4 h-14">
        <InputField
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          secureTextEntry={isSecure}
        />
        {endIcon ? (
          <InputSlot onPress={() => { if (!endIconDisabled && onEndIconPress) onEndIconPress(); }}>
            {/* If caller passes a loader inside endIcon that's okay; otherwise render as provided */}
            {endIcon}
          </InputSlot>
        ) : secureTextEntry ? (
          <InputSlot onPress={() => setShowPassword(prev => !prev)}>
            <Icon as={showPassword ? EyeOffIcon : EyeIcon} size="md" className="text-typography-500 mr-3" />
          </InputSlot>
        ) : null}
      </Input>
    </>
  );
}