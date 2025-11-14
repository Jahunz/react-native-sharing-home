import StyledTabs from "@/app/components/commons/StyledTabs";
import Routes from "@/app/constants/Routes";
import { Tab } from "@/app/constants/types";
import { DrawerLayout } from "@/components/DrawerLayout";
import { Slot, useLocalSearchParams, usePathname } from "expo-router";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";

const tabs: Tab[] = [
    {
        id: 1,
        name: "Members",
        path: Routes.ROOM_MASTER_ROOM_DETAIL_MEMBERS,
    },
    {
        id: 3,
        name: "Invoice History",
        path: Routes.ROOM_MASTER_ROOM_DETAIL_INVOICE_HISTORY,
    },
];

export default function RoomMasterRoomDetail() {
    const pathname = usePathname();
    const { roomId, roomName } = useLocalSearchParams<{
        roomId: string;
        roomName?: string;
    }>();

    const currentTabId = useMemo(
        () => tabs.find((tab) => pathname.includes(tab.path))?.id ?? 1,
        [pathname]
    );
    return (
        <>
            <DrawerLayout title={"Dashboard"} showNotificationIcon={true}>
                <ScrollView className="flex-1 bg-gray-50 px-4 pt-6">
                    <StyledTabs tabs={tabs} currentTabId={currentTabId} />
                    <Slot />
                    <View className="h-20" />
                </ScrollView>
            </DrawerLayout>
        </>
    );
}
