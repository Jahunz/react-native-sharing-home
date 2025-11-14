import { Grid, GridItem } from "@/components/ui/grid";
import { HStack } from "@/components/ui/hstack";
import { CheckIcon, EyeIcon, ClockIcon, Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Pressable, View } from "react-native";
import StyledBadge from "../commons/StyledBadge";
import TableFixedInvoiceHistory from "./tableFixedInvoiceHistory";
import FixedCosts from "./fixedCosts";
import StyledButton from "../commons/StyledButton";

interface InvoiceHistoryCardProps {
    invoice: {
        id: number;
        amount: number;
        date: string;
        status: string;
        is_show_expense: boolean;
        expenses?: any[];
        totalAmount?: string | number;
    };
    onShowExpense: (invoiceId: number) => void;
    onEditInvoice?: (invoiceId: number) => void;
    onDeleteInvoice?: (invoiceId: number) => void;
    memberNames?: string[];
}

export default function InvoiceHistoryCard({
    invoice,
    onShowExpense,
    onEditInvoice,
    onDeleteInvoice,
    memberNames = [],
}: InvoiceHistoryCardProps) {
    const handleShowExpense = () => {
        onShowExpense(invoice.id);
    };

    // compute total from invoice.expenses (supports price as bigint or string)
    const computeTotal = (expenses: any[] = []) => {
        try {
            return expenses.reduce((s, e) => s + (BigInt((e as any).price || 0n) * BigInt(e.quantity || 1)), 0n);
        } catch (e) {
            return 0n;
        }
    }

    const mapStatusToIcon = (status: string) => {
        switch (status) {
            case "paid":
                return CheckIcon;
            case "pending":
                return ClockIcon;
        }
    };

    const mapStatusToAction = (status: string) => {
        switch (status) {
            case "paid":
                return "success";
            case "pending":
                return "warning";
            default:
                return "muted";
        }
    };

    const formattedMonthYear = (() => {
        try {
            const d = new Date(invoice.date);
            if (!isNaN(d.getTime())) {
                const month = d.toLocaleString(undefined, { month: "long" });
                return `${month} - ${d.getFullYear()}`;
            }
            // fallback: if invoice.date is not a valid date, try to massage invoice.date string
            if (typeof invoice.date === 'string') {
                const parts = String(invoice.date).trim().split(/\s+/);
                if (parts.length >= 2) {
                    const year = parts[parts.length - 1];
                    const month = parts.slice(0, parts.length - 1).join(' ');
                    return `${month} - ${year}`;
                }
            }
            return String(invoice.date);
        } catch (e) {
            return String(invoice.date);
        }
    })();

    const formattedFullTimestamp = (() => {
        try {
            const d = new Date(invoice.date);
            if (isNaN(d.getTime())) return invoice.date;
            const pad = (n: number) => String(n).padStart(2, "0");
            const yyyy = d.getFullYear();
            const mm = pad(d.getMonth() + 1);
            const dd = pad(d.getDate());
            const hh = pad(d.getHours());
            const min = pad(d.getMinutes());
            const ss = pad(d.getSeconds());
            return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
        } catch (e) {
            return invoice.date;
        }
    })();

    return (
        <View className="bg-white my-1 rounded-2xl w-full px-4 pt-6 pb-4">
            <HStack space="md" reversed={false} className="justify-between p-2">
                <View className="flex-1">
                    <Text size="lg" className="font-bold">
                        Month: {formattedMonthYear}
                    </Text>
                    <Text size="md" className="font-medium mt-1">
                        Invoice amount: {Number(invoice.amount || 0).toLocaleString()}
                    </Text>
                    <Text size="sm" className="text-muted-foreground mt-1">
                        Created in: {formattedFullTimestamp}
                    </Text>
                    <View className="flex-row items-center justify-between rounded-2xl mt-2">
                        <StyledBadge
                            label={invoice.status}
                            icon={mapStatusToIcon(invoice.status)}
                            action={mapStatusToAction(invoice.status)}
                        />
                    </View>
                                    {/* Edit / Delete actions */}
                                    <View className="flex-row space-x-3 mt-3">
                                        {typeof onEditInvoice === 'function' ? (
                                            <StyledButton
                                                onPress={() => onEditInvoice(invoice.id)}
                                                buttonClassName="px-3 py-2"
                                                buttonText="Edit"
                                                variant="outline"
                                                size="sm"
                                            />
                                        ) : null}
                                        {typeof onDeleteInvoice === 'function' ? (
                                            <StyledButton
                                                onPress={() => onDeleteInvoice(invoice.id)}
                                                buttonClassName="px-3 py-2 bg-red-500"
                                                buttonText="Delete"
                                                variant="solid"
                                                size="sm"
                                                textClassName="text-white"
                                            />
                                        ) : null}
                                    </View>
                </View>

                <Pressable onPress={handleShowExpense}>
                    <View className="flex-1 items-end justify-center">
                        <Icon as={EyeIcon} size="lg" />
                    </View>
                </Pressable>
            </HStack>
            {invoice.is_show_expense ? (
                <>
                    {/* Render receipt view using FixedCosts for a nicer printed receipt */}
                    <FixedCosts
                        fixedCosts={{
                            date: invoice.date ? new Date(invoice.date) : new Date(),
                            expenses: invoice.expenses ?? [],
                            // totalAmount in storage may be string (BigInt stored as string); convert to number for FixedInvoice.totalAmount
                            totalAmount: typeof invoice.totalAmount === 'string' ? Number(invoice.totalAmount) : (invoice.totalAmount as number) || Number(invoice.amount || 0),
                            eachMemberAmount: 0,
                        }}
                        memberCount={memberNames.length || 1}
                        memberNames={memberNames}
                        isAssigned={true}
                    />
                </>
            ) : null}
        </View>
    );
}
