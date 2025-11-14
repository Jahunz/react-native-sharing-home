import CurrentInvoiceHistory from "@/app/components/invoices/currentInvoiceHistory";
import RoomMasterInvoiceHistoryCard from "@/app/components/invoices/roomMasterInvoiceHistoryCard";
import {
    FullSummaryInvoiceHistory,
    ShortSummaryInvoiceHistory,
} from "@/app/constants/types";
import {
    dummy_room_master_invoice_history_detail,
    dummy_room_master_invoice_history_list,
} from "@/utils/dummy";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";

interface SummaryInvoiceHistory extends ShortSummaryInvoiceHistory {
    is_show_expense: boolean;
}
export default function SummaryTab() {
    const router = useRouter();
    const { roomId, roomName } = useLocalSearchParams<{
        roomId: string;
        roomName?: string;
    }>();

    const [invoiceHistory, setInvoiceHistory] = useState<
        SummaryInvoiceHistory[]
    >(dummy_room_master_invoice_history_list);

    const [currentInvoice, setCurrentInvoice] =
        useState<FullSummaryInvoiceHistory>();

    const handleShowExpense = (invoiceId: number) => {
        setInvoiceHistory(
            invoiceHistory.map((invoice) =>
                invoice.id === invoiceId
                    ? { ...invoice, is_show_expense: !invoice.is_show_expense }
                    : { ...invoice, is_show_expense: false }
            )
        );
    };

    const handleCalculateSummary = () => {
        console.log("Calculate summary");
        setCurrentInvoice({
            ...dummy_room_master_invoice_history_detail,
            status: "pending",
        });
    };

    const handleCompleteCurrentInvoice = () => {
        console.log("Complete summary invoice");
        setCurrentInvoice((prev) =>
            prev
                ? {
                      ...prev,
                      status: "paid",
                  }
                : undefined
        );
    };
    return (
        <View className="my-2">
            <CurrentInvoiceHistory
                currentInvoice={currentInvoice}
                handleCalculateSummary={handleCalculateSummary}
                handleCompleteCurrentInvoice={handleCompleteCurrentInvoice}
            />
            {invoiceHistory.map((invoice) => (
                <RoomMasterInvoiceHistoryCard
                    key={invoice.id}
                    invoice={invoice}
                    onShowExpense={handleShowExpense}
                    roomId={roomId}
                />
            ))}
        </View>
    );
}
