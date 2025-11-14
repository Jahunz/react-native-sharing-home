import {
    Drawer,
    DrawerBackdrop,
    DrawerBody,
    DrawerContent,
    DrawerHeader,
} from "@/components/ui/drawer";
import { Grid, GridItem } from "@/components/ui/grid";
import { Icon, TrashIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import React, { useState } from "react";
import { Pressable, ScrollView, View, KeyboardAvoidingView, Platform } from "react-native";
import { Expense } from "../../constants/types";
import StyledButton from "../commons/StyledButton";
// Date picker removed: we only use month selector now.
import StyledInput from "../commons/StyledInput";
import HeaderTableFixedInvoiceWithoutTotal from "./headerTableFixedInvoiceWithoutTotal";

interface DrawerCreateFixedInvoiceProps {
    isOpen: boolean;
    onCancel: () => void;
    onCreate: () => void;
    selectedDate: Date | null;
    onDateChange: (date: Date | null) => void;
    defaultExpenses: Expense[];
    onChangeDefaultExpenses: (name: string, key: string, value: number | string) => void;
    expenses: Expense[];
    onChangeExpenses?: (
        index: number,
        key: string,
        value: number | string
    ) => void;
    onAddExpense: () => void;
    onRemoveExpense: (index: number) => void;
}

export default function DrawerCreateFixedInvoice({
    isOpen,
    onCancel,
    onCreate,
    selectedDate,
    onDateChange,
    defaultExpenses,
    onChangeDefaultExpenses,
    expenses,
    onChangeExpenses,
    onAddExpense,
    onRemoveExpense,
}: DrawerCreateFixedInvoiceProps) {
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const currentMonthDate = selectedDate || new Date();

    const [editingKey, setEditingKey] = useState<string | null>(null);

    const formatAmount = (v: number | bigint) => {
        const s = String(v || '0');
        return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const changeMonth = (offset: number) => {
        const d = new Date(currentMonthDate);
        d.setMonth(d.getMonth() + offset);
        // normalize to first day of month
        d.setDate(1);
        onDateChange(d);
    };
    // footer height used to reserve scroll space so last inputs are reachable
    const FOOTER_HEIGHT = 72;
    return (
        <Drawer
            className="mb-20"
            isOpen={isOpen}
            size="lg"
            anchor="bottom"
            closeOnOverlayClick={false}
        >
            <DrawerBackdrop />
            <DrawerContent>
                <DrawerHeader>
                    <StyledButton
                        variant="outline"
                        onPress={onCancel}
                        buttonText="Cancel"
                    />

                    <StyledButton onPress={onCreate} buttonText="Create" />
                </DrawerHeader>
                <DrawerBody>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        // offset should account for the header height; keep conservative value
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
                        style={{ flex: 1 }}
                    >
                        <View style={{ flex: 1, position: 'relative' }}>
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={{ paddingBottom: FOOTER_HEIGHT + 24, paddingTop: 8, flexGrow: 1 }}
                            style={{ flex: 1 }}
                        >
                        <View>
                            {/* Month selector: user can pick invoice month (month/year) */}
                            <Text size="sm" className="text-gray-600 my-2">Invoice month</Text>
                            <View className="flex-row items-center justify-between mb-4">
                                <Pressable onPress={() => changeMonth(-1)} className="p-2">
                                    <Text size="lg" weight="bold">←</Text>
                                </Pressable>
                                <Text size="md" weight="semibold">
                                    {monthNames[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
                                </Text>
                                <Pressable onPress={() => changeMonth(1)} className="p-2">
                                    <Text size="lg" weight="bold">→</Text>
                                </Pressable>
                            </View>

                            {/* Date picker removed — month selector above is used instead */}
                        </View>
                        <View>
                            <HeaderTableFixedInvoiceWithoutTotal />
                            {defaultExpenses.map((expense) => {
                                const key = `default-${expense.name}`;
                                if (editingKey && editingKey !== key) return null;
                                return (
                                <Grid
                                    key={key}
                                    className="gap-2 p-2 mx-1 border-b border-gray-200 bg-gray-100"
                                    _extra={{ className: "grid-cols-12" }}
                                >
                                    <GridItem
                                        className="justify-center"
                                        _extra={{ className: "col-span-5" }}
                                    >
                                        <Text
                                            size="md"
                                            className="font-medium mb-4"
                                        >
                                            {expense.name}
                                        </Text>
                                    </GridItem>
                                    <GridItem
                                        className="justify-center"
                                        _extra={{ className: "col-span-4" }}
                                    >
                                        <StyledInput
                                            value={formatAmount(expense.price as any)}
                                            onFocus={() => setEditingKey(key)}
                                            onBlur={() => setEditingKey(null)}
                                            onChangeText={(text) =>
                                                onChangeDefaultExpenses(
                                                    expense.name,
                                                    "price",
                                                    text
                                                )
                                            }
                                        />
                                    </GridItem>
                                    <GridItem
                                        className="justify-center"
                                        _extra={{ className: "col-span-2" }}
                                    >
                                        <StyledInput
                                            value={String(expense.quantity)}
                                            onFocus={() => setEditingKey(key)}
                                            onBlur={() => setEditingKey(null)}
                                            onChangeText={(text) =>
                                                onChangeDefaultExpenses(
                                                    expense.name,
                                                    "quantity",
                                                    Number(text)
                                                )
                                            }
                                        />
                                    </GridItem>
                                    <GridItem
                                        className="justify-center"
                                        _extra={{ className: "col-span-1" }}
                                    >
                                        {/* Placeholder for alignment */}
                                    </GridItem>
                                </Grid>
                                )
                            })}
                            {expenses.map((expense, index) => {
                                const key = `expense-${expense.id ?? index}`;
                                if (editingKey && editingKey !== key) return null;
                                return (
                                <Grid
                                    key={expense.id ?? `expense-${index}`}
                                    className="gap-2 p-2 mx-1 border-b border-gray-200"
                                    _extra={{ className: "grid-cols-12" }}
                                >
                                    <GridItem
                                        className="justify-center"
                                        _extra={{ className: "col-span-5" }}
                                    >
                                        <StyledInput
                                            placeholder="Expense name"
                                            value={expense.name}
                                            onFocus={() => setEditingKey(key)}
                                            onBlur={() => setEditingKey(null)}
                                            onChangeText={(text) =>
                                                onChangeExpenses &&
                                                onChangeExpenses(
                                                    index,
                                                    "name",
                                                    text
                                                )
                                            }
                                        />
                                    </GridItem>
                                    <GridItem
                                        className="justify-center"
                                        _extra={{ className: "col-span-4" }}
                                    >
                                        <StyledInput
                                            placeholder="Price"
                                            value={formatAmount(expense.price as any)}
                                            onFocus={() => setEditingKey(key)}
                                            onBlur={() => setEditingKey(null)}
                                            onChangeText={(text) =>
                                                onChangeExpenses &&
                                                onChangeExpenses(
                                                    index,
                                                    "price",
                                                    text
                                                )
                                            }
                                        />
                                    </GridItem>
                                    <GridItem
                                        className="justify-center"
                                        _extra={{ className: "col-span-2" }}
                                    >
                                        <StyledInput
                                            placeholder="Quantity"
                                            value={String(expense.quantity)}
                                            onFocus={() => setEditingKey(key)}
                                            onBlur={() => setEditingKey(null)}
                                            onChangeText={(text) =>
                                                onChangeExpenses &&
                                                onChangeExpenses(
                                                    index,
                                                    "quantity",
                                                    Number(text)
                                                )
                                            }
                                        />
                                    </GridItem>
                                    <GridItem
                                        className="justify-center"
                                        _extra={{ className: "col-span-1" }}
                                    >
                                        <Pressable
                                            onPress={() =>
                                                onRemoveExpense(index)
                                            }
                                        >
                                            <Icon
                                                as={TrashIcon}
                                                className="text-red-500"
                                            />
                                        </Pressable>
                                    </GridItem>
                                </Grid>
                                )
                            })}
                        </View>
                        </ScrollView>

                        {/* Fixed footer outside the ScrollView so it doesn't get scrolled/covered */}
                        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: FOOTER_HEIGHT, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', justifyContent: 'center' }}>
                            <StyledButton
                                buttonClassName="my-0"
                                onPress={onAddExpense}
                                buttonText="Add Expense"
                            />
                        </View>
                        </View>
                    </KeyboardAvoidingView>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );

}
