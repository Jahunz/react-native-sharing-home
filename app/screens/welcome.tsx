import React from 'react';
import { View, Alert } from 'react-native';
import { DrawerLayout } from '@/components/DrawerLayout';
import { Button, ButtonText } from '@/components/ui/button';
import { Text, Heading } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import Routes from '../constants/Routes';
import { storeData, getData } from '../storage/async_storage';
import { upsertUser, setUserRole, normalizePhone } from '../storage/users';
import { useEffect } from 'react';

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // If the user already has a role or is member of rooms, redirect them
    (async () => {
      try {
        const role = await getData('userRole');
        if (role === 'home_master') {
          router.replace(Routes.HOME_MASTER_DASHBOARD as any);
          return;
        }

        // For room members, check persisted membership
        const userPhone = (await getData('userPhone')) || '';
        if (!userPhone) return;

        const rawRooms = await getData('rooms');
        const parsed = rawRooms ? JSON.parse(rawRooms) : [];
        const memberRooms: any[] = [];
        for (const r of parsed) {
          try {
            const membersRaw = await getData(`members:${r.id}`);
            const members = membersRaw ? JSON.parse(membersRaw) : [];
            if (members.find((m: any) => m.phoneNumber === userPhone)) {
              memberRooms.push(r);
            }
          } catch (e) {
            // ignore per-room errors
          }
        }

        if (memberRooms.length === 1) {
          const only = memberRooms[0];
          router.replace({
            pathname: Routes.ROOM_MEMBER_ROOM_DETAIL_MEMBERS as any,
            params: { roomId: String(only.id), roomName: only.name },
          } as any);
          return;
        }

        if (memberRooms.length > 1) {
          router.replace(Routes.ROOM_MEMBER_DASHBOARD as any);
          return;
        }
      } catch (e) {
        // ignore and show welcome
      }
    })();
  }, []);

  const handleJoinQR = () => {
    router.push(Routes.JOIN_ROOM as any);
  };

  const handleUpgrade = () => {
    Alert.alert(
      'Upgrade to House Master',
      'Are you sure you want to upgrade to a House Master? This will give you management privileges.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: async () => {
            try {
              await storeData('userRole', 'home_master');
              // Also set the role on the user's local record when possible
              try {
                const phone = await getData('userPhone');
                const normalized = normalizePhone(phone || '');
                if (normalized) {
                  // Ensure a minimal user record exists and set their role
                  await upsertUser({ phoneNumber: normalized, name: '' });
                  await setUserRole(normalized, 'home_master');
                }
              } catch (e) {
                console.error('Error updating local user role on upgrade', e);
              }
            } catch (e) {
              console.error('Error upgrading to home_master', e);
            }
            router.replace(Routes.HOME_MASTER_DASHBOARD as any);
          },
        },
      ]
    );
  };

  return (
    <DrawerLayout title="Welcome">
      <View className="p-6 flex-1 items-center justify-start">
        <View className="bg-white rounded-3xl p-8 w-full max-w-md shadow-lg">
          <Heading size="md" className="mb-4">
            Welcome!
          </Heading>
          <Text size="md" className="mb-6">
            You are logged in as a Room Member by default. You can either join an
            existing room using its QR code or upgrade to a House Master to manage
            rooms.
          </Text>

          <View className="space-y-4">
            <Button className="w-full" size="lg" onPress={handleJoinQR}>
              <ButtonText>Join a room with QR code</ButtonText>
            </Button>

            <Button
              className="w-full"
              size="lg"
              variant="outline"
              action="secondary"
              onPress={handleUpgrade}
            >
              <ButtonText>Upgrade to become House Master</ButtonText>
            </Button>
          </View>
        </View>
      </View>
    </DrawerLayout>
  );
}
