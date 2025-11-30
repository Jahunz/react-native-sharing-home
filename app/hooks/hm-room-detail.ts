import { dummy_member_list } from "@/utils/dummy";
import { useMemo, useState, useEffect } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import Routes from "../constants/Routes";
import { getData, storeData, removeData } from "../storage/async_storage";
import { getUsers, upsertUser, findUserByPhone, saveUsers, normalizePhone } from '../storage/users';
import { ROLE } from "../constants/enum";
import { Expense, Member } from "../constants/types";
import { formatDate } from "@/utils/format_date";

const useHMRoomDetail = (roomId?: string) => {
    const [showModal, setShowModal] = useState(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState<string>("");
    const [newName, setNewName] = useState<string>("");
    const [showCreateInvoiceDrawer, setShowCreateInvoiceDrawer] =
        useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [defaultExpenses, setDefaultExpenses] = useState<Expense[]>([
        { id: Date.now() + 1, name: "Room", price: 5000000n, quantity: 1 },
        { id: Date.now() + 2, name: "Electricity", price: 300000n, quantity: 18 },
        { id: Date.now() + 3, name: "Water", price: 100000n, quantity: 1 },
    ]);
    const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    // Start with no members for a newly created room by default.
    // Previously this used `dummy_member_list` which contained two ROOM_MASTER entries
    // and one ROOM_MEMBER. That caused each room to show default members unintentionally.
    const [members, setMembers] = useState<Member[]>([]);
    const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
    const [addingRole, setAddingRole] = useState<string | null>(null);
    const [foundUser, setFoundUser] = useState<Member | null>(null);
    const [foundUserLoading, setFoundUserLoading] = useState<boolean>(false);
    const [foundUserNotFound, setFoundUserNotFound] = useState<boolean>(false);

    const router = useRouter();

    // Load persisted members for this room (if any)
    useEffect(() => {
        let mounted = true;
        const loadMembers = async () => {
            if (!roomId) return;
            try {
                const raw = await getData(`members:${roomId}`);
                if (!mounted) return;
                if (raw) {
                    const parsed: Member[] = JSON.parse(raw);
                    // Migration: remove any previously used stock-placeholder
                    // avatar URLs so fallback silhouette is used instead. Also
                    // normalize phone numbers to a canonical digits-only form
                    // so that member vs users matching is deterministic.
                    const STOCK_PLACEHOLDER = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80";
                    const normalized = parsed.map((m) => ({
                        ...m,
                        avatar: m.avatar === STOCK_PLACEHOLDER ? undefined : m.avatar,
                        phoneNumber: normalizePhone(m.phoneNumber || (m as any).phone || ''),
                    }));
                    setMembers(normalized);
                    // Persist normalized members back to storage if we changed any
                    if (JSON.stringify(normalized) !== raw) {
                        try {
                            await storeData(`members:${roomId}`, JSON.stringify(normalized));
                        } catch (e) {
                            console.error('Error persisting normalized members', e);
                        }
                    }
                } else {
                    setMembers([]);
                }
            } catch (e) {
                console.error("Error loading members for room", roomId, e);
            }
        };
        loadMembers();
        return () => {
            mounted = false;
        };
    }, [roomId]);

    // const [members, setMembers] = useState<Member[]>([]);

    const handleCancelAddNewRoomMaster = () => {
        setShowModal(false);
        setNewPhoneNumber("");
        setNewName("");
        setEditingMemberId(null);
    };

    const handleAddRoomMaster = () => {
        setAddingRole(ROLE.ROOM_MASTER);
        setShowModal(true);
    };

    const handleAddMember = () => {
        setAddingRole(ROLE.ROOM_MEMBER);
        setShowModal(true);
    };

    const handleChangePhoneNumber = (phoneNumber: string) => {
        setNewPhoneNumber(phoneNumber);
    };

    const handleSearchUserByPhone = async (phoneNumber: string) => {
        setFoundUser(null);
        setFoundUserNotFound(false);
        // quick guard
        if (!phoneNumber) {
            setFoundUserLoading(false);
            return null;
        }
        setFoundUserLoading(true);
        // Normalize phone: strip all non-digit characters for robust matching
        const normalize = (p: string) => (p || "").toString().replace(/\D+/g, '');
        const target = normalize(phoneNumber);
        if (!target) {
            // nothing to search for after normalization
            setFoundUserLoading(false);
            setFoundUserNotFound(true);
            return null;
        }
        try {
            console.log('[hm-room-detail] searching for phone', phoneNumber, '->', target);

            // First check the local `users` directory (accounts created/logged-in on this device)
            try {
                const uMatch = await findUserByPhone(phoneNumber);
                if (uMatch) {
                    // If the matched user corresponds to the current persisted
                    // profile (same phone), prefer the persisted profile name
                    // and profilePhoto for avatar. Otherwise use any fields
                    // present on the users list entry.
                    try {
                        const currentPhone = await getData('userPhone');
                        const normalizedCurrent = normalizePhone(currentPhone || '');
                        const profileKey = normalizedCurrent ? `profile:${normalizedCurrent}` : 'profile';
                        const photoKey = normalizedCurrent ? `profilePhoto:${normalizedCurrent}` : 'profilePhoto';
                        const profileJson = await getData(profileKey);
                        const profile = profileJson ? JSON.parse(profileJson) : null;
                        const profilePhoto = await getData(photoKey);

                        const isCurrent = normalizePhone((uMatch.phoneNumber || uMatch.phone) as string) === normalizedCurrent;
                        const uAny: any = uMatch as any;
                        const resolved: Member = {
                            id: Date.now(),
                            avatar: isCurrent ? (profilePhoto || uAny.avatar) : (uAny.avatar || undefined),
                            name: isCurrent ? ((profile && (profile.name ? profile.name : `${profile.firstName || ''} ${profile.lastName || ''}`.trim())) || uAny.name || uAny.phoneNumber || uAny.phone || 'Member') : (uAny.name || uAny.firstName || uAny.phoneNumber || uAny.phone || 'Member'),
                            phoneNumber: (uAny.phoneNumber || uAny.phone || '') as string,
                            role: (uAny.role as any) || ROLE.ROOM_MEMBER,
                        };
                        console.log('[hm-room-detail] found user in users dir', resolved);
                        setFoundUser(resolved);
                        setFoundUserLoading(false);
                        return resolved;
                    } catch (e) {
                        console.error('[hm-room-detail] error resolving user profile data', e);
                    }
                }
            } catch (e) {
                console.error('[hm-room-detail] error reading local users list', e);
            }

            // Quick fix: only search current room's members (avoid copying avatars from other rooms)
            const match = members.find((m) => {
                const mnum = normalize(m.phoneNumber || '');
                if (!mnum) return false;
                const last7 = (s: string) => s.slice(-7);
                return (
                    mnum === target ||
                    mnum.endsWith(target) ||
                    target.endsWith(mnum) ||
                    mnum.includes(target) ||
                    target.includes(mnum) ||
                    last7(mnum) === last7(target)
                );
            });
            if (match) {
                try {
                    const currentPhone = await getData('userPhone');
                    const normalizedCurrent = normalizePhone(currentPhone || '');
                    const profileKey = normalizedCurrent ? `profile:${normalizedCurrent}` : 'profile';
                    const photoKey = normalizedCurrent ? `profilePhoto:${normalizedCurrent}` : 'profilePhoto';
                    const profileJson = await getData(profileKey);
                    const profile = profileJson ? JSON.parse(profileJson) : null;
                    const profilePhoto = await getData(photoKey);

                    const isCurrent = normalizePhone((match.phoneNumber || '')) === normalizedCurrent;
                    const mAny: any = match as any;
                    const resolved: Member = {
                        id: match.id,
                        avatar: isCurrent ? (profilePhoto || mAny.avatar) : (mAny.avatar || undefined),
                        name: isCurrent ? ((profile && (profile.name ? profile.name : `${profile.firstName || ''} ${profile.lastName || ''}`.trim())) || mAny.name || mAny.phoneNumber || 'Member') : (mAny.name || mAny.phoneNumber || 'Member'),
                        phoneNumber: (mAny.phoneNumber || '') as string,
                        role: (mAny.role as any) || ROLE.ROOM_MEMBER,
                    };
                    console.log('[hm-room-detail] found user (current room)', resolved);
                    setFoundUser(resolved);
                    setFoundUserLoading(false);
                    return resolved;
                } catch (e) {
                    console.error('[hm-room-detail] error resolving member profile data', e);
                }
            }
        } catch (e) {
            console.error('Error searching user by phone', e);
        }
        console.log('[hm-room-detail] no user found for', target);
        setFoundUserLoading(false);
        setFoundUserNotFound(true);
        return null;
    };

    const handleSelectFoundUser = () => {
        if (!foundUser) return;
        setNewPhoneNumber(foundUser.phoneNumber || '');
        setNewName(foundUser.name || '');
        setFoundUser(null);
    };

    const handleChangeName = (name: string) => {
        setNewName(name);
    };

    const isEmpty = useMemo(() => members.length === 0, [members]);
    const handleAddNewRoomMaster = () => {
        if (editingMemberId !== null) {
            // Edit existing member
            const normalizedPhone = normalizePhone(newPhoneNumber);
            const updated = members.map((m) =>
                m.id === editingMemberId
                    ? { ...m, name: newName || newPhoneNumber, phoneNumber: normalizedPhone, avatar: m.avatar }
                    : m
            );
            setMembers(updated);
            if (roomId) storeData(`members:${roomId}`, JSON.stringify(updated));
            // Keep users directory in sync with edited member (per-phone)
            try {
                if (normalizedPhone) {
                    upsertUser({ phoneNumber: normalizedPhone, name: newName || newPhoneNumber }).catch((e) =>
                        console.error('[hm-room-detail] error upserting user after edit', e)
                    );
                }
            } catch (e) {
                console.error('[hm-room-detail] error scheduling upsert after edit', e);
            }
            setEditingMemberId(null);
            setNewPhoneNumber("");
            setNewName("");
            setShowModal(false);
            return;
        }
        // If we're adding a ROOM_MASTER, ensure there's only one: demote any existing ROOM_MASTER
        if (addingRole === ROLE.ROOM_MASTER) {
            const hasMaster = members.some((m) => m.role === ROLE.ROOM_MASTER);
            if (hasMaster) {
                const demoted = members.map((m) =>
                    m.role === ROLE.ROOM_MASTER ? { ...m, role: ROLE.ROOM_MEMBER } : m
                );
                setMembers(demoted);
                if (roomId) storeData(`members:${roomId}`, JSON.stringify(demoted));
            }
        }

        // Determine avatar for the new member. Prefer (in order):
        // - profilePhoto if the new phone matches the current device user
        // - avatar stored in local `users` list for that phone
        // - existing member avatar for same phone (if any)
        // - fallback static avatar
        // Use undefined as the default so the Avatar component can show a
        // fallback (AvatarFallbackText or a silhouette) instead of a specific
        // stock photo. This makes new members without an image show the
        // generic human-shaped fallback like Facebook.
        const defaultAvatar: string | undefined = undefined;

        const resolveAvatarForPhone = async (phone?: string) => {
            if (!phone) return defaultAvatar;
            try {
                const currentPhone = await getData('userPhone');
                const normalizedCurrent = normalizePhone(currentPhone || '');
                const normalizedPhone = normalizePhone(phone || '');
                if (normalizedCurrent && normalizedPhone && normalizedCurrent === normalizedPhone) {
                    const photoKey = normalizedCurrent ? `profilePhoto:${normalizedCurrent}` : 'profilePhoto';
                    const profilePhoto = await getData(photoKey);
                    if (profilePhoto) return profilePhoto;
                }
                const u = await findUserByPhone(phone);
                if (u && u.avatar) return u.avatar;
                // fallback: check if there's already a member with that phone
                const existing = members.find((m) => (m.phoneNumber || '') === phone);
                if (existing && existing.avatar) return existing.avatar;
            } catch (e) {
                // ignore and fallback
            }
            return defaultAvatar;
        };

        // resolve avatar synchronously via async helper (we'll await below)
        const newMemberId = Date.now();
        (async () => {
            const avatarResolved = await resolveAvatarForPhone(newPhoneNumber);
            const normalizedPhone = normalizePhone(newPhoneNumber);

            const newMember: Member = {
                id: newMemberId,
                avatar: avatarResolved,
                name: newName || newPhoneNumber,
                phoneNumber: normalizedPhone,
                role: (addingRole as ROLE) || ROLE.ROOM_MASTER,
            };

            const updated = [...members, newMember];
            // update state and persist members for this room
            setMembers(updated);
            if (roomId) {
                storeData(`members:${roomId}`, JSON.stringify(updated));
            }
            // Ensure users directory contains this member's profile (per-phone)
            try {
                if (normalizedPhone) {
                    await upsertUser({ phoneNumber: normalizedPhone, name: newMember.name || '', avatar: avatarResolved });
                    // Do NOT persist room-scoped roles into the global users
                    // table. Room master is intentionally stored per-room only.
                }
            } catch (e) {
                console.error('[hm-room-detail] error upserting user after add', e);
            }
            setNewPhoneNumber("");
            setNewName("");
            setShowModal(false);
            setAddingRole(null);
        })();
    };

    const handleEditMember = (memberId: number) => {
        const member = members.find((m) => m.id === memberId);
        if (!member) return;
        setEditingMemberId(memberId);
        setNewName(member.name || "");
        setNewPhoneNumber(member.phoneNumber || "");
        setShowModal(true);
    };

    const handleAssignMemberAsRoomMaster = async (memberId: number) => {
        // Assign the given member id as ROOM_MASTER for this room.
        // Demote any existing ROOM_MASTER, promote the selected member,
        // persist members and update local users list accordingly.
        try {
            const updated = members.map((m) => {
                if (m.id === memberId) return { ...m, role: ROLE.ROOM_MASTER };
                if (m.role === ROLE.ROOM_MASTER) return { ...m, role: ROLE.ROOM_MEMBER };
                return m;
            });
            setMembers(updated);
            if (roomId) await storeData(`members:${roomId}`, JSON.stringify(updated));

            // Ensure a global user record exists for the promoted member
            // (name/avatar). Do NOT persist room-scoped role globally; keep
            // room master state in the members:<roomId> record only.
            try {
                const member = updated.find((m) => m.id === memberId);
                if (member) {
                    await upsertUser({ phoneNumber: member.phoneNumber, name: member.name || '', avatar: member.avatar });
                }
            } catch (e) {
                console.error('[hm-room-detail] error ensuring user record after assign', e);
            }

        } catch (e) {
            console.error('Error assigning member as room master', e);
        }
    };

    const handleDeleteMember = (memberId: number) => {
        const updated = members.filter((m) => m.id !== memberId);
        setMembers(updated);
        if (roomId) storeData(`members:${roomId}`, JSON.stringify(updated));
    };

    const handleCreateInvoice = () => {
        setShowCreateInvoiceDrawer(true);
    };

    const handleDeleteInvoice = async (invoiceId: number) => {
        if (!roomId) return;
        try {
            const key = `invoices:${roomId}`;
            const raw = await getData(key);
            if (!raw) return;
            const list = JSON.parse(raw) as any[];
            const filtered = list.filter((inv) => inv.id !== invoiceId);
            await storeData(key, JSON.stringify(filtered));
            // reload members/invoices view is handled by subscribers reading storage
        } catch (e) {
            console.error('Error deleting invoice', invoiceId, e);
        }
    };

    const handleEditInvoice = async (invoiceId: number) => {
        if (!roomId) return;
        try {
            const key = `invoices:${roomId}`;
            const raw = await getData(key);
            if (!raw) return;
            const list = JSON.parse(raw) as any[];
            const target = list.find((inv) => inv.id === invoiceId);
            if (!target) return;
            // expenses persisted may have price as string -> convert to BigInt
            const loadedExpenses = (target.expenses || []).map((e: any) => ({
                ...e,
                price: typeof e.price === 'string' ? BigInt(e.price) : (typeof e.price === 'number' ? BigInt(e.price) : e.price),
            })) as Expense[];
            setDefaultExpenses(loadedExpenses);
            setExpenses([]);
            setSelectedDate(target.date ? new Date(target.date) : new Date());
            setEditingInvoiceId(invoiceId);
            setShowCreateInvoiceDrawer(true);
        } catch (e) {
            console.error('Error loading invoice for edit', invoiceId, e);
        }
    };

    const handleDeleteRoom = async (roomId?: string | number) => {
        Alert.alert(
            "Delete room",
            "Are you sure you want to delete this room? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        console.log("Deleting room", roomId);
                        // Persist deleted room id so other screens (dashboard) can filter it out
                        try {
                            const raw = await getData("deletedRooms");
                            const deleted: number[] = raw ? JSON.parse(raw) : [];
                            const idNum = typeof roomId === "string" ? Number(roomId) : roomId;
                            if (typeof idNum === "number" && !deleted.includes(idNum)) {
                                deleted.push(idNum as number);
                                await storeData("deletedRooms", JSON.stringify(deleted));
                            }
                            // Clean up any persisted members or invoices for the deleted room
                            try {
                                if (typeof idNum === "number") {
                                    await removeData(`members:${idNum}`);
                                    await removeData(`invoices:${idNum}`);
                                }
                            } catch (e) {
                                console.error("Error removing room-related persisted keys", e);
                            }
                            // Also remove the room from the persisted `rooms` list if it exists
                            try {
                                const rawRooms = await getData("rooms");
                                if (rawRooms) {
                                    const parsedRooms = JSON.parse(rawRooms) as any[];
                                    const filtered = parsedRooms.filter(
                                        (r) => r.id !== (typeof idNum === "number" ? idNum : Number(idNum))
                                    );
                                    // Only store if length changed
                                    if (filtered.length !== parsedRooms.length) {
                                        await storeData("rooms", JSON.stringify(filtered));
                                    }
                                }
                            } catch (e) {
                                console.error("Error updating persisted rooms on delete", e);
                            }
                        } catch (e) {
                            console.error("Error persisting deleted room", e);
                        }

                        // Clear local room members and navigate back to dashboard
                        setMembers([]);
                        router.replace(Routes.HOME_MASTER_DASHBOARD as any);
                    },
                },
            ]
        );
    };

    const handleCancelCreateInvoice = () => {
        setDefaultExpenses([
            { name: "Room", price: 5000000n, quantity: 1 },
            { name: "Electricity", price: 10000000n, quantity: 18 },
            { name: "Water", price: 100n, quantity: 1 },
        ]);
        setExpenses([]);
        setShowCreateInvoiceDrawer(false);
    };

    const handleCreateNewInvoice = () => {
        (async () => {
            try {
                console.log("Create new invoice for room", roomId);
                if (!roomId) {
                    console.warn("No roomId provided, cannot persist invoice");
                    setShowCreateInvoiceDrawer(false);
                    return;
                }

                // Build invoice object (simple FixedInvoice-like shape)
                const allExpenses = [
                    ...defaultExpenses,
                    ...expenses,
                ];
                // compute totals using bigint
                const totalAmount = allExpenses.reduce(
                    (s, e) => s + (BigInt((e as any).price || 0n) * BigInt(e.quantity || 1)),
                    0n
                );
                const memberCount = BigInt(members.length || 1);
                const eachMemberAmount = memberCount > 0n ? totalAmount / memberCount : 0n;

                const invoice = {
                    id: Date.now(),
                    roomId: typeof roomId === "string" ? Number(roomId) : roomId,
                    date: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
                    expenses: allExpenses,
                    // persist bigint as string
                    totalAmount: totalAmount.toString(),
                    eachMemberAmount: Number(eachMemberAmount),
                };

                // Persist invoice under invoices:<roomId>
                try {
                    const key = `invoices:${roomId}`;
                    const raw = await getData(key);
                    const list = raw ? JSON.parse(raw) : [];
                    // Convert any BigInt fields (expense.price) to strings for consistent persistence
                    const serializableInvoice = {
                        ...invoice,
                        expenses: (invoice.expenses || []).map((e: any) => ({
                            ...e,
                            // normalize all prices to strings to avoid mixed types
                            price: String(e.price ?? "0"),
                        })),
                    };

                    console.log('[hm-room-detail] serializableInvoice before persist', JSON.stringify(serializableInvoice));

                    if (editingInvoiceId !== null) {
                        // replace existing invoice; preserve the original id
                        const replacedInvoice = { ...serializableInvoice, id: editingInvoiceId };
                        const replaced = list.map((inv: any) =>
                            inv.id === editingInvoiceId ? replacedInvoice : inv
                        );
                        await storeData(key, JSON.stringify(replaced));
                        setEditingInvoiceId(null);
                    } else {
                        list.push(serializableInvoice);
                        await storeData(key, JSON.stringify(list));
                        console.log('[hm-room-detail] stored invoices length', list.length);
                    }
                    // no-op: do not bump external version here (reverting recent change)
                } catch (e) {
                    console.error("Error persisting invoice for room", roomId, e);
                }

                // Update persisted rooms' nextInvoiceDate if rooms list exists
                try {
                    const rawRooms = await getData("rooms");
                    if (rawRooms) {
                        const parsedRooms = JSON.parse(rawRooms) as any[];
                        const updatedRooms = parsedRooms.map((r) =>
                            r.id === (typeof roomId === "string" ? Number(roomId) : roomId)
                                ? { ...r, nextInvoiceDate: selectedDate ? formatDate(new Date(selectedDate)) : r.nextInvoiceDate }
                                : r
                        );
                        await storeData("rooms", JSON.stringify(updatedRooms));
                    }
                } catch (e) {
                    console.error("Error updating rooms nextInvoiceDate", e);
                }
            } catch (e) {
                console.error("Error creating invoice", e);
            } finally {
                setShowCreateInvoiceDrawer(false);
            }
        })();
    };

    const handleChangeSelectedDate = (date: Date | null) => {
        setSelectedDate(date);
    };

    const handleChangeDefaultExpenses = (
        name: string,
        key: string,
        value: number | string
    ) => {
        setDefaultExpenses((prevExpenses) =>
            prevExpenses.map((expense) => {
                if (expense.name !== name) return expense;
                if (key === 'price') {
                    const cleaned = String(value || '').replace(/\D+/g, '');
                    const priceBig = cleaned ? BigInt(cleaned) : 0n;
                    return { ...expense, price: priceBig } as Expense;
                }
                if (key === 'quantity') {
                    const qty = Number(value) || 0;
                    return { ...expense, quantity: qty } as Expense;
                }
                return expense;
            })
        );
    };

    const handleAddExpense = () => {
        console.log("Add expense");
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setExpenses((prevExpenses) => [
            ...prevExpenses,
            { id, name: "", price: 0n as any, quantity: 0 } as Expense,
        ]);
    };

    const handleRemoveExpense = (index: number) => {
        setExpenses((prevExpenses) =>
            prevExpenses.filter((_, i) => i !== index)
        );
    };

    const handleChangeExpense = (index: number, key: string, value: any) => {
        setExpenses((prevExpenses) =>
            prevExpenses.map((expense, i) => {
                if (i !== index) return expense;
                if (key === 'price') {
                    const cleaned = String(value || '').replace(/\D+/g, '');
                    const priceBig = cleaned ? BigInt(cleaned) : 0n;
                    return { ...expense, price: priceBig } as Expense;
                }
                if (key === 'quantity') {
                    const qty = Number(value) || 0;
                    return { ...expense, quantity: qty } as Expense;
                }
                return { ...expense, [key]: value };
            })
        );
    };

    return {
        showModal,
    newPhoneNumber,
    newName,
        showCreateInvoiceDrawer,
        selectedDate,
        defaultExpenses,
        expenses,
        members,
        isEmpty,
    foundUser,
    foundUserLoading,
    foundUserNotFound,

        handleAddRoomMaster,
        handleChangePhoneNumber,
        handleCancelAddNewRoomMaster,
        handleAddNewRoomMaster,
    handleSearchUserByPhone,
    handleSelectFoundUser,
    handleCreateInvoice,
        handleDeleteRoom,
        handleCancelCreateInvoice,
        handleCreateNewInvoice,
    handleDeleteInvoice,
    handleEditInvoice,
        handleChangeSelectedDate,
        handleChangeDefaultExpenses,
        handleAddExpense,
        handleRemoveExpense,
        handleChangeExpense,
        handleChangeName,
        handleEditMember,
        handleDeleteMember,
        handleAddMember,
        handleAssignMemberAsRoomMaster,
        addingRole,
    };
};

export default useHMRoomDetail;
