import { DrawerLayout } from '@/components/DrawerLayout';
import { CheckIcon, Icon, EditIcon } from '@/components/ui/icon';
import { Input, InputField, InputSlot } from '@/components/ui/input';

import { Text } from '@/components/ui/text';
import React, { useState, useEffect } from 'react';
import { Pressable, ScrollView, View, Image, Alert } from 'react-native';
import { getData, storeData } from '@/app/storage/async_storage';
import { upsertUser, normalizePhone, findUserByPhone } from '../storage/users';
import { useRouter } from 'expo-router';

interface ProfileFieldProps {
  value: string;
  onEdit: (value: string) => void;
}

function ProfileField({ value, onEdit }: ProfileFieldProps) {
  const [editing, setEditing] = useState(false);
  return (
    <View className="bg-gray-50 rounded-xl py-4 mb-3 flex-row items-center justify-between">
      {!editing ? (
        <>
          <Text size="md" className="text-gray-800 pl-4">{value}</Text>
          <Pressable onPress={() => setEditing(true)}>
            <Icon as={EditIcon} size="lg" className="text-blue-500 mr-4" />
          </Pressable>
        </>
      ) : (
        <>
          <Input variant="outline" className="flex-1 mr-2">
            <InputField value={value} onChangeText={onEdit} />
            <InputSlot>
              <Pressable onPress={() => setEditing(false)}>
                <Icon as={CheckIcon} size="lg" className="text-green-500 mr-2 border-1 border-green-500 rounded-full p-1" />
              </Pressable>
            </InputSlot>
          </Input>
        </>
      )}
    </View>
  );
}
export default function ProfileScreen() {
  const [profile, setProfile] = useState({
    name: '',
  });
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const router = useRouter();

  const handleEdit = (value: string) => {
    setProfile((profile) => {
      const updated = { ...profile, name: value };
      (async () => {
        try {
          // Persist profile per-phone when possible to avoid a global device profile
          const phone = await getData('userPhone');
          const normalized = normalizePhone(phone || '');
          const profileKey = normalized ? `profile:${normalized}` : 'profile';
          await storeData(profileKey, JSON.stringify(updated));
          // Also reflect the display name into the local `users` directory
          try {
            const phone = await getData('userPhone');
            if (phone) {
              const name = (updated.name || '').trim();
              await upsertUser({ phoneNumber: phone, name });
            }
          } catch (e) {
            console.error('Error updating users list with profile name', e);
          }
        } catch (e) {
          console.error('Error saving profile', e);
        }
      })();
      return updated;
    });
  };

  const handleChangePhoto = () => {
    (async () => {
      try {
        // dynamic import so the app doesn't crash if the dependency isn't installed
        // @ts-ignore: optional dependency may not be installed in all environments
        const ImagePicker: any = await import('expo-image-picker');

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Permission to access media library is required to choose a photo.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });

        const uri = result && (result.assets && result.assets.length > 0 ? (result.assets[0].uri || (result as any).uri) : (result as any).uri);
        if (!uri) return;

        setPhotoUri(uri as string);
        try {
          // Persist profile photo per-phone when possible
          const phone = await getData('userPhone');
          const normalized = normalizePhone(phone || '');
          const photoKey = normalized ? `profilePhoto:${normalized}` : 'profilePhoto';
          await storeData(photoKey, uri as string);
          const verify = await getData(photoKey);
          console.log('[profile] saved profilePhoto ->', verify);
          if (!verify) {
            Alert.alert('Save failed', 'Could not persist profile photo.');
            return;
          }

          // Update users table and members lists
          try {
            const phone = await getData('userPhone');
            if (phone) {
              await upsertUser({ phoneNumber: phone, name: '', avatar: uri });
            }
          } catch (e) {
            console.error('Error updating users list with avatar', e);
          }

          try {
            const rawRooms = await getData('rooms');
            const rooms = rawRooms ? JSON.parse(rawRooms) : [];
            const currentPhone = await getData('userPhone');
            const normalizedPhone = normalizePhone(currentPhone || '');
            for (const r of rooms) {
              try {
                const key = `members:${r.id}`;
                const rawMembers = await getData(key);
                if (!rawMembers) continue;
                const list = JSON.parse(rawMembers);
                let changed = false;
                const updated = list.map((m: any) => {
                  if ((m.phoneNumber || '') === normalizedPhone) {
                    changed = true;
                    return { ...m, avatar: uri };
                  }
                  return m;
                });
                if (changed) {
                  await storeData(key, JSON.stringify(updated));
                }
              } catch (e) {
                // ignore per-room update errors
              }
            }
          } catch (e) {
            console.error('Error updating members lists with avatar', e);
          }
        } catch (e) {
          console.error('Error saving profilePhoto', e);
          Alert.alert('Save failed', 'Could not persist profile photo.');
        }
      } catch (e) {
        console.error('Error opening image picker', e);
        Alert.alert(
          'Choose photo failed',
          'Please install expo-image-picker: run "npm install expo-image-picker" and rebuild the app.'
        );
      }
    })();
  };

  const handleResetAsyncData = () => {
    Alert.alert(
      'Reset app data',
      'This will clear all local app data (users, profiles, rooms, invoices, etc.). This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Use AsyncStorage directly to clear all keys
              // dynamic require to avoid bundling issues in some environments
              // @ts-ignore
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.clear();
              // Reset local state
              setProfile({ name: '' });
              setPhotoUri(null);
              setPhoneNumber('');
              // Navigate to welcome screen to reflect cleared state
              try {
                router.replace('/');
              } catch (e) {
                // ignore navigation errors
              }
              Alert.alert('Reset complete', 'Local app data has been cleared.');
            } catch (e) {
              console.error('Error clearing AsyncStorage', e);
              Alert.alert('Reset failed', 'Could not clear app data. See console for details.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Load persisted profile info (phone, profile, photo)
  useEffect(() => {
    (async () => {
      try {
        const phone = await getData('userPhone');
        if (phone) setPhoneNumber(phone);
        // Prefer a per-phone users record for name/avatar if available.
        const user = await findUserByPhone(phone || undefined);
        if (user) {
          // If the user record has a name or avatar, use them to populate the profile.
          if (user.name) {
            setProfile((p) => ({ ...p, name: user.name }));
          }
          if (user.avatar) {
            setPhotoUri(user.avatar);
          }
        }

        // Load per-phone persisted profile/photo if available. Do NOT fall back to
        // the device-global `profile`/`profilePhoto` keys — profiles must be
        // tied to phone numbers to avoid leaking previous user's data.
        try {
          const normalized = normalizePhone(phone || '');
          if (normalized) {
            const profileKey = `profile:${normalized}`;
            const photoKey = `profilePhoto:${normalized}`;
            const profileJsonP = await getData(profileKey);
            if (profileJsonP) {
              const parsed = JSON.parse(profileJsonP);
              // Support legacy firstName/lastName stored objects by merging into `name`
              if (parsed.name) {
                setProfile((p) => ({ ...p, ...parsed }));
              } else if (parsed.firstName || parsed.lastName) {
                const name = ((parsed.firstName || '') + ' ' + (parsed.lastName || '')).trim();
                setProfile((p) => ({ ...p, name }));
              } else {
                setProfile((p) => ({ ...p, ...parsed }));
              }
            }
            const savedPhoto = await getData(photoKey);
            if (savedPhoto) setPhotoUri(savedPhoto);
          }
        } catch (e) {
          console.error('Error loading per-phone profile', e);
        }
      } catch (e) {
        console.error('Error loading persisted profile', e);
      }
    })();
  }, []);

  return (
    <DrawerLayout title="Profile" showNotificationIcon={true}>
      <ScrollView className="flex-1 px-4 pt-6">
        {/* Profile Card */}
        <View className="bg-white rounded-3xl p-8 shadow-sm mb-4">
          {/* Profile Picture */}
          <View className="items-center mb-6">
            <View className="relative">
              {/* Circular Profile Image */}
              <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: 128, height: 128, borderRadius: 999 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-gray-100 items-center justify-center">
                    <Text size="3xl" className="text-gray-400">👤</Text>
                  </View>
                )}
              </View>
              
              {/* Camera Button */}
              <Pressable 
                onPress={handleChangePhoto}
                className="absolute bottom-0 right-0 bg-white rounded-full w-10 h-10 items-center justify-center shadow-lg border-2 border-gray-100"
              >
                <Text size="lg">📷</Text>
              </Pressable>
            </View>
          </View>

          {/* Phone Number */}
          <View className="items-center mb-8">
            <Text size="lg" weight="medium" className="text-gray-800">
              {phoneNumber}
            </Text>
          </View>

          {/* Profile Fields */}
          <View>
              <ProfileField
                value={profile.name}
                onEdit={(value) => handleEdit(value)}
              />
            {/* Address field removed per request */}
          </View>
        </View>
        <View className="px-4 mt-4">
          <Pressable
            onPress={handleResetAsyncData}
            className="bg-red-500 rounded-2xl p-3 items-center justify-center"
          >
            <Text size="md" className="text-white">Reset local app data</Text>
          </Pressable>
        </View>
      </ScrollView>
    </DrawerLayout>
  );
}

