import { Grid, GridItem } from "@/components/ui/grid";
import { Text } from "@/components/ui/text";
import { Expense } from "../../constants/types";
import HeaderTableFixedInvoice from "./headerTableFixedInvoice";

const formatAmount = (v: number | bigint) => {
    const s = String(v || '0');
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

interface TableFixedInvoiceHistoryProps {
    expenses: Expense[];
}

export default function TableFixedInvoiceHistory({
    expenses,
}: TableFixedInvoiceHistoryProps) {
    if (expenses.length === 0) {
        return null;
    }
    return (
        <>
            <HeaderTableFixedInvoice />
            {expenses.map((expense, idx) => (
                <Grid
                    key={String((expense as any).id ?? expense.name ?? idx)}
                    className="gap-2 py-2 border-b border-gray-200 bg-white"
                    _extra={{ className: "grid-cols-12" }}
                >
                    <GridItem
                        className="justify-center"
                        _extra={{ className: "col-span-3" }}
                    >
                        <Text size="md" className="font-medium">
                            {expense.name}
                        </Text>
                    </GridItem>
                    <GridItem
                        className="justify-center"
                        _extra={{ className: "col-span-4" }}
                    >
                        <Text size="md" className="font-normal text-right">
                            {formatAmount((expense.price as any) ?? 0n)}
                        </Text>
                    </GridItem>
                    <GridItem
                        className="justify-center"
                        _extra={{ className: "col-span-1" }}
                    >
                        <Text size="sm" className="font-normal text-center">
                            {expense.quantity}
                        </Text>
                    </GridItem>
                    <GridItem
                        className="justify-center"
                        _extra={{ className: "col-span-4" }}
                    >
                        <Text size="md" className="font-medium text-right">
                            {formatAmount((BigInt((expense as any).price || 0n) * BigInt(expense.quantity || 1)))}
                        </Text>
                    </GridItem>
                </Grid>
            ))}
        </>
    );
}
