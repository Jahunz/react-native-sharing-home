import { HMRoom } from "@/app/constants/types";
import { DrawerLayout } from "@/components/DrawerLayout";
import { Text } from "@/components/ui/text";
import { dummy_home_master_room_list } from "@/utils/dummy";
import { useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import { Pressable, ScrollView, View } from "react-native";
import StyledInput from "../../components/commons/StyledInput";
import StyledModal from "../../components/commons/StyledModal";
import RoomCard from "../../components/roomCard";
import Routes from "../../constants/Routes";
import { getData, storeData } from "../../storage/async_storage";
import { normalizePhone } from '../../storage/users';
import { useFocusEffect } from "@react-navigation/native";

export default function HomeDetailsScreen() {
    const router = useRouter();

    const [showModal, setShowModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");

    const [rooms, setRooms] = useState<HMRoom[]>([]);

    const loadRooms = async () => {
        try {
            // Try to load persisted rooms first
            const rawRooms = await getData("rooms");
            if (rawRooms) {
                const parsed: HMRoom[] = JSON.parse(rawRooms);
                // Filter persisted rooms to only those managed by the current home master.
                // Use phone number as primary identifier, fall back to profile name if available.
                    try {
                    const userPhone = (await getData('userPhone')) || '';
                    const normalized = normalizePhone(userPhone || '');
                    const profileKey = normalized ? `profile:${normalized}` : 'profile';
                    const profileJson = await getData(profileKey);
                    const profile = profileJson ? JSON.parse(profileJson) : {};
                    const displayName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();

                    const filtered = parsed.filter((r: any) => {
                        if (!r) return false;
                        // 1) Prefer explicit homeMaster match
                        if (r.homeMaster) {
                            if (userPhone && r.homeMaster.phone && String(r.homeMaster.phone) === String(userPhone)) return true;
                            if (displayName && r.homeMaster.name && String(r.homeMaster.name).toLowerCase() === String(displayName).toLowerCase()) return true;
                        }

                        // 2) Fallback: include rooms created by this user (createdBy stored at creation)
                        if (userPhone && r.createdBy && String(r.createdBy) === String(userPhone)) return true;

                        return false;
                    });

                    setRooms(filtered);
                    // Enrich rooms with invoiceStatus by reading invoices_status per room
                    try {
                        const enriched = await Promise.all(filtered.map(async (r: any) => {
                            try {
                                // fetch persisted members for this room to compute accurate member count (include room master)
                                try {
                                    const memRaw = await getData(`members:${r.id}`);
                                    const parsedMembers = memRaw ? JSON.parse(memRaw) : [];
                                    r.memberCount = Array.isArray(parsedMembers) ? parsedMembers.length : (r.memberCount || 0);
                                } catch (e) {
                                    // ignore and keep existing r.memberCount
                                }
                                const key = `invoices_status:${r.id}`;
                                const rawStatus = await getData(key);
                                const list = rawStatus ? JSON.parse(rawStatus) : [];
                                if (!Array.isArray(list) || list.length === 0) return { ...r, invoiceStatus: undefined };
                                // pick the most-recent updatedAt entry if present
                                const sorted = list.slice().sort((a: any, b: any) => {
                                    const ta = a && a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                                    const tb = b && b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                                    return ta - tb;
                                });
                                const last = sorted[sorted.length - 1];
                                const status = last && last.status ? String(last.status).toUpperCase() : undefined;
                                return { ...r, invoiceStatus: status };
                            } catch (e) {
                                return { ...r, invoiceStatus: undefined };
                            }
                        }));
                        setRooms(enriched);
                    } catch (e) {
                        // fallback to non-enriched
                    }
                } catch (e) {
                    console.error('Error filtering rooms by home master', e);
                    setRooms(parsed);
                }
                return;
            }

            // Fallback: filter out deleted rooms from dummy list
            const raw = await getData("deletedRooms");
            const deleted: number[] = raw ? JSON.parse(raw) : [];
            const filtered = dummy_home_master_room_list.filter(
                (r) => !deleted.includes(r.id)
            );
            setRooms(filtered);
        } catch (e) {
            console.error("Error loading deleted rooms", e);
            setRooms(dummy_home_master_room_list);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadRooms();
        }, [])
    );

    const handleRoomPress = (roomId: number, roomName: string) => {
        router.push({
            pathname: Routes.HOME_MASTER_ROOM_DETAIL as any,
            params: {
                roomId: roomId.toString(),
                roomName: roomName,
            },
        });
    };

    const handleAddNewRoom = () => {
        const createdRoomName = newRoomName;
        (async () => {
            try {
                const userPhone = (await getData('userPhone')) || '';
                const normalized = normalizePhone(userPhone || '');
                const profileKey = normalized ? `profile:${normalized}` : 'profile';
                const profileJson = await getData(profileKey);
                const profile = profileJson ? JSON.parse(profileJson) : {};

                const homeMasterInfo: any = {};
                if (userPhone) homeMasterInfo.phone = userPhone;
                if (profile && (profile.firstName || profile.lastName)) {
                    homeMasterInfo.name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
                }

                const newRooms = [
                    ...rooms,
                    {
                        id: rooms.length + 1,
                        name: createdRoomName,
                        // If we can determine a creating user (phone), seed the room
                        // with that user as the initial room master so role-based
                        // rendering works immediately.
                        memberCount: userPhone ? 1 : 0,
                        debtAmount: 0,
                        nextInvoiceDate: "",
                        homeMaster: Object.keys(homeMasterInfo).length ? homeMasterInfo : undefined,
                        createdBy: userPhone || undefined,
                    },
                ];

                setRooms(newRooms);
                // persist new rooms list so it's available after navigation/refresh
                storeData("rooms", JSON.stringify(newRooms));

                // initialize persisted members and invoices for the new room
                const newId = newRooms[newRooms.length - 1].id;
                try {
                    // Do NOT auto-assign the creating user as the room_master.
                    // New rooms start with an empty members list; the home master
                    // remains distinct from room masters and can assign a room
                    // master explicitly via the UI if desired.
                    await storeData(`members:${newId}`, JSON.stringify([]));
                    await storeData(`invoices:${newId}`, JSON.stringify([]));
                } catch (e) {
                    console.error("Error initializing storage for new room", e);
                }

                setNewRoomName("");
                setShowModal(false);

                // navigate to the new room detail (do not force opening add-master)
                router.push({
                    pathname: Routes.HOME_MASTER_ROOM_DETAIL as any,
                    params: {
                        roomId: newId.toString(),
                        roomName: createdRoomName,
                    },
                });
            } catch (e) {
                console.error('Error creating room', e);
                setShowModal(false);
            }
        })();
    };

    const handeCancelAddNewRoom = () => {
        setShowModal(false);
        setNewRoomName("");
    };

    return (
        <>
            <DrawerLayout title={"Dashboard"} showNotificationIcon={true}>
                <ScrollView className="flex-1 bg-gray-50 px-4 pt-6">
                    {rooms.map((room) => (
                        <RoomCard
                            key={room.id}
                            roomName={room.name}
                            memberCount={room.memberCount || 0}
                            invoiceStatus={(room as any).invoiceStatus}
                            nextInvoiceDate={room.nextInvoiceDate}
                            onPress={() => handleRoomPress(room.id, room.name)}
                        />
                    ))}

                    <Pressable
                        onPress={() => setShowModal(true)}
                        className="bg-gray-100 rounded-2xl p-6 items-center justify-center mb-4 mt-2"
                        style={{ minHeight: 80 }}
                    >
                        <View className="flex-row items-center">
                            <Text
                                size="lg"
                                weight="medium"
                                className="text-gray-600"
                            >
                                + New room
                            </Text>
                        </View>
                    </Pressable>
                </ScrollView>
            </DrawerLayout>
            <StyledModal
                title="Add new room"
                submitButtonText="Add"
                cancelButtonText="Cancel"
                isOpen={showModal}
                closeOnOverlayClick={false}
                size="md"
                handelSubmit={handleAddNewRoom}
                handelCancel={handeCancelAddNewRoom}
                children={
                    <StyledInput
                        placeholder="Enter room name"
                        value={newRoomName}
                        onChangeText={(value) => setNewRoomName(value)}
                    />
                }
            />
        </>
    );
}
