import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import Routes from "./constants/Routes";

export default function RootLayout() {
    return (
        <GluestackUIProvider mode="light">
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: "none",
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name={Routes.ROLE_SELECTION} />
                <Stack.Screen name={Routes.LOGIN()} />
                <Stack.Screen name={Routes.SIGNUP} />
                <Stack.Screen name={Routes.PROFILE} />
                <Stack.Screen name={Routes.NOTIFICATIONS} />
                {/* Home Master Screens */}
                <Stack.Screen name={Routes.HOME_MASTER_DASHBOARD} />
                <Stack.Screen name={Routes.HOME_MASTER_ROOM_DETAIL} />
                {/* Room Master Screens */}
                <Stack.Screen name={Routes.ROOM_MEMBER_DASHBOARD} />
                <Stack.Screen name={Routes.ROOM_VIEW_SELECTION} />
                {/* Room Member Screen */}

            </Stack>
            <StatusBar style="auto" />
        </GluestackUIProvider>
    );
}
