import RoomCard from "@/app/components/roomCard";
import Routes from "@/app/constants/Routes";
import { RMRoom } from "@/app/constants/types";
import { getData } from "@/app/storage/async_storage";
import { DrawerLayout } from "@/components/DrawerLayout";
import { dummy_room_member_room_list } from "@/utils/dummy";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ScrollView, View, Text as RNText } from "react-native";
import { HMRoom } from "@/app/constants/types";

export default function DashboardScreen() {
    const router = useRouter();

    const [rooms, setRooms] = useState<RMRoom[]>([]);

    useEffect(() => {
        const loadMemberRooms = async () => {
            try {
                const userPhone = (await getData('userPhone')) || '';
                const rawRooms = await getData('rooms');
                let parsed: HMRoom[] = [];
                if (rawRooms) parsed = JSON.parse(rawRooms);

                // For each room, check persisted members to see if current user is a member
                const memberRooms: RMRoom[] = [];
                await Promise.all(parsed.map(async (r) => {
                    try {
                        const membersRaw = await getData(`members:${r.id}`);
                        const members = membersRaw ? JSON.parse(membersRaw) : [];
                        if (userPhone && members.find((m: any) => m.phoneNumber === userPhone)) {
                            memberRooms.push({
                                id: r.id,
                                name: r.name,
                                homeName: (r as any).homeName || undefined,
                                memberCount: r.memberCount || (members.length || 0),
                                nextInvoiceDate: r.nextInvoiceDate || '',
                            });
                        }
                    } catch (e) {
                        // ignore per-room errors
                    }
                }));

                if (memberRooms.length === 1) {
                    // If the user is a member of exactly one room, open it directly
                    const only = memberRooms[0];
                    // route to member detail
                    router.replace({
                        pathname: Routes.ROOM_MEMBER_ROOM_DETAIL_MEMBERS as any,
                        params: { roomId: String(only.id), roomName: only.name },
                    } as any);
                    return;
                }

                if (memberRooms.length > 0) {
                    setRooms(memberRooms);
                } else {
                    // fallback to dummy list if not a member of any persisted room
                    setRooms(dummy_room_member_room_list);
                }
            } catch (e) {
                console.error('Error loading member rooms', e);
                setRooms(dummy_room_member_room_list);
            }
        };

        loadMemberRooms();
    }, []);

    const handleRoomPress = (roomId: number, roomName: string) => {
        getData("userRole").then((role) => {
            if (role === "room_master") {
                router.push({
                    pathname: Routes.ROOM_VIEW_SELECTION as any,
                    params: {
                        roomId: roomId.toString(),
                        roomName: roomName,
                    },
                });
            } else {
                router.push({
                    pathname: Routes.ROOM_MEMBER_ROOM_DETAIL_MEMBERS as any,
                    params: {
                        roomId: roomId.toString(),
                        roomName: roomName,
                    },
                });
            }
        });
    };

    return (
        <>
            <DrawerLayout title={"Dashboard"} showNotificationIcon={true}>
                <ScrollView className="flex-1 bg-gray-50 px-4 pt-6">
                    {/* Room List */}
                    {rooms.map((room) => (
                        <RoomCard
                            key={room.id}
                            roomName={room.name}
                            homeName={room.homeName}
                            memberCount={room.memberCount}
                            nextInvoiceDate={room.nextInvoiceDate}
                            onPress={() => handleRoomPress(room.id, room.name)}
                        />
                    ))}
                </ScrollView>
            </DrawerLayout>
        </>
    );
}
