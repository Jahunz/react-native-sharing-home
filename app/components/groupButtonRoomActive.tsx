import { View, Pressable } from "react-native";
import StyledButton from "./commons/StyledButton";
import { Text } from "@/components/ui/text";

interface GroupButtonRoomActiveProps {
    onViewInvoiceHistoryPress: () => void;
    onCreateInvoicePress: () => void;
    onDeleteRoomPress: () => void;
    onShowQRPress?: () => void;
}
export default function GroupButtonRoomActive({
    onViewInvoiceHistoryPress,
    onCreateInvoicePress,
    onDeleteRoomPress,
    onShowQRPress,
}: GroupButtonRoomActiveProps) {
    return (
        <View className="mt-8">
            <View className="flex-row justify-between">
                <Pressable onPress={onViewInvoiceHistoryPress} className="h-12 justify-center">
                    <Text className="text-base text-blue-600">View all invoice</Text>
                </Pressable>
            </View>
        </View>
    );
}
