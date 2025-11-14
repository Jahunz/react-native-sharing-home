import { FullSummaryInvoiceHistory } from "@/app/constants/types";
import { Grid, GridItem } from "@/components/ui/grid";
import {
    BellIcon,
    CheckIcon,
    ClockIcon,
    DownloadIcon,
} from "@/components/ui/icon";
import { ROLE } from "@/app/constants/enum";
import { Text } from "@/components/ui/text";
import { View } from "react-native";
import { getData, storeData } from "@/app/storage/async_storage";
import StyledBadge from "../commons/StyledBadge";
import StyledIconButton from "../commons/StyledIconButton";
import MemberShareBox from "./common/memberShareBox";
import React, { useEffect, useState } from "react";

interface TableRoomMasterInvoiceHistoryProps {
    invoice_history?: FullSummaryInvoiceHistory;
    // optional context to persist confirmation state
    roomId?: string | number;
    invoiceId?: number;
}

const StyledTextHeader = ({ children, ...props }: any) => {
    return (
        <Text className="font-semibold" {...props}>
            {children}
        </Text>
    );
};

const StyledTextAmount = ({ children, ...props }: any) => {
    return (
        <Text size="sm" {...props}>
            {children}
        </Text>
    );
};

export default function TableRoomMasterInvoiceHistory({
    invoice_history,
    roomId,
    invoiceId,
}: TableRoomMasterInvoiceHistoryProps) {
    const [isRoomMaster, setIsRoomMaster] = useState(false);
    const [invoiceStatus, setInvoiceStatus] = useState<string | undefined>(undefined);

    useEffect(() => {
        let mounted = true;
        const checkRole = async () => {
            try {
                if (!roomId) return;
                const userPhone = await getData('userPhone');
                const raw = await getData(`members:${roomId}`);
                const members = raw ? JSON.parse(raw) : [];
                if (!mounted) return;
                const match = members.find((m: any) => (m.phoneNumber || '') === (userPhone || ''));
                setIsRoomMaster(!!(match && match.role === ROLE.ROOM_MASTER));
            } catch (e) {
                console.error('Error checking room master role', e);
            }
        };
        checkRole();
        return () => { mounted = false; };
    }, [roomId]);
    const mapStatusToIcon = (status: string) => {
        const s = (status || '').toString().toUpperCase();
        switch (s) {
            case 'PAYMENT SENT':
            case 'COMPLETE':
                return CheckIcon;
            case 'PENDING':
                return ClockIcon;
            default:
                return ClockIcon;
        }
    };

    const mapStatusToAction = (status: string) => {
        const s = (status || '').toString().toUpperCase();
        switch (s) {
            case 'PAYMENT SENT':
            case 'COMPLETE':
                return 'success';
            case 'PENDING':
                return 'warning';
            default:
                return 'muted';
        }
    };

    const handleDownloadPDF = () => {
        console.log("Download PDF");
    };

    const handleNotifyMember = () => {
        console.log("Notify members");
    };

    const handleMarkPaid = async () => {
        try {
            if (!roomId || !invoiceId) {
                console.warn('Cannot persist invoice paid status: missing roomId or invoiceId');
                return;
            }
            const key = `invoices_status:${roomId}`;
            const raw = await getData(key);
            const list = raw ? JSON.parse(raw) : [];
            // upsert
            const idx = list.findIndex((i: any) => i.id === invoiceId);
            const newStatus = 'PAYMENT SENT';
            if (idx === -1) {
                list.push({ id: invoiceId, status: newStatus, updatedAt: new Date().toISOString() });
            } else {
                list[idx] = { ...list[idx], status: newStatus, updatedAt: new Date().toISOString() };
            }
            await storeData(key, JSON.stringify(list));
            console.log('[tableRoomMasterInvoiceHistory] marked invoice as paid', invoiceId, 'room', roomId);
            // Also update the canonical invoices list for this room so Home master views reflect the paid status
            try {
                const invKey = `invoices:${roomId}`;
                const rawInv = await getData(invKey);
                const invoices = rawInv ? JSON.parse(rawInv) : [];
                const invIdx = invoices.findIndex((iv: any) => iv.id === invoiceId || (iv.invoice && iv.invoice.id === invoiceId));
                const prevStatus = invIdx !== -1 ? invoices[invIdx].status : undefined;
                if (invIdx !== -1) {
                    invoices[invIdx] = { ...invoices[invIdx], status: newStatus, updatedAt: new Date().toISOString() };
                    await storeData(invKey, JSON.stringify(invoices));
                    console.log('[tableRoomMasterInvoiceHistory] updated invoices storage status', invoiceId, 'from', prevStatus, 'to', newStatus);
                }
                const debugKey = `debugInvoice`;
                const debugObj = { invoiceId, roomId, prevStatus, newStatus, when: new Date().toISOString() };
                await storeData(debugKey, JSON.stringify(debugObj));
            } catch (e) {
                console.error('[tableRoomMasterInvoiceHistory] error updating canonical invoice status', e);
            }
            setInvoiceStatus(newStatus);
        } catch (e) {
            console.error('Error marking invoice as paid', e);
        }
    };

    // load invoice status on mount
    useEffect(() => {
        let mounted = true;
        const loadStatus = async () => {
            try {
                if (!roomId || !invoiceId) return;
                const key = `invoices_status:${roomId}`;
                const raw = await getData(key);
                const list = raw ? JSON.parse(raw) : [];
                if (!mounted) return;
                const found = list.find((i: any) => i.id === invoiceId);
                const status = found && typeof found.status === 'string' ? String(found.status).toUpperCase() : undefined;
                setInvoiceStatus(status);
            } catch (e) {
                console.error('Error loading invoice status', e);
            }
        };
        loadStatus();
        return () => { mounted = false; };
    }, [roomId, invoiceId]);

    if (!invoice_history) return null;

    const canonicalStatus = invoice_history?.status ? String(invoice_history.status).toUpperCase() : 'PENDING';
    const displayStatus = invoiceStatus || canonicalStatus;

    return (
        <View className="mx-2">
            <View className="w-[50%] my-2">
                <StyledBadge
                    label={invoice_history.status || displayStatus}
                    icon={mapStatusToIcon(displayStatus)}
                    action={mapStatusToAction(displayStatus)}
                />
            </View>

            {/* Actions area */}
            {displayStatus === 'COMPLETE' && (
                <View className="flex-row items-center justify-between rounded-2xl">
                    <StyledIconButton
                        buttonText="Download PDF"
                        icon={DownloadIcon}
                        buttonClassName="bg-blue-300 rounded-full py-0 h-8"
                        textClassName="text-blue-900 font-medium text-md"
                        onPress={handleDownloadPDF}
                    />
                </View>
            )}

            {displayStatus === 'PENDING' && (
                <View className="flex-row items-center justify-between rounded-2xl">
                    <StyledIconButton
                        buttonText="Notify members"
                        icon={BellIcon}
                        buttonClassName="bg-blue-300 rounded-full py-0 h-8"
                        textClassName="text-blue-900 font-medium text-md"
                        onPress={handleNotifyMember}
                    />

                    {isRoomMaster && (
                        (invoiceStatus && (invoiceStatus === 'PAYMENT SENT' || invoiceStatus === 'COMPLETE')) ? (
                            <StyledIconButton
                                buttonText={invoiceStatus === 'COMPLETE' ? 'Complete' : 'Payment sent'}
                                icon={CheckIcon}
                                buttonClassName="bg-green-600 rounded-full py-0 h-8"
                                textClassName="text-white font-medium text-md"
                                onPress={() => {}}
                            />
                        ) : (
                            <StyledIconButton
                                buttonText="Confirm payment"
                                icon={CheckIcon}
                                buttonClassName="bg-gray-300 rounded-full py-0 h-8"
                                textClassName="text-gray-900 font-medium text-md"
                                onPress={handleMarkPaid}
                            />
                        )
                    )}
                </View>
            )}

            {/* If the display status is PAYMENT SENT but canonical is PAYMENT SENT/COMPLETE, show Download as well */}
            {(displayStatus === 'PAYMENT SENT') && (
                <View className="flex-row items-center justify-between rounded-2xl">
                    <StyledIconButton
                        buttonText="Download PDF"
                        icon={DownloadIcon}
                        buttonClassName="bg-blue-300 rounded-full py-0 h-8"
                        textClassName="text-blue-900 font-medium text-md"
                        onPress={handleDownloadPDF}
                    />
                </View>
            )}
            <Grid
                className="gap-2 gap-x-10 mt-4"
                _extra={{ className: "grid-cols-12" }}
            >
                <GridItem
                    className="bg-gray-100 px-4 py-4 rounded-xl"
                    _extra={{ className: "col-span-6" }}
                >
                    <StyledTextHeader>Fixed Costs</StyledTextHeader>
                    <StyledTextAmount>
                        {invoice_history?.invoice?.fixed_costs.toLocaleString()}
                    </StyledTextAmount>
                </GridItem>
                <GridItem
                    className="bg-gray-100 px-4 py-4 rounded-xl"
                    _extra={{ className: "col-span-6" }}
                >
                    <StyledTextHeader>Monthly Costs</StyledTextHeader>
                    <StyledTextAmount>
                        {invoice_history?.invoice?.monthly_costs.toLocaleString()}
                    </StyledTextAmount>
                </GridItem>
                {invoice_history?.invoice?.members_share.map(
                    (member_share, index) => (
                        <GridItem
                            key={index}
                            className="bg-gray-100 px-4 py-4 rounded-xl"
                            _extra={{ className: "col-span-12" }}
                        >
                            <MemberShareBox
                                member_share={member_share}
                                title={member_share.member.name}
                            />
                        </GridItem>
                    )
                )}
            </Grid>
        </View>
    );
}
