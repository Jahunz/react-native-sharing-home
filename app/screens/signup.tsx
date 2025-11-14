import { AppIcon } from '@/components/AppIcon';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import Routes from '../constants/Routes';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import StyledInput from '../components/commons/StyledInput';
import StyledButton from '../components/commons/StyledButton';
import { storeData } from '../storage/async_storage';
import { upsertUser, normalizePhone } from '../storage/users';

export default function SignUpScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');

  const handleSignUp = async () => {
    // Handle sign up logic here
    if (password !== confirmedPassword) {
      console.log('Passwords do not match');
      return;
    }
    console.log('Sign up:', { phoneNumber, password });
  // Persist phone number for the new user so Profile can show it
  try {
  await storeData('userPhone', phoneNumber);
  // Persist a basic per-phone profile placeholder (no address)
  const normalized = normalizePhone(phoneNumber || '');
  const profileKey = normalized ? `profile:${normalized}` : 'profile';
  await storeData(profileKey, JSON.stringify({ firstName: '', lastName: '' }));
  // Default new users to room_member role and persist
  await storeData('userRole', 'room_member');

    // Ensure the users table contains this account
    try {
      await upsertUser({ phoneNumber, name: '', role: 'room_member' });
    } catch (e) {
      console.error('Error updating local users list on signup', e);
    }

    // After sign up, navigate to welcome as logged-in member
    router.replace(Routes.WELCOME as any);
  } catch (e) {
    console.error('Error during sign up persist', e);
    router.back();
  }
  };

  return (
    <Box className="flex-1 bg-gray-50 items-center justify-center px-6">
      <View className="bg-white rounded-3xl p-8 w-full max-w-md shadow-lg"> 
        <View className="mb-8 items-center">
          <AppIcon size="md" />
        </View>

        <StyledInput
          label="Phone number"
          value={phoneNumber}
          onChangeText={(value) => setPhoneNumber(value)}
        />

        <StyledInput
          label="Password"
          value={password}
          onChangeText={(value) => setPassword(value)}
          secureTextEntry={true}
        />

        <StyledInput
          label="Confirmed password"
          value={confirmedPassword}
          onChangeText={(value) => setConfirmedPassword(value)}
          secureTextEntry={true}
        />

        <StyledButton 
          onPress={handleSignUp} 
          buttonClassName="w-full h-12"
          size="lg"
          buttonText='Sign up'
        />

        <View className="flex-row justify-center mt-4">
          <Text size="sm" className="text-gray-600">
            You already have account ?{' '}
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text size="sm" weight="semibold">
              Login
            </Text>
          </Pressable>
        </View>
      </View>
    </Box>
  );
}

