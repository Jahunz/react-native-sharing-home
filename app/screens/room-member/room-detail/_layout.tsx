import StyledTabs from "@/app/components/commons/StyledTabs";
import Routes from "@/app/constants/Routes";
import { Tab } from "@/app/constants/types";
import { DrawerLayout } from "@/components/DrawerLayout";
import { Slot, useLocalSearchParams, usePathname } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { getData } from "@/app/storage/async_storage";
import { ScrollView, View } from "react-native";

const tabs: Tab[] = [
    {
        id: 1,
        name: "Members",
        path: Routes.ROOM_MEMBER_ROOM_DETAIL_MEMBERS,
    },
    {
        id: 3,
        name: "Invoice History",
        path: Routes.ROOM_MEMBER_ROOM_DETAIL_INVOICE_HISTORY,
    },
];

export default function RoomMemberRoomDetail() {
    const pathname = usePathname();
    const { roomId, roomName } = useLocalSearchParams<{
        roomId: string;
        roomName?: string;
    }>();

    // statistics removed per request
    const currentTabId = useMemo(
        () => tabs.find((tab) => pathname.includes(tab.path))?.id ?? 1,
        [pathname]
    );

    useEffect(() => {
        // debug: log session and room-scoped role sources to diagnose routing mismatch
        let mounted = true;
        (async () => {
            try {
                const userPhone = await getData("userPhone");
                const userRole = await getData("userRole");
                const usersRaw = await getData("users");
                const membersRaw = roomId ? await getData(`members:${roomId}`) : null;
                // parse users and try to match current phone
                let usersParsed: any[] = [];
                try {
                    usersParsed = usersRaw ? JSON.parse(usersRaw) : [];
                } catch (e) {
                    console.warn('DEBUG: failed to parse usersRaw', e);
                }
                const matchedUser = usersParsed.find((u: any) => (u.phoneNumber || u.phone) === userPhone);
                console.log('DEBUG usersParsed:', usersParsed);
                console.log('DEBUG matchedUser from users table:', matchedUser);
                if (!mounted) return;
                console.log("DEBUG room-detail: roomId=", roomId);
                console.log("DEBUG session userPhone:", userPhone);
                console.log("DEBUG session userRole:", userRole);
                console.log("DEBUG usersRaw:", usersRaw);
                console.log(`DEBUG members:${roomId}`, membersRaw);
            } catch (err) {
                console.warn("DEBUG: error reading debug storage", err);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [roomId]);
    return (
        <>
            <DrawerLayout title={"Dashboard"} showNotificationIcon={true}>
                <ScrollView className="flex-1 bg-gray-50 px-4 pt-6">
                    {/* Statistics removed for room-member view */}
                    <StyledTabs tabs={tabs} currentTabId={currentTabId} />
                    <Slot />
                    <View className="h-20" />
                </ScrollView>
            </DrawerLayout>
        </>
    );
}
