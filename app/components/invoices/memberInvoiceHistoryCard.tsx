import { FullPersonalInvoiceHistory } from "@/app/constants/types";
import { HStack } from "@/components/ui/hstack";
import { EyeIcon, Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { dummy_room_member_invoice_history_detail } from "@/utils/dummy";
import { useState } from "react";
import { Pressable, View } from "react-native";
// render inline via parent toggle
import TableMemberInvoiceHistory from "./tableMemberInvoiceHistory";
import FixedCosts from "./fixedCosts";

interface MemberInvoiceHistoryCardProps {
    invoice: {
        id: number;
        month: string;
        actual_cost: number;
        is_show_expense: boolean;
        // optional full invoice payload when loaded from storage
        invoice?: any;
    };
    onShowExpense: (invoiceId: number) => void;
}

export default function MemberInvoiceHistoryCard({
    invoice,
    onShowExpense,
}: MemberInvoiceHistoryCardProps) {
    const [invoiceHistoryDetail] = useState<FullPersonalInvoiceHistory | undefined>(undefined);
    const handleShowExpense = () => {
        // Toggle inline rendering of the invoice under the month in the parent
        onShowExpense(invoice.id);
    };

    return (
        <View className="bg-white my-1 rounded-2xl w-full px-4 py-4 shadow-md">
            <HStack
                space="md"
                reversed={false}
                className="justify-between px-2"
            >
                <View className="flex-1">
                    {(() => {
                        // Prefer explicit invoice date when available, otherwise try to massage invoice.month into 'Month - Year'
                        const formattedMonthYear = (() => {
                            try {
                                if (invoice.invoice?.date) {
                                    const d = new Date(invoice.invoice.date);
                                    if (!isNaN(d.getTime())) {
                                        const month = d.toLocaleString(undefined, { month: 'long' });
                                        return `${month} - ${d.getFullYear()}`;
                                    }
                                }
                                if (typeof invoice.month === 'string') {
                                    const parts = invoice.month.trim().split(/\s+/);
                                    if (parts.length >= 2) {
                                        const year = parts[parts.length - 1];
                                        const month = parts.slice(0, parts.length - 1).join(' ');
                                        return `${month} - ${year}`;
                                    }
                                    return invoice.month;
                                }
                                return String(invoice.month);
                            } catch (e) {
                                return String(invoice.month);
                            }
                        })();

                        return (
                            <>
                                <Text size="lg" className="font-bold">Month: {formattedMonthYear}</Text>
                                {!invoice.is_show_expense && (
                                    <Text size="md" className="font-medium">Invoice amount: {Number(invoice.actual_cost || 0).toLocaleString()}</Text>
                                )}
                            </>
                        );
                    })()}
                </View>

                <Pressable onPress={handleShowExpense}>
                    <View className="flex-1 items-end justify-center">
                        <Icon as={EyeIcon} size="lg" />
                    </View>
                </Pressable>
            </HStack>
            {invoice.is_show_expense ? (
                <>
                    {/* Render receipt style view when expanded */}
                    <FixedCosts
                        fixedCosts={{
                            date: invoice.invoice?.date ? new Date(invoice.invoice.date) : new Date(),
                            expenses: invoice.invoice?.expenses ?? [],
                            totalAmount: typeof invoice.invoice?.totalAmount === 'string' ? Number(invoice.invoice.totalAmount) : (invoice.invoice?.totalAmount as number) || Number(invoice.actual_cost || 0),
                            eachMemberAmount: Number(invoice.invoice?.eachMemberAmount || 0),
                        }}
                        memberCount={(invoice.invoice?.members && invoice.invoice.members.length) || 1}
                        memberNames={(invoice.invoice?.members || []).map((m: any) => m.name || m.phoneNumber || 'Member')}
                        isAssigned={true}
                    />
                </>
            ) : null}
        </View>
    );
}
