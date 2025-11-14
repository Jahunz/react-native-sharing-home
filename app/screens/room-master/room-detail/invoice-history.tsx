import RoomMasterInvoiceHistoryCard from "@/app/components/invoices/roomMasterInvoiceHistoryCard";
import { ShortPersonalInvoiceHistory } from "@/app/constants/types";
import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { getData } from "@/app/storage/async_storage";
import { formatDate } from "@/utils/format_date";

interface MasterInvoiceHistory extends ShortPersonalInvoiceHistory {
    is_show_expense: boolean;
}
export default function InvoiceHistoryTab() {
    const { roomId, roomName } = useLocalSearchParams<{
        roomId: string;
        roomName?: string;
    }>();

    const [invoiceHistory, setInvoiceHistory] = useState<
        MasterInvoiceHistory[]
    >([]);

    useEffect(() => {
        const loadInvoices = async () => {
            if (!roomId) return;
            try {
                const raw = await getData(`invoices:${roomId}`);
                if (raw) {
                    const list = JSON.parse(raw);
                    if (Array.isArray(list)) {
                        const mapped = list.map((inv: any) => ({
                            id: inv.id || Date.now(),
                            month: inv.date ? formatDate(new Date(inv.date)) : "",
                            actual_cost: inv.totalAmount || 0,
                            invoice: inv,
                            is_show_expense: false,
                        }));
                        setInvoiceHistory(mapped.reverse()); // latest first
                        return;
                    }
                }
            } catch (e) {
                console.error('Error loading invoices for room', roomId, e);
            }
            // fallback: keep empty list
            setInvoiceHistory([]);
        };

        loadInvoices();
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
        <View className="flex-1 bg-gray-50 mt-2 mx-1">
            {invoiceHistory.map((invoice) => (
                <RoomMasterInvoiceHistoryCard
                    key={invoice.id}
                    invoice={invoice}
                    onShowExpense={handleShowExpense}
                    roomId={roomId as string}
                />
            ))}
        </View>
    );
}
