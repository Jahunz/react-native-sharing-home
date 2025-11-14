import React, { useEffect, useState } from 'react';
import { View, Alert, ActivityIndicator, Platform } from 'react-native';
import Constants from 'expo-constants';
import { DrawerLayout } from '@/components/DrawerLayout';
import { Text, Heading } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import Routes from '../constants/Routes';
import { getData, storeData } from '../storage/async_storage';
import { findUserByPhone, upsertUser, normalizePhone } from '../storage/users';
import StyledInput from '../components/commons/StyledInput';
import * as ImagePicker from 'expo-image-picker';
import { ROLE } from '../constants/enum';

export default function JoinRoomScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ScannerComponent, setScannerComponent] = useState<any>(null);
  const [scannerAvailable, setScannerAvailable] = useState<boolean | null>(null);
  const [manualRoomId, setManualRoomId] = useState('');
  const [manualRoomName, setManualRoomName] = useState('');

  useEffect(() => {
    // If the user is already a member of one or more rooms, don't show the Join UI.
    // Redirect them to their member dashboard or directly into the single room.
    (async () => {
      try {
        const userPhone = (await getData('userPhone')) || '';
        if (!userPhone) return;

        const rawRooms = await getData('rooms');
        const parsedRooms = rawRooms ? JSON.parse(rawRooms) : [];
        const memberRooms: any[] = [];
        for (const r of parsedRooms) {
          try {
            const membersRaw = await getData(`members:${r.id}`);
            const members = membersRaw ? JSON.parse(membersRaw) : [];
            if (members.find((m: any) => m.phoneNumber === userPhone)) {
              memberRooms.push(r);
            }
          } catch (e) {
            // ignore per-room read errors
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
        // ignore and allow join UI to appear
      }
    })();
  }, []);

  const requestScanner = async () => {
    // If running inside Expo Go, the native barcode scanner module won't be available.
    // Avoid attempting to load it to prevent Metro from trying to initialize the missing native module.
    if (Constants?.appOwnership === 'expo') {
      setScannerAvailable(false);
      Alert.alert(
        'Scanner not available',
        'Camera scanner is not available in Expo Go. Use the manual room id input to join or create a dev client to enable native modules.'
      );
      return;
    }

    setLoading(true);
    try {
      // dynamic import so the app doesn't crash if dependency isn't installed
      // @ts-ignore
      const mod = await import('expo-barcode-scanner');
      const BarCodeScanner = mod.BarCodeScanner || mod.default?.BarCodeScanner || mod.default;
      setScannerComponent(() => BarCodeScanner);
  setScannerAvailable(true);

      // request permission
  const permResult = await (mod.BarCodeScanner?.requestPermissionsAsync?.() || mod.requestPermissionsAsync?.());
  const granted = (permResult && ((permResult as any).status === 'granted' || (permResult as any).granted === true));
  setHasPermission(Boolean(granted));
    } catch (e) {
      console.warn('Barcode scanner import failed', e);
      // Mark scanner as unavailable and show manual fallback
      setScannerAvailable(false);
      Alert.alert('Scanner not available', 'Camera scanner is not available in this build. You can enter a room id manually to join.');
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setLoading(true);
    try {
      let raw = data;
      try {
        raw = decodeURIComponent(data);
      } catch (e) {
        // not encoded, continue
      }

      let payload: any = null;
      try {
        payload = JSON.parse(raw);
      } catch (e) {
        console.error('Invalid QR payload', e);
        Alert.alert('Invalid QR', 'Scanned QR data is not a valid room payload.');
        setLoading(false);
        return;
      }

      const roomId = payload.roomId;
      const roomName = payload.roomName || `Room ${roomId}`;

      if (!roomId) {
        Alert.alert('Invalid QR', 'Room id missing from QR payload.');
        setLoading(false);
        return;
      }

      // Delegate join processing to shared handler
      await processJoinPayload({ roomId, roomName });
    } catch (e) {
      console.error('Error processing scanned QR', e);
      Alert.alert('Error', 'Unable to process QR code.');
    } finally {
      setLoading(false);
    }
  };

  const processJoinPayload = async (payload: { roomId?: string; roomName?: string }) => {
    setLoading(true);
    try {
      const roomId = payload.roomId;
      const roomName = payload.roomName || `Room ${roomId}`;

      if (!roomId) {
        Alert.alert('Invalid QR', 'Room id missing from payload.');
        setLoading(false);
        return;
      }

      // ensure room exists in persisted rooms
      const rawRooms = await getData('rooms');
      const rooms = rawRooms ? JSON.parse(rawRooms) : [];
      const numericId = Number(roomId) || Date.now();
  const existsIndex = rooms.findIndex((r: any) => String(r.id) === String(roomId));
  const exists = existsIndex !== -1 ? rooms[existsIndex] : null;
  if (!exists) {
        // Accept multiple possible payload shapes for home/master info
        const homeNameFromPayload = (payload as any).homeName || (payload as any).home_name || (payload as any).home || undefined;
        const homeMasterFromPayload = (payload as any).homeMaster || (payload as any).home_master || (payload as any).owner || undefined;

        const newRoom: any = {
          id: numericId,
          name: roomName,
          memberCount: 0,
          debtAmount: 0,
          nextInvoiceDate: '',
        };

        if (homeNameFromPayload) newRoom.homeName = homeNameFromPayload;
        if (homeMasterFromPayload) {
          // normalize homeMaster object
          if (typeof homeMasterFromPayload === 'string') {
            newRoom.homeMaster = { name: homeMasterFromPayload };
          } else if (typeof homeMasterFromPayload === 'object') {
            newRoom.homeMaster = {
              id: homeMasterFromPayload.id || homeMasterFromPayload.masterId || undefined,
              name: homeMasterFromPayload.name || homeMasterFromPayload.fullName || homeMasterFromPayload.masterName || undefined,
              phone: homeMasterFromPayload.phone || homeMasterFromPayload.phoneNumber || undefined,
            };
          }
        }

        const newRooms = [...rooms, newRoom];
        await storeData('rooms', JSON.stringify(newRooms));
        try {
          // initialize invoices storage for the new room
          await storeData(`invoices:${numericId}`, JSON.stringify([]));
        } catch (e) {
          console.error('Error initializing invoices for new room', e);
        }
      } else {
        // If room exists but payload contains home/master info, update the stored room
        const homeNameFromPayload = (payload as any).homeName || (payload as any).home_name || (payload as any).home || undefined;
        const homeMasterFromPayload = (payload as any).homeMaster || (payload as any).home_master || (payload as any).owner || undefined;
        let updated = false;
        const updatedRoom = { ...exists } as any;
        if (homeNameFromPayload && !updatedRoom.homeName) {
          updatedRoom.homeName = homeNameFromPayload;
          updated = true;
        }
        if (homeMasterFromPayload && !updatedRoom.homeMaster) {
          if (typeof homeMasterFromPayload === 'string') {
            updatedRoom.homeMaster = { name: homeMasterFromPayload };
          } else if (typeof homeMasterFromPayload === 'object') {
            updatedRoom.homeMaster = {
              id: homeMasterFromPayload.id || homeMasterFromPayload.masterId || undefined,
              name: homeMasterFromPayload.name || homeMasterFromPayload.fullName || homeMasterFromPayload.masterName || undefined,
              phone: homeMasterFromPayload.phone || homeMasterFromPayload.phoneNumber || undefined,
            };
          }
          updated = true;
        }
        if (updated) {
          const newRooms = [...rooms];
          newRooms[existsIndex] = updatedRoom;
          await storeData('rooms', JSON.stringify(newRooms));
        }
      }

  // Determine canonical room id used in persisted rooms and members keys
  const persistedRoomId = exists ? exists.id : numericId;

  // add current user as member in members:<persistedRoomId>
  const userPhone = (await getData('userPhone')) || '';
  const normalized = (userPhone && userPhone.toString()) ? (userPhone.toString().replace(/\D+/g, '')) : '';
  const profileKey = normalized ? `profile:${normalized}` : 'profile';
  const photoKey = normalized ? `profilePhoto:${normalized}` : 'profilePhoto';
  const profileJson = await getData(profileKey);
  const profile = profileJson ? JSON.parse(profileJson) : {};
  const profilePhoto = await getData(photoKey);
  const displayName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Member';

  const membersRaw = await getData(`members:${persistedRoomId}`);
  const members = membersRaw ? JSON.parse(membersRaw) : [];
  const already = members.find((m: any) => m.phoneNumber === userPhone && userPhone !== '');
      if (already) {
        // Offer to open the room directly instead of only showing a message
        Alert.alert(
          'Already a member',
          'You are already a member of this room. Would you like to open it?',
          [
            {
              text: 'Open room',
              onPress: () => {
                // Navigate to the room member detail screen with params
                router.replace({
                  pathname: Routes.ROOM_MEMBER_ROOM_DETAIL_MEMBERS as any,
                  params: { roomId: String(persistedRoomId), roomName: roomName },
                } as any);
              },
            },
            {
              text: 'Back',
              style: 'cancel',
            },
          ],
          { cancelable: true }
        );
        setLoading(false);
        return;
      }

      // Resolve an avatar for the joining user. Prefer, in order:
      // 1) per-phone profilePhoto (profilePhoto:<phone>)
      // 2) avatar from the local users directory
      // 3) leave undefined to let Avatar component show fallback
      let resolvedAvatar: string | undefined = undefined;
      try {
        if (profilePhoto) resolvedAvatar = profilePhoto;
        else {
          const u = await findUserByPhone(userPhone);
          if (u && (u.avatar || (u as any).photo)) resolvedAvatar = (u.avatar || (u as any).photo) as string;
        }
      } catch (e) {
        console.error('Error resolving avatar for joined user', e);
      }

      const newMember = {
        id: Date.now(),
        name: displayName,
        phoneNumber: userPhone,
        role: ROLE.ROOM_MEMBER,
        avatar: resolvedAvatar,
      };

  const updated = [...members, newMember];
  await storeData(`members:${persistedRoomId}`, JSON.stringify(updated));

  // Ensure the users directory has this member's profile (name + avatar)
  try {
    const normalizedPhone = normalizePhone(userPhone || '');
    if (normalizedPhone) {
      await upsertUser({ phoneNumber: normalizedPhone, name: displayName || '', avatar: resolvedAvatar });
    }
  } catch (e) {
    console.error('Error upserting user after join', e);
  }

      Alert.alert('Joined', `You joined ${roomName}`);
      router.replace(Routes.ROOM_MEMBER_DASHBOARD as any);
    } catch (e) {
      console.error('Error processing join payload', e);
      Alert.alert('Error', 'Unable to join room.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualJoin = async () => {
    if (!manualRoomId) {
      Alert.alert('Missing room id', 'Please enter the room id to join.');
      return;
    }
    await processJoinPayload({ roomId: manualRoomId, roomName: manualRoomName });
  };

  const pickAndDecode = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access photos is required to pick a QR image.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (res.canceled) return;

      const asset = res.assets && res.assets[0];
      if (!asset || !asset.uri) {
        Alert.alert('No image', 'No image was selected.');
        return;
      }

      const localUri = asset.uri;
      const filename = localUri.split('/').pop() || 'photo.jpg';
      const match = /\.([^.]+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      // React Native form-data file shape
      // @ts-ignore
      formData.append('file', { uri: localUri, name: filename, type });

      setLoading(true);

      // Use a free QR decode API to avoid native dependencies. This uploads the image and returns decoded data.
      const r = await fetch('https://api.qrserver.com/v1/read-qr-code/', {
        method: 'POST',
        headers: {
          // Let fetch set the Content-Type with boundary for FormData
        },
        body: formData as any,
      });

      const json = await r.json();
      const symbol = json?.[0]?.symbol?.[0];
      const decoded = symbol?.data;
      if (!decoded) {
        Alert.alert('No QR found', 'Could not find or decode a QR code in the selected image.');
        setLoading(false);
        return;
      }

      // Payload may be JSON or a raw room id string
      let payload: any = null;
      try {
        payload = JSON.parse(decoded);
      } catch (e) {
        payload = { roomId: decoded };
      }

      await processJoinPayload(payload);
    } catch (e) {
      console.error('pickAndDecode error', e);
      Alert.alert('Error', 'Unable to decode QR from image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerLayout title="Join room">
      <View className="p-6 flex-1 items-center justify-start">
        <View className="bg-white rounded-3xl p-6 w-full max-w-md shadow-lg">
          <Heading size="md" className="mb-4">
            Join a room
          </Heading>
          <Text size="md" className="mb-4">
            Use the room's QR code to join.
          </Text>

          {loading && (
            <View className="my-4">
              <ActivityIndicator />
            </View>
          )}

          {!ScannerComponent ? (
            scannerAvailable === false ? (
              <View className="space-y-4">
                <StyledInput label="Room id" value={manualRoomId} onChangeText={setManualRoomId} />
                <StyledInput label="Room name (optional)" value={manualRoomName} onChangeText={setManualRoomName} />
                <Button className="w-full" onPress={handleManualJoin}>
                  <ButtonText>Join</ButtonText>
                </Button>
                <Button className="w-full" variant="outline" onPress={pickAndDecode}>
                  <ButtonText>Pick QR from library</ButtonText>
                </Button>
                <Button className="w-full" variant="outline" onPress={() => router.back()}>
                  <ButtonText>Back</ButtonText>
                </Button>
              </View>
            ) : (
              <View className="space-y-4">
                <Button className="w-full" size="lg" onPress={requestScanner}>
                  <ButtonText>Enable scanner</ButtonText>
                </Button>
                <Button className="w-full" variant="outline" onPress={pickAndDecode}>
                  <ButtonText>Pick QR from library</ButtonText>
                </Button>
                <Button className="w-full" variant="outline" onPress={() => router.back()}>
                  <ButtonText>Back</ButtonText>
                </Button>
              </View>
            )
          ) : (
            <View>
              <View className="overflow-hidden rounded-lg bg-black/5" style={{ height: 400, width: '100%' }}>
                {/* @ts-ignore */}
                <ScannerComponent
                  onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                  style={{ height: '100%', width: '100%' }}
                />
              </View>

              <View className="space-y-4 mt-4">
                <Button className="w-full" onPress={() => setScanned(false)}>
                  <ButtonText>Scan again</ButtonText>
                </Button>
                <Button className="w-full" variant="outline" onPress={pickAndDecode}>
                  <ButtonText>Pick QR from library</ButtonText>
                </Button>
                <Button className="w-full" variant="outline" onPress={() => router.back()}>
                  <ButtonText>Back</ButtonText>
                </Button>
              </View>
            </View>
          )}
        </View>
      </View>
    </DrawerLayout>
  );
}
