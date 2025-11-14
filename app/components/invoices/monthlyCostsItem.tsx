import { MonthlyExpense } from "@/app/constants/types";
import { HStack } from "@/components/ui/hstack";
import { CheckIcon, ClockIcon, Icon, TrashIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { formatDate } from "@/utils/format_date";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import StyledButton from "../commons/StyledButton";

interface MonthlyCostsItemProps {
    memberName: string;
    monthlyExpense: MonthlyExpense;
    onDeleteMonthlyCostsItem: () => void;
}

export default function MonthlyCostsItem({
    memberName,
    monthlyExpense,
    onDeleteMonthlyCostsItem,
}: MonthlyCostsItemProps) {
    const confirmationCount = useMemo(() => monthlyExpense.sharing.length, [monthlyExpense.sharing]);
    return (
        <View className="bg-gray-100 my-3 rounded-2xl p-4">
            <HStack className="justify-between">
                <Text className="font-medium">{monthlyExpense.name}</Text>
                <Text className="font-medium">
                    {monthlyExpense.amount.toLocaleString()}
                </Text>
            </HStack>
            <HStack className="justify-between my-1">
                <Text>{`Date: ${formatDate(monthlyExpense.date)}`}</Text>
                <Text>{`Share: ${confirmationCount} / ${monthlyExpense.sharing.length}`}</Text>
            </HStack>
            <Text className="font-medium">{`Payer: ${monthlyExpense.payer} ${
                monthlyExpense.payer.name === memberName ? "(Me)" : ""
            }`}</Text>
            <HStack className="justify-between">
                <View className="mt-2">
                    {monthlyExpense.sharing.map((sharing, index) => (
                        <HStack key={index} className="items-center">
                            {sharing.is_confirmed ? (
                                <Icon
                                    as={CheckIcon}
                                    size="sm"
                                    className="text-green-500"
                                />
                            ) : (
                                <Icon
                                    as={ClockIcon}
                                    size="sm"
                                    className="text-yellow-500"
                                />
                            )}
                            <Text className="ml-2">{`${sharing.member.name} ${
                                sharing.member.name === memberName ? "(Me)" : ""
                            }`}</Text>
                        </HStack>
                    ))}
                </View>
                <View className="justify-center">
                    <Pressable onPress={onDeleteMonthlyCostsItem}>
                        <Icon as={TrashIcon} className="text-red-500" />
                    </Pressable>
                </View>
            </HStack>
            {/* no assign/confirm button — splits are handled at creation time */}
        </View>
    );
}
