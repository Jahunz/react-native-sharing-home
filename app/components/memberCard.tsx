import {
    Avatar,
    AvatarFallbackText,
    AvatarImage,
} from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { Icon, TrashIcon, EditIcon, CrownIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import React, { useMemo } from "react";
import { Pressable, View } from "react-native";
import { ROLE } from "../constants/enum";

interface MemberCardProps {
    avatar?: string;
    memberName: string;
    phoneNumber: string;
    role: string;
    canDelete?: boolean;
    onDelete?: () => void;
    canEdit?: boolean;
    onEdit?: () => void;
    canAssign?: boolean;
    onAssign?: () => void;
}

export default function MemberCard({
    avatar,
    memberName,
    phoneNumber,
    role,
    canDelete = false,
    onDelete = () => {},
    canEdit = false,
    onEdit = () => {},
    canAssign = false,
    onAssign = () => {},
}: MemberCardProps) {
    const roleDisplay = useMemo(() => {
        switch (role) {
            case ROLE.ROOM_MEMBER:
                return "Member";
            case ROLE.ROOM_MASTER:
                return "Room master";
            default:
                return "";
        }
    }, [role]);
    return (
        <View className="bg-white mb-2 rounded-2xl w-full">
            <HStack space="md" reversed={false} className="justify-between p-4">
                <View className="h-20 w-20 align-center justify-center ml-2">
                    <Avatar size="md">
                        <AvatarFallbackText>{memberName ? memberName[0].toUpperCase() : '👤'}</AvatarFallbackText>
                        {/* Only render AvatarImage when a real avatar URL is present.
                            Older members may have been persisted with a stock
                            placeholder image — treat that as no-avatar so the
                            fallback silhouette is shown instead. */}
                        {avatar && avatar !== "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80" ? (
                            <AvatarImage source={{ uri: avatar }} />
                        ) : null}
                    </Avatar>
                </View>
                <View className="h-20 flex-1 justify-center mr-2">
                    <Text size="md" className="font-bold" numberOfLines={1} ellipsizeMode="tail">
                        {memberName}
                    </Text>
                    <Text size="sm" className="text-muted-foreground" numberOfLines={1} ellipsizeMode="tail">
                        {phoneNumber}
                    </Text>
                </View>
                <View className="h-20 w-28 items-end justify-center mr-2">
                    <Text size="sm" className="font-medium">
                        {roleDisplay}
                    </Text>
                    {canDelete && (
                        <Pressable onPress={onDelete}>
                            <Icon
                                as={TrashIcon}
                                size="md"
                                className="text-red-500 font-medium"
                            />
                        </Pressable>
                    )}
                    {canEdit && (
                        <Pressable onPress={onEdit} className="mt-2">
                            <Icon as={EditIcon} size="md" className="text-blue-500 ml-2" />
                        </Pressable>
                    )}
                    {canAssign && (
                        <Pressable onPress={onAssign} className="mt-2">
                            <Icon as={CrownIcon} size="md" className="text-yellow-600 ml-2" />
                        </Pressable>
                    )}
                </View>
            </HStack>
        </View>
    );
}
