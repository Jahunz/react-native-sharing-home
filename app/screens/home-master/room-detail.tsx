import { DrawerLayout } from "@/components/DrawerLayout";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Pressable, View, ActivityIndicator, Alert } from "react-native";
import { getData } from "@/app/storage/async_storage";
import InvoiceHistoryCard from "@/app/components/invoices/invoiceHistoryCard";
import StyledInput from "../../components/commons/StyledInput";
import StyledModal from "../../components/commons/StyledModal";
import StyledButton from "../../components/commons/StyledButton";
import GroupButtonRoomActive from "../../components/groupButtonRoomActive";
import GroupButtonRoomEmpty from "../../components/groupButtonRoomEmpty";
import DrawerCreateFixedInvoice from "../../components/invoices/drawerCreateFixedInvoice";
import MemberCard from "../../components/memberCard";
import { Icon, AddIcon, SearchIcon, CloseIcon, ArrowLeftIcon } from "@/components/ui/icon";
import Routes from "../../constants/Routes";
import useHMRoomDetail from "../../hooks/hm-room-detail";
import { Avatar, AvatarImage, AvatarFallbackText } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { ROLE } from "../../constants/enum";

export default function RoomDetailScreen() {
    const router = useRouter();
    const { roomId, roomName, openAddMaster } = useLocalSearchParams<{
        roomId: string;
        roomName?: string;
        openAddMaster?: string;
    }>();

    const {
        showModal,
        newPhoneNumber,
        newName,
        showCreateInvoiceDrawer,
        selectedDate,
        defaultExpenses,
        expenses,
        members,
        isEmpty,

        handleCancelAddNewRoomMaster,
        handleAddNewRoomMaster,
        handleChangePhoneNumber,
        handleChangeName,
    handleSearchUserByPhone,
    foundUser,
    foundUserLoading,
    foundUserNotFound,
    handleSelectFoundUser,
        handleCreateInvoice,
        handleAddMember,
    handleAddRoomMaster,
        handleDeleteRoom,
        handleDeleteInvoice,
        handleEditInvoice,
        handleCancelCreateInvoice,
        handleCreateNewInvoice,
        handleChangeSelectedDate,
        handleChangeDefaultExpenses,
        handleAddExpense,
        handleRemoveExpense,
        handleChangeExpense,
        handleEditMember,
        handleDeleteMember,
        handleAssignMemberAsRoomMaster,
    addingRole,
    } = useHMRoomDetail(roomId);
    

    const [showAddChoiceModal, setShowAddChoiceModal] = useState(false);
    // false = show only top 5 invoices, true = show full history
    const [showAllInvoices, setShowAllInvoices] = useState(false);

    useEffect(() => {
        if (openAddMaster === "true") {
            handleAddRoomMaster();
        }
    }, [openAddMaster]);

    const handleViewInvoiceHistory = () => {
        // Toggle showing full invoice history (otherwise we display top 5)
        setShowAllInvoices((s) => !s);
    };

    const [invoiceHistory, setInvoiceHistory] = useState<
        {
            id: number;
            amount: number;
            date: string;
            status: string;
            is_show_expense: boolean;
        }[]
    >([]);

    useEffect(() => {
        let mounted = true;
        const loadInvoices = async () => {
            if (!roomId) return;
            try {
                const raw = await getData(`invoices:${roomId}`);
                if (!mounted) return;
                if (raw) {
                    const parsed = JSON.parse(raw) as any[];
                    const mapped = parsed
                        .map((inv) => ({
                            id: inv.id,
                            amount: inv.totalAmount ? Number(inv.totalAmount) : 0,
                            // keep original ISO string for full timestamp formatting
                            date: typeof inv.date === "string" ? inv.date : new Date(inv.date).toISOString(),
                            status: inv.status || "pending",
                            is_show_expense: false,
                            // include expenses so the invoice card can show details
                            expenses: inv.expenses ?? [],
                            // preserve persisted totalAmount (string)
                            totalAmount: inv.totalAmount,
                        }))
                        .sort((a, b) => b.id - a.id); // newest first
                    setInvoiceHistory(mapped);
                } else {
                    setInvoiceHistory([]);
                }
            } catch (e) {
                console.error("Error loading invoices for room", roomId, e);
            }
        };
        loadInvoices();
        return () => {
            mounted = false;
        };
    }, [roomId, showCreateInvoiceDrawer]);

    const handleShowExpense = (invoiceId: number) => {
        setInvoiceHistory(
            invoiceHistory.map((invoice) =>
                invoice.id === invoiceId
                    ? { ...invoice, is_show_expense: !invoice.is_show_expense }
                    : { ...invoice, is_show_expense: false }
            )
        );
    };

    const handleDeleteInvoiceLocal = async (invoiceId: number) => {
        Alert.alert(
            "Delete invoice",
            "Are you sure you want to delete this invoice? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await handleDeleteInvoice(invoiceId);
                            // remove from local state immediately for optimistic UI
                            setInvoiceHistory((prev) => prev.filter((inv) => inv.id !== invoiceId));
                        } catch (e) {
                            console.error('Error deleting invoice local', e);
                        }
                    },
                },
            ]
        );
    };

    const handleShowQR = () => {
        router.push({
            pathname: Routes.ROOM_QR as any,
            params: {
                roomId: roomId,
                roomName: roomName,
            },
        });
    };

    return (
        <>
            <DrawerLayout
                title={roomName || "Room detail"}
                showNotificationIcon={true}
            >
                <ScrollView className="flex-1 bg-gray-50 px-4 pt-6">
                    {/* Room List */}
                    {members.map((member) => (
                        <MemberCard
                            key={member.id}
                            avatar={member.avatar}
                            memberName={member.name}
                            phoneNumber={member.phoneNumber}
                            role={member.role}
                            canEdit={true}
                            onEdit={() => handleEditMember(member.id)}
                            canDelete={true}
                            onDelete={() => handleDeleteMember(member.id)}
                            // allow home-master to assign a member as room master
                            canAssign={member.role !== ROLE.ROOM_MASTER}
                            onAssign={() => handleAssignMemberAsRoomMaster(member.id)}
                        />
                    ))}

                    {/* Section divider between members and invoices */}
                    <View className="border-t border-gray-200 my-6" />
                    <Text className="text-lg font-bold mb-6">Room's Invoice</Text>

                    {/* Inline invoice history: show top 5 by default, toggle to show all */}
                    {invoiceHistory.length === 0 ? (
                        <View className="w-full items-center justify-center mt-8">
                            <Text className="text-center text-sm text-muted-foreground">No invoices yet for this room.</Text>
                        </View>
                    ) : (
                        (showAllInvoices ? invoiceHistory : invoiceHistory.slice(0, 5)).map((invoice) => (
                            <InvoiceHistoryCard
                                key={invoice.id}
                                invoice={invoice}
                                onShowExpense={handleShowExpense}
                                onEditInvoice={handleEditInvoice}
                                onDeleteInvoice={handleDeleteInvoiceLocal}
                            />
                        ))
                    )}

                    {isEmpty ? (
                        <GroupButtonRoomEmpty
                            onDeleteRoomPress={() => handleDeleteRoom(roomId)}
                            onShowQRPress={handleShowQR}
                        />
                    ) : (
                        <GroupButtonRoomActive
                            onViewInvoiceHistoryPress={handleViewInvoiceHistory}
                            onCreateInvoicePress={handleCreateInvoice}
                            onDeleteRoomPress={() => handleDeleteRoom(roomId)}
                            onShowQRPress={handleShowQR}
                        />
                    )}
                </ScrollView>
            </DrawerLayout>
            {/* Floating Add button -> opens modal to choose Add Member or Add Room Master */}
            <View className="absolute bottom-6 right-6 z-50">
                <Pressable
                    onPress={() => setShowAddChoiceModal((s) => !s)}
                    className="bg-white w-16 h-16 rounded-full items-center justify-center shadow-xl border-4 border-blue-600"
                    accessibilityRole="button"
                    accessibilityLabel="Add"
                >
                    <Icon as={showAddChoiceModal ? CloseIcon : AddIcon} size="xl" className="text-blue-600" />
                </Pressable>
            </View>

            {/* Floating choice popup anchored to FAB (transparent overlay, no close button) */}
            {showAddChoiceModal ? (
                <View className="absolute inset-0 z-40">
                    {/* anchor panel positioned above the FAB */}
                    <View className="absolute right-6 bottom-24 z-50 space-y-6 items-end">
                        {/* Add / member/master choices */}
                        {!members.some((m) => m.role === ROLE.ROOM_MASTER) && (
                            <StyledButton
                                onPress={() => {
                                    setShowAddChoiceModal(false);
                                    handleAddRoomMaster();
                                }}
                                buttonClassName="rounded-full border border-blue-600 px-4 py-1 bg-white w-52 shadow-md mb-6"
                                buttonText="Add room master"
                                variant="outline"
                                size="md"
                            />
                        )}
                        <StyledButton
                            onPress={() => {
                                setShowAddChoiceModal(false);
                                handleAddMember();
                            }}
                            buttonClassName="rounded-full border border-blue-600 px-4 py-1 bg-white w-52 shadow-md mb-6"
                            buttonText="Add member"
                            variant="outline"
                            size="md"
                        />

                        {/* Room actions: moved into FAB popup */}
                        <StyledButton
                            onPress={() => {
                                setShowAddChoiceModal(false);
                                handleCreateInvoice();
                            }}
                            buttonClassName="rounded-full border border-blue-600 px-4 py-1 bg-white w-52 shadow-md mb-6"
                            buttonText="Create invoice"
                            variant="outline"
                            size="md"
                        />

                        <StyledButton
                            onPress={() => {
                                setShowAddChoiceModal(false);
                                handleShowQR();
                            }}
                            buttonClassName="rounded-full border border-blue-600 px-4 py-1 bg-white w-52 shadow-md mb-6"
                            buttonText="Show room QR"
                            variant="outline"
                            size="md"
                        />

                        <StyledButton
                            onPress={() => {
                                setShowAddChoiceModal(false);
                                handleDeleteRoom(roomId);
                            }}
                            buttonClassName="rounded-full px-4 py-1 bg-red-500 w-52 shadow-md mb-6"
                            buttonText="Delete room"
                            variant="solid"
                            size="md"
                            textClassName="text-white"
                        />
                    </View>
                </View>
            ) : null}
            <StyledModal
                title={
                    addingRole === ROLE.ROOM_MEMBER
                        ? "Add member"
                        : "Add room master"
                }
                submitButtonText="Add"
                cancelButtonText="Cancel"
                isOpen={showModal}
                closeOnOverlayClick={false}
                size="md"
                handelSubmit={handleAddNewRoomMaster}
                handelCancel={handleCancelAddNewRoomMaster}
                children={
                    <>
                        <StyledInput
                            label="Name"
                            placeholder="Enter name"
                            value={newName}
                            onChangeText={handleChangeName}
                        />
                        <StyledInput
                            label="Phone number"
                            placeholder="Enter phone number"
                            value={newPhoneNumber}
                            onChangeText={handleChangePhoneNumber}
                            endIcon={foundUserLoading ? <ActivityIndicator size={18} color="#2563EB" /> : <Icon as={SearchIcon} size="md" className="text-typography-500 mr-3" />}
                            onEndIconPress={async () => {
                                console.log('UI: Find user pressed', newPhoneNumber);
                                await handleSearchUserByPhone(newPhoneNumber);
                            }}
                        />

                        {foundUser ? (
                            <View className="mt-4 bg-white p-3 rounded-lg flex-row items-center">
                                <View className="w-16 h-16 mr-3">
                                    <Avatar size="md">
                                        <AvatarFallbackText>{foundUser.name ? foundUser.name[0].toUpperCase() : '👤'}</AvatarFallbackText>
                                        <AvatarImage source={{ uri: foundUser.avatar }} />
                                    </Avatar>
                                </View>
                                <View className="flex-1">
                                    <Text size="md" className="font-bold">{foundUser.name}</Text>
                                    <Text size="sm">{foundUser.phoneNumber}</Text>
                                </View>
                                <View>
                                    <StyledButton
                                        buttonClassName="px-3 py-2"
                                        onPress={() => {
                                            console.log('UI: Use found user', foundUser);
                                            handleSelectFoundUser();
                                        }}
                                        buttonText="Use"
                                    />
                                </View>
                            </View>
                        ) : foundUserNotFound ? (
                            <View className="mt-3">
                                <Text className="text-sm text-muted-foreground">No user found</Text>
                            </View>
                        ) : null}
                    </>
                }
            />
            <DrawerCreateFixedInvoice
                isOpen={showCreateInvoiceDrawer}
                onCancel={handleCancelCreateInvoice}
                onCreate={handleCreateNewInvoice}
                selectedDate={selectedDate}
                onDateChange={handleChangeSelectedDate}
                defaultExpenses={defaultExpenses}
                onChangeDefaultExpenses={handleChangeDefaultExpenses}
                expenses={expenses}
                onChangeExpenses={handleChangeExpense}
                onAddExpense={handleAddExpense}
                onRemoveExpense={handleRemoveExpense}
            />
        </>
    );
}
