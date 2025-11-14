import { removeData, getData } from '@/app/storage/async_storage';
import Routes from "@/app/constants/Routes";
import { AppIcon } from "@/components/AppIcon";
import { ArrowLeftIcon, Icon } from "@/components/ui/icon";
import { Heading, Text } from "@/components/ui/text";
import { usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

interface DrawerLayoutProps {
    children: React.ReactNode;
    title?: string;
    showNotificationIcon?: boolean;
}

export function DrawerLayout({
    children,
    title = "Home",
    showNotificationIcon = true,
}: DrawerLayoutProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const normalizedPath = (pathname || '').toLowerCase().replace(/^\/+/, '');

    // The router's pathname can have prefixes (for example: '/(tabs)/room-member/dashboard').
    // Use a broader, case-insensitive match for key segments so the header reliably
    // shows the hamburger on dashboard-like screens.
    const isHomeScreen = /home-master|room-master|room-member|profile|welcome|dashboard/.test(
        normalizedPath
    );

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    const navigateTo = (path: string) => {
        router.push(path as any);
        setIsDrawerOpen(false);
    };

    const handleLogout = async () => {
        try {
            await removeData("userRole");
        } catch (e) {
            console.error("Error clearing userRole on logout", e);
        }
        router.replace(Routes.LOGIN() as any);
    };

    return (
        <View className="flex-1 flex-row bg-white">
            {isDrawerOpen && (
                <>
                    <Pressable
                        className="absolute inset-0 bg-black/20 z-10"
                        onPress={toggleDrawer}
                    />

                    {/* Drawer Content */}
                    <View className="absolute left-0 top-0 bottom-0 w-52 bg-white z-20 shadow-xl pt-12">
                        <ScrollView className="flex-1">
                            {/* Collapse Button */}
                            <Pressable
                                onPress={toggleDrawer}
                                className="flex-row items-center px-4 py-6 border-b border-gray-200"
                            >
                                <Icon
                                    as={ArrowLeftIcon}
                                    size="lg"
                                    className="text-gray-600 mx-2"
                                />
                                <Text size="sm" className="text-gray-600">
                                    Collapse Sidebar
                                </Text>
                            </Pressable>

                            {/* App Logo and Name */}
                            <View className="items-center py-6">
                                <View className="mb-3">
                                    <AppIcon size="sm" />
                                </View>
                                <Heading size="sm">HomeShare</Heading>
                            </View>

                            {/* Menu Items */}
                            <View className="px-3">
                                <Pressable
                                        onPress={async () => {
                                            // If the current user is a room member but isn't
                                            // assigned to any room yet, send them to Welcome
                                            // instead of a dashboard that expects rooms.
                                            try {
                                                const userRole = await getData('userRole');
                                                if (String(userRole) === 'room_member') {
                                                    const userPhone = (await getData('userPhone')) || '';
                                                    const rawRooms = await getData('rooms');
                                                    const rooms = rawRooms ? JSON.parse(rawRooms) : [];
                                                    let isMember = false;
                                                    for (const r of rooms) {
                                                        const membersRaw = await getData(`members:${r.id}`);
                                                        const members = membersRaw ? JSON.parse(membersRaw) : [];
                                                        if (
                                                            userPhone &&
                                                            members.find((m: any) => m.phoneNumber === userPhone)
                                                        ) {
                                                            isMember = true;
                                                            break;
                                                        }
                                                    }

                                                    if (!isMember) {
                                                        router.replace(Routes.WELCOME as any);
                                                        setIsDrawerOpen(false);
                                                        return;
                                                    }

                                                    // otherwise go to the member dashboard
                                                    router.replace(Routes.ROOM_MEMBER_DASHBOARD as any);
                                                    setIsDrawerOpen(false);
                                                    return;
                                                }
                                            } catch (e) {
                                                console.error('Error deciding dashboard route', e);
                                            }

                                            navigateTo(Routes.HOME_MASTER_DASHBOARD);
                                        }}
                                        className={`flex-row items-center px-4 py-3 rounded-lg mb-2 ${
                                            pathname.includes(
                                                Routes.HOME_MASTER_DASHBOARD
                                            )
                                                ? 'bg-gray-100'
                                                : ''
                                        }`}
                                >
                                    <View className="w-5 h-5 mr-3">
                                        <Text>⊞</Text>
                                    </View>
                                    <Text
                                        size="md"
                                        weight={
                                            pathname.includes(
                                                Routes.HOME_MASTER_DASHBOARD
                                            )
                                                ? "medium"
                                                : "normal"
                                        }
                                    >
                                        Dashboard
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => navigateTo(Routes.PROFILE)}
                                    className={`flex-row items-center px-4 py-3 rounded-lg mb-2 ${
                                        pathname.includes(Routes.PROFILE)
                                            ? "bg-gray-100"
                                            : ""
                                    }`}
                                >
                                    <View className="w-5 h-5 mr-3">
                                        <Text>👤</Text>
                                    </View>
                                    <Text
                                        size="md"
                                        weight={
                                            pathname.includes(Routes.PROFILE)
                                                ? "medium"
                                                : "normal"
                                        }
                                    >
                                        Profile
                                    </Text>
                                </Pressable>
                            </View>
                            {/* Logout Button at Bottom */}
                            <Pressable
                                onPress={handleLogout}
                                className="flex-row items-center px-7 py-4 border-t border-gray-200"
                            >
                                <Icon
                                    as={ArrowLeftIcon}
                                    size="lg"
                                    className="text-red-500 mr-2"
                                />
                                <Text size="md" className="text-red-500">
                                    Log out
                                </Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </>
            )}

            {/* Main Content */}
            <View className="flex-1 mt-12">
                {/* Header */}
                <View className="bg-white border-b border-gray-200 px-4 py-5 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        {isHomeScreen ? (
                            <Pressable onPress={toggleDrawer} className="mr-4">
                                <View className="w-6 h-6 justify-around">
                                    <View className="w-6 h-0.5 bg-black" />
                                    <View className="w-6 h-0.5 bg-black" />
                                    <View className="w-6 h-0.5 bg-black" />
                                </View>
                            </Pressable>
                        ) : (
                            <Pressable
                                onPress={() => {
                                    // If this path looks like a dashboard root (no back history),
                                    // open the drawer instead of calling router.back which
                                    // can trigger a GO_BACK warning in development.
                                    if (/dashboard|room-member|home-master|room-master/.test(normalizedPath)) {
                                        toggleDrawer();
                                    } else {
                                        router.back();
                                    }
                                }}
                                className="mr-4"
                            >
                                <Icon
                                    as={ArrowLeftIcon}
                                    size="lg"
                                    className="text-gray-600"
                                />
                            </Pressable>
                        )}
                        <Heading size="sm">{title}</Heading>
                    </View>

                    {showNotificationIcon && (
                        <Pressable
                            onPress={() =>
                                router.push(Routes.NOTIFICATIONS as any)
                            }
                        >
                            <View className="w-6 h-6">
                                <Text size="xl">🔔</Text>
                            </View>
                        </Pressable>
                    )}
                </View>

                {/* Content */}
                <View className="flex-1 bg-gray-50">{children}</View>
            </View>
        </View>
    );
}
