import { View } from "react-native";
import StyledButton from "./commons/StyledButton";

interface GroupButtonRoomEmptyProps {
    onAddRoomMasterPress?: () => void;
    onDeleteRoomPress: () => void;
    onShowQRPress?: () => void;
}

export default function GroupButtonRoomEmpty({
    onAddRoomMasterPress,
    onDeleteRoomPress,
    onShowQRPress,
}: GroupButtonRoomEmptyProps) {
    return (
        <View>
            {onAddRoomMasterPress ? (
                <StyledButton
                    onPress={onAddRoomMasterPress}
                    buttonClassName="h-12"
                    size="lg"
                    buttonText="Add room master"
                />
            ) : null}
            {/* Show QR and Delete actions moved to the FAB popup (room-detail) */}
        </View>
    );
}
