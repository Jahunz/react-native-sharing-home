import { AppIcon } from "@/components/AppIcon";
import { Box } from "@/components/ui/box";
import { Heading, Text } from "@/components/ui/text";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import StyledButton from "../components/commons/StyledButton";
import StyledInput from "../components/commons/StyledInput";
import Routes from "../constants/Routes";
import { getData, storeData } from "../storage/async_storage";
import { getUsers, upsertUser, normalizePhone } from '../storage/users';
import { ROLE } from '../constants/enum';

export default function LoginScreen() {
    const router = useRouter();
    const { role } = useLocalSearchParams<{ role: string }>();
    const [phoneNumber, setPhoneNumber] = useState("");
    // Password remains a normal credential field. We no longer infer role
    // from the password string. Role is resolved from the local data model
    // (users list or room members) below.
    const [password, setPassword] = useState("");

    // When a user logs in we persist their phone and role and also append
    // a minimal record into the local `users` directory so local searches can
    // find accounts that were created/logged-in on this device.
    const handleLogin = async () => {
        console.log("Login:", { phoneNumber, /* password, role */ });

        // Resolve role from local data model:
        // 1) check `users` list for a matching phoneNumber and role
        // 2) if not found, attempt to scan a `rooms` list (if present) and
        //    inspect `members:<roomId>` for a match
        // 3) fallback to 'room_member'
        let assignedRole = 'room_member';
        try {
            // 1) users (centralized helper)
            const users = await getUsers();
            const matchedUser = users.find((u: any) => (u.phoneNumber || u.phone) === phoneNumber);
            if (matchedUser && matchedUser.role) {
                assignedRole = matchedUser.role;
            } else {
                // 2) scan rooms -> members if a rooms index is available
                try {
                    const rawRooms = await (async () => {
                        // avoid importing getData everywhere; still use storeData's module for room scan
                        const mod = await import('../storage/async_storage');
                        return mod.getData('rooms');
                    })();
                    const rooms = rawRooms ? JSON.parse(rawRooms) : [];
                    for (const r of rooms) {
                        const id = r?.id || r;
                        if (!id) continue;
                        const rawMembers = await (async () => {
                            const mod = await import('../storage/async_storage');
                            return mod.getData(`members:${id}`);
                        })();
                        const members = rawMembers ? JSON.parse(rawMembers) : [];
                        const match = members.find((m: any) => (m.phoneNumber || '') === phoneNumber);
                        if (match && match.role) {
                            // Do not persist or treat ROOM_MASTER as a global/session
                            // role. Keep global/session roles limited to HOME_MASTER
                            // and ROOM_MEMBER. If the member record indicates a
                            // room master, leave assignedRole as ROOM_MEMBER for
                            // session purposes.
                            if (match.role === ROLE.HOME_MASTER) {
                                assignedRole = ROLE.HOME_MASTER;
                            } else {
                                assignedRole = ROLE.ROOM_MEMBER;
                            }
                            break;
                        }
                    }
                } catch (e) {
                    // rooms list may not exist; that's fine — we simply fallback
                    console.debug('No rooms index found while resolving role', e);
                }
            }

            // Persist session values
            await storeData('userRole', assignedRole);
            await storeData('userPhone', phoneNumber);

            // Note: do not automatically copy a device-global profile into per-phone
            // keys. Profiles must remain tied to phone numbers. If users want to
            // migrate their device profile into an account, provide an explicit
            // UI action to do so.

            // Ensure users list contains the record. Do NOT persist room-scoped
            // role (room_master) into the global users table — room master
            // membership is stored per-room in `members:<roomId>`.
            if (assignedRole === 'room_master') {
                await upsertUser({ phoneNumber, name: '' });
            } else {
                await upsertUser({ phoneNumber, name: '', role: assignedRole });
            }

            // Persist a small debug snapshot on every successful login so
            // it's easy to inspect in AsyncStorage during development and
            // automated debugging sessions.
            try {
                const usersRawAfter = await getUsers();
                const debugObj = {
                    phoneNumber,
                    assignedRole,
                    timestamp: new Date().toISOString(),
                    usersRaw: usersRawAfter,
                };
                await storeData('debugLastLogin', JSON.stringify(debugObj));
                console.log('DEBUG debugLastLogin', debugObj);
            } catch (e) {
                console.error('Error writing debugLastLogin', e);
            }
        } catch (e) {
            console.error('Error persisting login state or resolving role from data model', e);
        }

        // If the user explicitly logged in as a manager role, send them to
        // their dashboard. Otherwise send everyone to the welcome screen.
        if (assignedRole === 'home_master') {
            router.replace(Routes.HOME_MASTER_DASHBOARD as any);
            return;
        }

        if (assignedRole === 'room_master') {
            router.replace(Routes.ROOM_MASTER_ROOM_VIEW_SELECTION as any);
            return;
        }

        // Default: room_member -> show welcome screen
        router.replace(Routes.WELCOME as any);
    };

    return (
        <Box className="flex-1 bg-gray-50 items-center justify-center px-6">
            <View className="bg-white rounded-3xl p-8 w-full max-w-md shadow-lg">
                <View className="mb-6 items-center">
                    <AppIcon size="md" />
                </View>

                <Heading size="md" className="mb-6 text-center">
                    Welcome {role || "user"}
                </Heading>
                {role ? (
                    <Text size="sm" className="text-gray-600 mb-4">
                        Suggested role: {role} — password field pre-filled for demo
                    </Text>
                ) : null}
                <StyledInput
                    label="Phone number"
                    value={phoneNumber}
                    onChangeText={(value) => setPhoneNumber(value)}
                />

                <StyledInput
                    label="Password"
                    value={password}
                    onChangeText={(value) => setPassword(value)}
                    secureTextEntry={true}
                />

                <Pressable onPress={() => console.log("Forgot password")}>
                    <Text size="sm" className="text-gray-600 mb-6">
                        Forget password ?
                    </Text>
                </Pressable>

                <StyledButton
                    onPress={handleLogin}
                    buttonClassName="w-full h-12"
                    size="lg"
                    buttonText="Login"
                />

                <View className="flex-row justify-center mt-4">
                    <Text size="sm" className="text-gray-600">
                        You do not have account ?{" "}
                    </Text>
                    <Pressable
                        onPress={() => router.push(Routes.SIGNUP as any)}
                    >
                        <Text size="sm" weight="semibold">
                            Sign Up
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Box>
    );
}
