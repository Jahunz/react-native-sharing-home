import { FullPersonalInvoiceHistory } from "@/app/constants/types";
import { HStack } from "@/components/ui/hstack";
import { EyeIcon, Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useState, useEffect } from "react";
import { Pressable, View } from "react-native";
import FixedCosts from "./fixedCosts";
import { getData, storeData } from "@/app/storage/async_storage";
import StyledIconButton from "../commons/StyledIconButton";
import { CheckIcon } from "@/components/ui/icon";

interface RoomMasterInvoiceHistoryCardProps {
    invoice: {
        id: number;
        month: string;
        actual_cost: number;
        is_show_expense: boolean;
        // optional full invoice payload when loaded from storage
        invoice?: any;
    };
    roomId: string;
    onShowExpense: (invoiceId: number) => void;
}

export default function RoomMasterInvoiceHistoryCard({
    invoice,
    onShowExpense,
    roomId,
}: RoomMasterInvoiceHistoryCardProps) {
    const [invoiceHistoryDetail] = useState<FullPersonalInvoiceHistory | undefined>(undefined);

    const handleShowExpense = () => {
        onShowExpense(invoice.id);
    };

    const handleConfirmPayment = async () => {
        try {
            if (!roomId) return;
            const key = `invoices_status:${roomId}`;
            const raw = await getData(key);
            const list = raw ? JSON.parse(raw) : [];
            const idx = list.findIndex((i: any) => i.id === invoice.id);
            // Our canonical statuses: PENDING, PAYMENT SENT, COMPLETE
            const newStatus = 'PAYMENT SENT';
            if (idx === -1) {
                list.push({ id: invoice.id, status: newStatus, updatedAt: new Date().toISOString() });
            } else {
                list[idx] = { ...list[idx], status: newStatus, updatedAt: new Date().toISOString() };
            }
            await storeData(key, JSON.stringify(list));
            console.log('[roomMasterInvoiceHistoryCard] marked invoice as paid', invoice.id, 'room', roomId);
            // Also update the canonical invoices list for this room so Home master views reflect the paid status
            try {
                const invKey = `invoices:${roomId}`;
                const rawInv = await getData(invKey);
                const invoices = rawInv ? JSON.parse(rawInv) : [];
                const invIdx = invoices.findIndex((iv: any) => iv.id === invoice.id || (iv.invoice && iv.invoice.id === invoice.id));
                const prevStatus = invIdx !== -1 ? invoices[invIdx].status : undefined;
                if (invIdx !== -1) {
                    invoices[invIdx] = { ...invoices[invIdx], status: newStatus, updatedAt: new Date().toISOString() };
                    await storeData(invKey, JSON.stringify(invoices));
                    console.log('[roomMasterInvoiceHistoryCard] updated invoices storage status', invoice.id, 'from', prevStatus, 'to paid');
                }
                // write a small debug entry for inspection
                const debugKey = `debugInvoice`;
                const debugObj = { invoiceId: invoice.id, roomId, prevStatus, newStatus, when: new Date().toISOString() };
                await storeData(debugKey, JSON.stringify(debugObj));
            } catch (e) {
                console.error('[roomMasterInvoiceHistoryCard] error updating canonical invoice status', e);
            }
            setIsPaid(true);
        } catch (e) {
            console.error('Error marking invoice as paid', e);
        }
    };

    const [isPaid, setIsPaid] = useState(false);

    useEffect(() => {
        let mounted = true;
        const loadStatus = async () => {
            try {
                if (!roomId) return;
                const key = `invoices_status:${roomId}`;
                const raw = await getData(key);
                const list = raw ? JSON.parse(raw) : [];
                if (!mounted) return;
                const found = list.find((i: any) => i.id === invoice.id);
                const status = found && typeof found.status === 'string' ? String(found.status).toUpperCase() : undefined;
                setIsPaid(!!(status && (status === 'PAYMENT SENT' || status === 'COMPLETE')));
            } catch (e) {
                console.error('Error loading invoice status', e);
            }
        };
        loadStatus();
        return () => { mounted = false; };
    }, [roomId, invoice.id]);

    return (
        <View className="bg-white my-1 rounded-2xl w-full px-4 py-4 shadow-md">
            <HStack
                space="md"
                reversed={false}
                className="justify-between px-2"
            >
                <View className="flex-1">
                    {(() => {
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

                    <View className="flex-row items-center justify-end mt-3">
                        {isPaid ? (
                            <StyledIconButton
                                buttonText="Paid"
                                icon={CheckIcon}
                                buttonClassName="bg-green-600 rounded-full py-0 h-8"
                                textClassName="text-white font-medium text-md"
                                // no-op when already paid
                                onPress={() => {}}
                            />
                        ) : (
                            <StyledIconButton
                                buttonText="Confirm payment"
                                icon={CheckIcon}
                                buttonClassName="bg-gray-300 rounded-full py-0 h-8"
                                textClassName="text-gray-900 font-medium text-md"
                                onPress={handleConfirmPayment}
                            />
                        )}
                    </View>
                </>
            ) : null}
        </View>
    );
}

