import { MonthlyExpense } from "@/app/constants/types";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/text";
import { View } from "react-native";
import MonthlyCostsItem from "./monthlyCostsItem";

interface MonthlyCostsProps {
    monthlyExpenses: MonthlyExpense[];
    onAddNewMonthlyExpense: () => void;
    onDeleteMonthlyExpense: (index: number) => void;
}

export default function MonthlyCosts({
    monthlyExpenses,
    onAddNewMonthlyExpense,
    onDeleteMonthlyExpense,
}: MonthlyCostsProps) {
    const memberName = "Member 1";
    // Group monthly expenses by name + payer so multiple items created by
    // the home master that refer to the same logical charge show as a
    // single combined row.
    const groups = monthlyExpenses.reduce((acc: Map<string, { indices: number[]; item: any }>, me, idx) => {
        const key = `${me.name}::${me.payer?.id ?? 'none'}`;
        const existing = acc.get(key);
        if (!existing) {
            acc.set(key, { indices: [idx], item: { ...me } });
        } else {
            existing.indices.push(idx);
            // accumulate amount
            existing.item.amount = (existing.item.amount || 0) + (me.amount || 0);
            // concatenate sharing arrays
            existing.item.sharing = [...(existing.item.sharing || []), ...(me.sharing || [])];
            acc.set(key, existing);
        }
        return acc;
    }, new Map<string, { indices: number[]; item: any }>());

    const grouped = Array.from(groups.values());

    return (
        <View className="bg-gray-200 p-4 rounded-2xl my-2">
            <HStack className="items-center">
                <Heading size="md">Fixed Costs</Heading>
            </HStack>

            {grouped.map((g, gi) => (
                    <MonthlyCostsItem
                        key={gi}
                        memberName={memberName}
                        monthlyExpense={g.item}
                        onDeleteMonthlyCostsItem={() => {
                            // delete the first underlying index (caller will need to handle removal semantics)
                            onDeleteMonthlyExpense(g.indices[0]);
                        }}
                    />
            ))}
        </View>
    );
}
