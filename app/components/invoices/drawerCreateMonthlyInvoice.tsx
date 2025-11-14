import {
    Drawer,
    DrawerBackdrop,
    DrawerBody,
    DrawerContent,
    DrawerHeader,
} from "@/components/ui/drawer";
import { ScrollView, View } from "react-native";
import StyledButton from "../commons/StyledButton";
import StyledCheckBox from "../commons/StyledCheckBox";
import StyledDatePicker from "../commons/StyledDatePicker";
import StyledInput from "../commons/StyledInput";
import { Text } from "@/components/ui/text";

interface DrawerCreateMonthlyInvoiceProps {
    isOpen: boolean;
    onCancel: () => void;
    onCreate: () => void;
    selectedDate: Date | null;
    onDateChange: (date: Date | null) => void;
    expenseName: string;
    onChangeName: (value: string) => void;
    expenseAmount: number;
    onChangeAmount: (value: number) => void;
    sharing: boolean[];
    members: string[];
    onChangeSharing: (index: number) => void;
}

export default function DrawerCreateMonthlyInvoice({
    isOpen,
    onCancel,
    onCreate,
    selectedDate,
    onDateChange,
    expenseName,
    expenseAmount,
    onChangeAmount,
    onChangeName,
    sharing,
    members,
    onChangeSharing,
}: DrawerCreateMonthlyInvoiceProps) {
    const memberName = "Member 1";
    return (
        <Drawer
            className="mb-20"
            isOpen={isOpen}
            size="lg"
            anchor="bottom"
            closeOnOverlayClick={false}
        >
            <DrawerBackdrop />
            <DrawerContent>
                <DrawerHeader>
                    <StyledButton
                        variant="outline"
                        onPress={onCancel}
                        buttonText="Cancel"
                    />

                    <StyledButton onPress={onCreate} buttonText="Create" />
                </DrawerHeader>
                <DrawerBody>
                    <ScrollView>
                        <View>
                            <StyledDatePicker
                                label="Date"
                                placeholder="Select date"
                                value={selectedDate}
                                onChange={onDateChange}
                            />
                        </View>
                        <View>
                            <StyledInput
                                label="Name"
                                value={expenseName}
                                onChangeText={onChangeName}
                            />
                            <StyledInput
                                label="Cost (VND)"
                                value={expenseAmount ? String(expenseAmount).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                                onChangeText={(value) => {
                                    // sanitize input: remove all non-digit characters
                                    const cleaned = String(value || '').replace(/\D+/g, '');
                                    const num = cleaned ? Number(cleaned) : 0;
                                    onChangeAmount(num);
                                }}
                            />
                        </View>
                        <View>
                                <Text>Share with:</Text>
                        </View>
                        <View>
                            {members.map((member, index) => (
                                <StyledCheckBox
                                    key={index}
                                    isChecked={sharing[index]}
                                    label={`${member} ${
                                        member === memberName ? "(Me)" : ""
                                    }`}
                                    onChange={() => onChangeSharing(index)}
                                />
                            ))}
                        </View>
                    </ScrollView>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );
}
