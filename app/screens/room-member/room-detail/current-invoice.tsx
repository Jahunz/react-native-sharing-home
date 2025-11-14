// import StyledButton from "@/app/components/commons/StyledButton";
import DrawerCreateMonthlyInvoice from "@/app/components/invoices/drawerCreateMonthlyInvoice";
import FixedCosts from "@/app/components/invoices/fixedCosts";
import MonthlyCosts from "@/app/components/invoices/monthlyCosts";
import { FixedInvoice, MonthlyExpense } from "@/app/constants/types";
import { dummy_fixed_costs, dummy_monthly_costs } from "@/utils/dummy";
import React, { useState, useEffect } from "react";
import { ROLE } from "@/app/constants/enum";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getData, storeData } from "@/app/storage/async_storage";

export default function CurrentInvoiceTab() {
    const [showCreateInvoiceDrawer, setShowCreateInvoiceDrawer] =
        useState(false);
    const { roomId, invoiceId, openCreate } = useLocalSearchParams<{ roomId: string; invoiceId?: string; openCreate?: string }>();
    const [fixedCosts, setFixedCosts] =
        useState<FixedInvoice>({ date: new Date(), expenses: [], totalAmount: 0, eachMemberAmount: 0 });

    const [isAssigned, setIsAssigned] = useState<boolean>(false);

    const [monthlyCosts, setMonthlyCosts] =
        useState<MonthlyExpense[]>(dummy_monthly_costs);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [newExpenseName, setNewExpenseName] = useState("");
    const [newExpenseAmount, setNewExpenseAmount] = useState(0);
    const [sharing, setSharing] = useState([false, false, false, false]);

    const [members, setMembers] = useState<string[]>([]);

    useEffect(() => {
        const loadInvoiceForRoom = async () => {
            if (!roomId) return;
            try {
                const raw = await getData(`invoices:${roomId}`);
                if (raw) {
                    const list = JSON.parse(raw);
                    if (Array.isArray(list) && list.length > 0) {
                        // if invoiceId param present, try to load that invoice; otherwise load the last one
                        const targetInvoice = invoiceId
                            ? list.find((inv: any) => String(inv.id) === String(invoiceId))
                            : list[list.length - 1];

                        if (targetInvoice) {
                            const normalized: FixedInvoice = {
                                date: targetInvoice.date ? new Date(targetInvoice.date) : new Date(),
                                expenses: targetInvoice.expenses || [],
                                totalAmount: typeof targetInvoice.totalAmount === 'string' ? Number(targetInvoice.totalAmount) : targetInvoice.totalAmount || 0,
                                eachMemberAmount: targetInvoice.eachMemberAmount || 0,
                            };
                            setFixedCosts(normalized);
                            setIsAssigned(true);

                            const derivedMonthly: MonthlyExpense[] = (targetInvoice.expenses || []).map((e: any) => ({
                                name: e.name || "",
                                date: targetInvoice.date ? new Date(targetInvoice.date) : new Date(),
                                amount: (Number(e.price || 0) || 0) * (Number(e.quantity || 1) || 1),
                                sharing: [],
                                payer: { id: -1, name: "", phoneNumber: "", role: 0 } as any,
                                is_confirmed: false,
                            }));
                            setMonthlyCosts(derivedMonthly);
                        } else {
                            // requested invoiceId not found — fallback to empty
                            setFixedCosts({ date: new Date(), expenses: [], totalAmount: 0, eachMemberAmount: 0 });
                            setMonthlyCosts([]);
                            setIsAssigned(false);
                        }
                    } else {
                        // no invoices assigned
                        setFixedCosts({ date: new Date(), expenses: [], totalAmount: 0, eachMemberAmount: 0 });
                        setMonthlyCosts([]);
                        setIsAssigned(false);
                    }
                } else {
                    // no persisted invoices at all
                    setFixedCosts({ date: new Date(), expenses: [], totalAmount: 0, eachMemberAmount: 0 });
                    setMonthlyCosts([]);
                    setIsAssigned(false);
                }

                const mraw = await getData(`members:${roomId}`);
                const mparsed = mraw ? JSON.parse(mraw) : [];
                setMembers(mparsed.map((m: any) => m.name || m.phoneNumber || 'Member'));
            } catch (e) {
                console.error('Error loading invoice for room', roomId, e);
            }
        };

        loadInvoiceForRoom();
        // if route param openCreate is passed, open the create drawer
        if (openCreate === 'true') {
            setShowCreateInvoiceDrawer(true);
        }
    }, [roomId]);

    const onAddNewMonthlyExpense = () => {
        console.log("Add new monthly expense");
        setShowCreateInvoiceDrawer(true);
    };
    const onDeleteMonthlyExpense = (index: number) => {
        (async () => {
            try {
                console.log(`Delete monthly expense ${index}`);

                // Update local UI list first
                setMonthlyCosts((prev) => prev.filter((_, i) => i !== index));

                // If there's a persisted invoice assigned, remove the corresponding expense
                if (isAssigned && roomId) {
                    const key = `invoices:${roomId}`;
                    const raw = await getData(key);
                    const list = raw ? JSON.parse(raw) : [];
                    if (Array.isArray(list) && list.length > 0) {
                        const last = list[list.length - 1];
                        if (Array.isArray(last.expenses) && index >= 0 && index < last.expenses.length) {
                            // remove the expense at the same index
                            last.expenses.splice(index, 1);

                            // recompute total using BigInt
                            const totalBig: bigint = (last.expenses || []).reduce((s: bigint, e: any) => {
                                try {
                                    return s + BigInt(String(e.price || '0')) * BigInt(Number(e.quantity || 1));
                                } catch (err) {
                                    return s;
                                }
                            }, 0n);

                            last.totalAmount = String(totalBig);

                            // persist updated list
                            await storeData(key, JSON.stringify(list));

                            // update fixedCosts UI from last
                            setFixedCosts({
                                date: last.date ? new Date(last.date) : new Date(),
                                expenses: (last.expenses || []).map((e: any) => ({ ...e, price: typeof e.price === 'string' ? BigInt(e.price) : BigInt(Number(e.price || 0)) })),
                                totalAmount: Number(last.totalAmount) || 0,
                                eachMemberAmount: Number(last.eachMemberAmount || 0),
                            });

                            // if no expenses left, mark as unassigned
                            if (!last.expenses || last.expenses.length === 0) {
                                setIsAssigned(false);
                            }
                        } else {
                            console.warn('Tried to delete monthly expense but persisted invoice did not have a matching expense at index', index);
                        }
                    }
                }
            } catch (e) {
                console.error('Error deleting monthly expense', e);
            }
        })();
    };

    

    

    const handleCancelCreateInvoice = () => {
        setNewExpenseName("");
        setNewExpenseAmount(0);
        setSelectedDate(null);
        setSharing([false, false, false, false]);
        setShowCreateInvoiceDrawer(false);
    };

    const handleCreateNewExpense = () => {
        (async () => {
            try {
                console.log("Create new expense");
                const expenseDate = selectedDate ? selectedDate : new Date();
                const newMonthly: MonthlyExpense = {
                    name: newExpenseName || "Untitled",
                    date: expenseDate,
                    amount: Number(newExpenseAmount || 0),
                    sharing: (members || []).map((m) => ({ member: { id: -1, name: m, phoneNumber: '', role: ROLE.ROOM_MEMBER }, is_confirmed: false })),
                    payer: { id: -1, name: members[0] || '', phoneNumber: '', role: ROLE.ROOM_MEMBER } as any,
                    is_confirmed: false,
                };

                // update local UI list
                setMonthlyCosts((prev) => [...prev, newMonthly]);

                // Persist as a fixed invoice if none assigned yet
                if (!isAssigned && roomId) {
                    const key = `invoices:${roomId}`;
                    const priceStr = String(newExpenseAmount || 0);
                    const invoice = {
                        id: Date.now(),
                        roomId: typeof roomId === 'string' ? Number(roomId) : roomId,
                        date: expenseDate.toISOString(),
                        expenses: [{ id: Date.now(), name: newExpenseName || 'Untitled', price: priceStr, quantity: 1 }],
                        totalAmount: priceStr,
                        eachMemberAmount: Number(Math.floor((Number(newExpenseAmount || 0) || 0) / (members.length || 1))),
                    };
                    await storeData(key, JSON.stringify([invoice]));
                    // update fixedCosts UI (convert persisted string prices to bigint for state)
                    setFixedCosts({
                        date: expenseDate,
                        expenses: (invoice.expenses || []).map((e: any) => ({ ...e, price: typeof e.price === 'string' ? BigInt(e.price) : BigInt(Number(e.price || 0)) })),
                        totalAmount: Number(invoice.totalAmount),
                        eachMemberAmount: invoice.eachMemberAmount,
                    });
                    setIsAssigned(true);
                } else if (isAssigned && roomId) {
                    // append to existing persisted invoice (last one)
                    try {
                        const key = `invoices:${roomId}`;
                        const raw = await getData(key);
                        const list = raw ? JSON.parse(raw) : [];
                        if (Array.isArray(list) && list.length > 0) {
                            const last = list[list.length - 1];
                            const expenseObj = { id: Date.now(), name: newExpenseName || 'Untitled', price: String(newExpenseAmount || 0), quantity: 1 };
                            last.expenses = last.expenses || [];
                            last.expenses.push(expenseObj);
                            // recompute total using BigInt to avoid overflow
                            const total = last.expenses.reduce((s: bigint, e: any) => s + BigInt(String(e.price || '0')) * BigInt(Number(e.quantity || 1)), 0n);
                            last.totalAmount = String(total);
                            // persist back
                            await storeData(key, JSON.stringify(list));
                            // update fixedCosts UI from last (convert price strings to bigint)
                            setFixedCosts({
                                date: last.date ? new Date(last.date) : new Date(),
                                expenses: (last.expenses || []).map((e: any) => ({ ...e, price: typeof e.price === 'string' ? BigInt(e.price) : BigInt(Number(e.price || 0)) })),
                                totalAmount: Number(last.totalAmount),
                                eachMemberAmount: Number(last.eachMemberAmount || 0),
                            });
                        }
                    } catch (e) {
                        console.error('Error appending expense to persisted invoice', e);
                    }
                }
            } catch (e) {
                console.error('Error creating monthly expense', e);
            } finally {
                setNewExpenseName("");
                setNewExpenseAmount(0);
                setSelectedDate(null);
                setSharing([false, false, false, false]);
                setShowCreateInvoiceDrawer(false);
            }
        })();
    };

    const handleChangeSelectedDate = (date: Date | null) => {
        setSelectedDate(date);
    };

    const handleChangeNewExpenseName = (value: string) => {
        setNewExpenseName(value);
    };

    const handleChangeNewExpenseAmount = (value: number) => {
        setNewExpenseAmount(value);
    };

    const handleChangeSharing = (index: number) => {
        setSharing((prev) =>
            prev.map((value, i) => (i === index ? !value : value))
        );
    };

    return (
        <View>
            <FixedCosts
                fixedCosts={fixedCosts}
                memberCount={members.length || 1}
                memberNames={members}
                isAssigned={isAssigned}
            />
            <MonthlyCosts
                monthlyExpenses={monthlyCosts}
                onAddNewMonthlyExpense={onAddNewMonthlyExpense}
                onDeleteMonthlyExpense={onDeleteMonthlyExpense}
            />
            <DrawerCreateMonthlyInvoice
                isOpen={showCreateInvoiceDrawer}
                onCancel={handleCancelCreateInvoice}
                onCreate={handleCreateNewExpense}
                selectedDate={selectedDate}
                onDateChange={handleChangeSelectedDate}
                expenseName={newExpenseName}
                onChangeName={handleChangeNewExpenseName}
                expenseAmount={newExpenseAmount}
                onChangeAmount={handleChangeNewExpenseAmount}
                sharing={sharing}
                members={members}
                onChangeSharing={handleChangeSharing}
            />
        </View>
    );
}
