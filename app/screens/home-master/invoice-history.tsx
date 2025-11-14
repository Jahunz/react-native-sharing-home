import InvoiceHistoryCard from "@/app/components/invoices/invoiceHistoryCard";
import { DrawerLayout } from "@/components/DrawerLayout";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { ScrollView, View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Icon, ArrowLeftIcon } from "@/components/ui/icon";
import { getData } from "@/app/storage/async_storage";
import Routes from "@/app/constants/Routes";

export default function InvoiceHistoryScreen() {
    const router = useRouter();
    const { roomId, roomName } = useLocalSearchParams<{
        roomId: string;
        roomName?: string;
    }>();

    const [invoiceHistory, setInvoiceHistory] = useState<
        {
            id: number;
            amount: number;
            date: string;
            status: string;
            is_show_expense: boolean;
        }[]
    >([]);
    const [memberNames, setMemberNames] = useState<string[]>([]);

    useEffect(() => {
        let mounted = true;
        const loadInvoices = async () => {
            if (!roomId) return;
            try {
                const raw = await getData(`invoices:${roomId}`);
                if (!mounted) return;
                if (raw) {
                    const parsed = JSON.parse(raw) as any[];
                    // Map persisted invoice shape to the UI shape expected by InvoiceHistoryCard
                    const mapped = parsed.map((inv) => ({
                        id: inv.id,
                        // totalAmount persisted as string (bigint), convert to Number for display
                        amount: inv.totalAmount ? Number(inv.totalAmount) : 0,
                        // keep ISO date so invoice card can render full timestamp
                        date: typeof inv.date === "string" ? inv.date : new Date(inv.date).toISOString(),
                        status: inv.status || "pending",
                        is_show_expense: false,
                        expenses: inv.expenses ?? [],
                        totalAmount: inv.totalAmount,
                    }));
                    setInvoiceHistory(mapped);
                } else {
                    // No persisted invoices for this room: empty list (new room should show none)
                    setInvoiceHistory([]);
                }
                // load members as well for receipt rendering
                try {
                    const mraw = await getData(`members:${roomId}`);
                    const mparsed = mraw ? JSON.parse(mraw) : [];
                    setMemberNames(mparsed.map((m: any) => m.name || m.phoneNumber || 'Member'));
                } catch (e) {
                    console.error('Error loading members for room', roomId, e);
                    setMemberNames([]);
                }
            } catch (e) {
                console.error("Error loading invoices for room", roomId, e);
            }
        };
        loadInvoices();
        return () => {
            mounted = false;
        };
    }, [roomId]);

    const handleShowExpense = (invoiceId: number) => {
        setInvoiceHistory(
            invoiceHistory.map((invoice) =>
                invoice.id === invoiceId
                    ? { ...invoice, is_show_expense: !invoice.is_show_expense }
                    : { ...invoice, is_show_expense: false }
            )
        );
    };

    return (
        <DrawerLayout
            title={roomName + " - Invoice history" || "Invoice history"}
            showNotificationIcon={true}
        >
            <ScrollView className="flex-1 bg-gray-50 px-4 pt-6">
                <Pressable
                    onPress={() => {
                        router.push({
                            pathname: Routes.HOME_MASTER_ROOM_DETAIL as any,
                            params: { roomId, roomName },
                        });
                    }}
                    className="flex-row items-center mb-4"
                >
                    <Icon as={ArrowLeftIcon} size="md" className="text-gray-600 mr-2" />
                    <Text className="text-sm text-gray-600">Back to room</Text>
                </Pressable>

                {invoiceHistory.length === 0 ? (
                    <View className="w-full items-center justify-center mt-8">
                        <Text className="text-center text-sm text-muted-foreground">No invoices yet for this room.</Text>
                    </View>
                ) : (
                    invoiceHistory.map((invoice) => (
                        <InvoiceHistoryCard
                                key={invoice.id}
                                invoice={invoice}
                                onShowExpense={handleShowExpense}
                                memberNames={memberNames}
                            />
                    ))
                )}
            </ScrollView>
        </DrawerLayout>
    );
}
