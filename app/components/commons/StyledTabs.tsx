import { Tab } from "@/app/constants/types";
import { Grid, GridItem } from "@/components/ui/grid";
import { Text } from "@/components/ui/text";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Pressable } from "react-native";

interface StyledTabsProps {
    tabs: Tab[];
    currentTabId: number;
}

export default function StyledTabs({ tabs, currentTabId }: StyledTabsProps) {
    const router = useRouter();
    const params = useLocalSearchParams<{ roomId?: string; roomName?: string }>();
    const roomId = params?.roomId;
    const roomName = params?.roomName;
    const onChangeTab = (path: string) => {
        // Preserve current roomId/roomName when switching tabs so child routes
        // continue to receive the same room context.
        if (roomId) {
            router.replace({ pathname: path as any, params: { roomId, roomName } } as any);
        } else {
            router.replace(path as any);
        }
    };
    return (
        <Grid
            className="bg-black p-1 my-4 justify-between rounded-full items-center"
            _extra={{ className: "grid-cols-12 gap-2" }}
        >
            {tabs.map((tab: Tab) => (
                <GridItem
                    key={tab.id}
                    _extra={{
                        className: `col-span-${String(12 / tabs.length)}`,
                    }}
                    className={
                        currentTabId === tab.id
                            ? "bg-white p-1 rounded-full"
                            : ""
                    }
                >
                    <Pressable onPress={() => onChangeTab(tab.path)}>
                        <Text
                            className={`text-center ${
                                currentTabId === tab.id
                                    ? "text-black"
                                    : "text-white p-2"
                            }`}
                        >
                            {tab.name}
                        </Text>
                    </Pressable>
                </GridItem>
            ))}
        </Grid>
    );
}
