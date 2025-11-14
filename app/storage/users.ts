import { getData, storeData } from './async_storage';

export type LocalUser = {
    phoneNumber?: string;
    phone?: string;
    name?: string;
    avatar?: string;
    role?: string;
};

const USERS_KEY = 'users';

const normalizePhone = (p?: string) => {
    if (!p) return '';
    return p.toString().replace(/\D+/g, '');
};

const getUsers = async (): Promise<LocalUser[]> => {
    try {
        const raw = await getData(USERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('[users] error reading users', e);
        return [];
    }
};

const saveUsers = async (users: LocalUser[]) => {
    try {
        await storeData(USERS_KEY, JSON.stringify(users));
    } catch (e) {
        console.error('[users] error saving users', e);
    }
};

const findUserByPhone = async (phone?: string): Promise<LocalUser | undefined> => {
    // Use strict, normalized exact-match only to avoid fuzzy collisions
    // that caused avatars/names to be copied between different numbers.
    if (!phone) return undefined;
    const target = normalizePhone(phone);
    if (!target) return undefined;
    const users = await getUsers();
    return users.find((u) => {
        const uPhone = normalizePhone(u.phoneNumber || u.phone || '');
        if (!uPhone) return false;
        return uPhone === target;
    });
};

const upsertUser = async (user: LocalUser) => {
    try {
        const users = await getUsers();
        const incoming = { ...user } as LocalUser;
        // normalize incoming phone
        const norm = normalizePhone(user.phoneNumber || user.phone || '');
        if (norm) incoming.phoneNumber = norm;

        const existing = users.find((u) => normalizePhone(u.phoneNumber || u.phone || '') === norm && norm !== '');
        if (existing) {
            // merge fields
            Object.assign(existing, incoming);
        } else {
            // ensure stored record has normalized phoneNumber if available
            if (incoming.phoneNumber) {
                incoming.phoneNumber = normalizePhone(incoming.phoneNumber);
            }
            users.push(incoming);
        }
        await saveUsers(users);
    } catch (e) {
        console.error('[users] error upserting user', e);
    }
};

const setUserRole = async (phone: string | undefined, role?: string) => {
    if (!phone) return;
    try {
        const users = await getUsers();
        const normalizedPhone = normalizePhone(phone);
        let found = users.find((u) => normalizePhone(u.phoneNumber || u.phone || '') === normalizedPhone);
        if (!found) {
            found = { phoneNumber: normalizedPhone, role: role };
            users.push(found);
        } else {
            found.role = role;
        }
        await saveUsers(users);
    } catch (e) {
        console.error('[users] error setting role', e);
    }
};

export { normalizePhone, getUsers, saveUsers, findUserByPhone, upsertUser, setUserRole };
