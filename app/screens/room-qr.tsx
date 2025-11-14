import React, { useRef } from 'react';
import { View, Share, Alert } from 'react-native';
// @ts-ignore - optional dependency; ensure to run `npm install react-native-qrcode-svg`
import QRCode from 'react-native-qrcode-svg';
import { DrawerLayout } from '@/components/DrawerLayout';
import { Text, Heading } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useLocalSearchParams } from 'expo-router';

export default function RoomQRScreen() {
  const { roomId, roomName } = useLocalSearchParams<{
    roomId?: string;
    roomName?: string;
  }>();

  const payload = JSON.stringify({ roomId: roomId || '', roomName: roomName || '' });
  const size = 400; // px

  const handleShare = async () => {
    try {
      // Share a human-friendly message; the QR image is a decorative placeholder here.
      await Share.share({
        message: `Join my room: ${roomName || roomId} (share this room id with others)`,
      });
    } catch (e) {
      console.error('Share failed', e);
      Alert.alert('Share failed', `Unable to open the share sheet.`);
    }
  };

  // For now we display a decorative placeholder drawn with Views (no image formats required).
  const handleShareRoomId = async () => {
    try {
      await Share.share({ message: `Join my room: ${roomName || roomId}` });
    } catch (e) {
      console.error('Share failed', e);
      Alert.alert('Share failed', 'Unable to open the share sheet.');
    }
  };

  return (
    <DrawerLayout title={`Room QR: ${roomName || roomId}`}>
      <View className="p-6 items-center">
        <Heading size="md" className="mb-4">Room QR</Heading>
        <Text className="mb-4">Share this QR code for users to join the room.</Text>
        <View className="bg-white p-4 rounded items-center justify-center">
          {/* Scannable QR generated with react-native-qrcode-svg (works in Expo Go) */}
          <View style={{ backgroundColor: '#fff', padding: 8 }}>
            <QRCode value={payload} size={size} />
          </View>
        </View>
        <View className="w-full mt-6">
          <Button className="w-full" onPress={handleShare}>
            <ButtonText>Share QR</ButtonText>
          </Button>
        </View>
      </View>
    </DrawerLayout>
  );
}
