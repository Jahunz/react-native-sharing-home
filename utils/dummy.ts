import { ROLE } from "@/app/constants/enum";
import {
    FixedInvoice,
    FullPersonalInvoiceHistory,
    FullSummaryInvoiceHistory,
    HMRoom,
    Member,
    MonthlyExpense,
    Notification,
    RMRoom,
} from "@/app/constants/types";
import { MemberFactory } from "./factory";

export const dummy_home_master_room_list: HMRoom[] = [
    {
        id: 1,
        name: "Room 1",
        memberCount: 2,
        debtAmount: 150.5,
        nextInvoiceDate: "2024-02-15",
    },
];

export const dummy_room_member_room_list: RMRoom[] = [
    {
        id: 1,
        name: "Room 1",
        homeName: "Home A",
        memberCount: 4,
        nextInvoiceDate: "2024-02-15",
    },
    {
        id: 2,
        name: "Room 2",
        homeName: "Home B",
        memberCount: 3,
        nextInvoiceDate: "2024-02-20",
    },
    {
        id: 3,
        name: "Room 3",
        homeName: "Home C",
        memberCount: 5,
        nextInvoiceDate: "2024-02-18",
    },
];

export const dummy_member_list: Member[] = [
    {
        id: 1,
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
        name: "John Doe",
        phoneNumber: "01234567891",
        role: ROLE.ROOM_MASTER,
    },
    {
        id: 2,
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
        name: "Jane Doe",
        phoneNumber: "01234567892",
        role: ROLE.ROOM_MASTER,
    },
    {
        id: 3,
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
        name: "Jim Beam",
        phoneNumber: "01234567893",
        role: ROLE.ROOM_MEMBER,
    },
];

export const dummy_monthly_costs: MonthlyExpense[] = [
    {
        name: "Washing Powder",
        date: new Date(),
        amount: 260000,
        sharing: [
            {
                member: MemberFactory(1, "Member 4"),
                is_confirmed: true,
            },
            {
                member: MemberFactory(2, "Member 3"),
                is_confirmed: true,
            },
            {
                member: MemberFactory(3, "Member 1", "room_master" as ROLE),
                is_confirmed: false,
            },
        ],
        payer: MemberFactory(3, "Member 1", "room_master" as ROLE),
        is_confirmed: false,
    },
    {
        name: "Market",
        date: new Date(),
        amount: 120000,
        sharing: [
            {
                member: MemberFactory(3, "Member 1", "room_master" as ROLE),
                is_confirmed: true,
            },
            {
                member: MemberFactory(3, "Member 3"),
                is_confirmed: true,
            },
        ],
        payer: MemberFactory(3, "Member 2"),
        is_confirmed: true,
    },
];

export const dummy_fixed_costs: FixedInvoice = {
    date: new Date(),
    totalAmount: 4550000,
    eachMemberAmount: 1137500,
    expenses: [
        {
            name: "Rent",
            price: 4550000n,
            quantity: 1,
        },
        {
            name: "Electricity",
            price: 4000n,
            quantity: 120,
        },
        {
            name: "Wifi",
            price: 150000n,
            quantity: 1,
        },
        {
            name: "Water",
            price: 3000n,
            quantity: 120,
        },
        {
            name: "Rubbish",
            price: 3000n,
            quantity: 120,
        },
    ],
};
// interface ABC extends ShortSummaryInvoiceHistory{
//    is_show_expense: boolean
// }
//  ABC[]
export const dummy_room_master_invoice_history_list = [
    {
        id: 1,
        total_spent: 5_440_000,
        month: "October 2025",
        is_show_expense: false,
    },
    {
        id: 2,
        total_spent: 744000,
        month: "September 2025",
        is_show_expense: false,
    },
    {
        id: 3,
        total_spent: 5_440_000,
        month: "August 2025",
        is_show_expense: false,
    },
];
export const dummy_room_master_invoice_history_detail: FullSummaryInvoiceHistory =
    {
        invoice: {
            fixed_costs: 4550000,
            monthly_costs: 550000,
            members_share: [
                {
                    member: MemberFactory(1, "Member 1", "room_master" as ROLE),
                    spent: 560000,
                    budgeted_costs: 1137500,
                    actual_costs: 577500,
                },
                {
                    member: MemberFactory(2, "Member 2"),
                    spent: 560000,
                    budgeted_costs: 1137500,
                    actual_costs: 577500,
                },
                {
                    member: MemberFactory(3, "Member 3"),
                    spent: 560000,
                    budgeted_costs: 1137500,
                    actual_costs: 577500,
                },
                {
                    member: MemberFactory(4, "Member 4"),
                    spent: 560000,
                    budgeted_costs: 1137500,
                    actual_costs: 577500,
                },
            ],
        },
        id: 2,
        month: "October 2025",
        total_spent: 744000,
        status: "paid",
    };

// interface ABC extends ShortPersonalInvoiceHistory{
//    is_show_expense: boolean
// }
//  ABC[]

export const dummy_room_member_invoice_history_list = [
    {
        id: 1,
        actual_cost: 544000,
        month: "October 2025",
        is_show_expense: false,
    },
    {
        id: 2,
        actual_cost: 744000,
        month: "September 2025",
        is_show_expense: false,
    },
    {
        id: 3,
        actual_cost: 934000,
        month: "August 2025",
        is_show_expense: false,
    },
];

export const dummy_room_member_invoice_history_detail: FullPersonalInvoiceHistory =
    {
        id: 1,
        month: "October 2025",
        actual_cost: 577500,

        invoice: {
            fixed_costs: 4550000,
            monthly_costs: 550000,
            my_share: {
                member: MemberFactory(1, "Member 1", "room_master" as ROLE),
                spent: 560000,
                budgeted_costs: 1137500,
                actual_costs: 577500,
            },
        },
    };

export const dummy_notifications: Notification[] = [
    {
        id: 1,
        title: "Notification 1",
        description:
            "Lorem ipsum sit dolor amet, consectetur adipiscing elit. Sed do eiusmod tempor...",
    },
    {
        id: 2,
        title: "Notification 2",
        description:
            "Lorem ipsum sit dolor amet, consectetur adipiscing elit. Sed do eiusmod tempor...",
    },
    {
        id: 3,
        title: "Notification 3",
        description:
            "Lorem ipsum sit dolor amet, consectetur adipiscing elit. Sed do eiusmod tempor...",
    },
    {
        id: 4,
        title: "Notification 4",
        description:
            "Lorem ipsum sit dolor amet, consectetur adipiscing elit. Sed do eiusmod tempor...",
    },
    {
        id: 5,
        title: "Notification 5",
        description:
            "Lorem ipsum sit dolor amet, consectetur adipiscing elit. Sed do eiusmod tempor...",
    },
    {
        id: 6,
        title: "Notification 6",
        description:
            "Lorem ipsum sit dolor amet, consectetur adipiscing elit. Sed do eiusmod tempor...",
    },
    {
        id: 7,
        title: "Notification 7",
        description:
            "Lorem ipsum sit dolor amet, consectetur adipiscing elit. Sed do eiusmod tempor...",
    },
    {
        id: 8,
        title: "Notification 8",
        description:
            "Lorem ipsum sit dolor amet, consectetur adipiscing elit. Sed do eiusmod tempor...",
    },
];
