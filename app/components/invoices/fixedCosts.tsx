import { FixedInvoice } from "@/app/constants/types";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading, Text } from "@/components/ui/text";
import { formatDate } from "@/utils/format_date";
import React, { useMemo } from "react";
import { View } from "react-native";

interface FixedCostsProps {
    fixedCosts: FixedInvoice;
    memberCount: number;
    memberNames?: string[];
    isAssigned?: boolean;
}

export default function FixedCosts({
    fixedCosts,
    memberCount,
    memberNames,
    isAssigned = true,
}: FixedCostsProps) {
    const parsePrice = (p: any) => {
        try {
            if (typeof p === 'bigint') return p;
            if (typeof p === 'number') return BigInt(Math.floor(p));
            if (typeof p === 'string') {
                const cleaned = String(p).replace(/\D+/g, '') || '0';
                return BigInt(cleaned);
            }
            return 0n;
        } catch (e) {
            return 0n;
        }
    };

    const formatAmount = (v: number | bigint) => {
        const s = String(v || '0');
        return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const total = useMemo(() => {
        let sum = 0n;
        fixedCosts.expenses.forEach((expense) => {
            const price = parsePrice((expense as any).price);
            const qty = BigInt((expense as any).quantity || 1);
            sum += price * qty;
        });
        return sum;
    }, [fixedCosts.expenses]);

    // compute my share: prefer explicit eachMemberAmount if provided on the invoice
    const myShare = useMemo(() => {
        try {
            if (typeof fixedCosts.eachMemberAmount === 'number' && fixedCosts.eachMemberAmount > 0) {
                // use provided eachMemberAmount (convert to bigint safely)
                return BigInt(Math.floor(fixedCosts.eachMemberAmount));
            }
            const denom = BigInt(memberCount || 1);
            return denom > 0n ? total / denom : 0n;
        } catch (e) {
            return 0n;
        }
    }, [fixedCosts.eachMemberAmount, memberCount, total]);

    if (!isAssigned) {
        // Render placeholder when no invoice was assigned by Home Master
        return (
            <View className="bg-white p-3 rounded-lg my-2 shadow-sm border border-gray-200">
                <View className="mb-2">
                    <Heading size="sm">Receipt</Heading>
                    <Text className="text-xs text-muted-foreground">No invoice assigned</Text>
                    {memberNames && memberNames.length > 0 && (
                        <Text className="text-xs text-muted-foreground mt-1">{`Members: ${memberNames.join(', ')}`}</Text>
                    )}
                </View>

                <View className="mt-2">
                    <Text className="text-sm text-muted-foreground">There is no invoice assigned to this room yet.</Text>
                    <View className="mt-3 flex-row justify-between items-center">
                        <Text className="text-sm">Shared amount</Text>
                        <Text className="text-sm font-mono font-semibold">{formatAmount(0)}</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className="bg-white p-3 rounded-lg my-2 shadow-sm border border-gray-200">
            <View className="mb-2">
                <Heading size="sm">Receipt</Heading>
                <Text className="text-xs text-muted-foreground">{formatDate(fixedCosts.date)}</Text>
                {memberNames && memberNames.length > 0 && (
                    <Text className="text-xs text-muted-foreground mt-1">{`Members: ${memberNames.join(', ')}`}</Text>
                )}
            </View>

            {/* Items as receipt rows */}
            <View className="divide-y divide-dashed divide-gray-200">
                {fixedCosts.expenses.map((expense, index) => {
                    const price = parsePrice((expense as any).price);
                    const qty = BigInt((expense as any).quantity || 1);
                    const line = price * qty;
                    return (
                        <View key={`row-${index}`} className="py-2">
                            <Grid className="gap-1" _extra={{ className: "grid-cols-12 items-center" }}>
                                <GridItem _extra={{ className: "col-span-6" }}>
                                    <Text className="text-sm">{expense.name}</Text>
                                </GridItem>
                                <GridItem _extra={{ className: "col-span-3" }}>
                                    <Text className="text-sm text-right font-mono text-xs">{formatAmount(price)}</Text>
                                </GridItem>
                                <GridItem _extra={{ className: "col-span-1" }}>
                                    <Text className="text-sm text-center text-xs">{String(qty)}</Text>
                                </GridItem>
                                <GridItem _extra={{ className: "col-span-2" }}>
                                    <Text className="text-sm text-right font-mono font-semibold">{formatAmount(line)}</Text>
                                </GridItem>
                            </Grid>
                        </View>
                    );
                })}
            </View>

            {/* Totals */}
            <View className="mt-3 pt-3 border-t border-dashed border-gray-200">
                <View className="flex-row justify-between items-center">
                    <Text className="text-sm">Total</Text>
                    <Text className="text-sm font-mono font-bold">{formatAmount(total)}</Text>
                </View>
                <View className="flex-row justify-between items-center mt-1">
                    <Text className="text-xs text-muted-foreground">My share</Text>
                    <Text className="text-xs font-mono font-semibold">{formatAmount(myShare)}</Text>
                </View>
            </View>
        </View>
    );
}
