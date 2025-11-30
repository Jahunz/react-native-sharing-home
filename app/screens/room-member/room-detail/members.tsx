import MemberCard from "@/app/components/memberCard";
import { Member } from "@/app/constants/types";
import { dummy_member_list } from "@/utils/dummy";
import { useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { getData } from "@/app/storage/async_storage";
import { normalizePhone } from '@/app/storage/users';

export default function MembersTab() {
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const [members, setMembers] = useState<Member[]>(dummy_member_list);

    useEffect(() => {
        const loadMembers = async () => {
            if (!roomId) return;
            try {
                const raw = await getData(`members:${roomId}`);
                if (raw) {
                    const parsed = JSON.parse(raw);

                    // If the current user has a profile stored, prefer showing that
                    // user's display name and avatar for their entry in the members list.
                    try {
                        const userPhone = (await getData('userPhone')) || '';
                        const normalized = normalizePhone(userPhone || '');
                        const profileKey = normalized ? `profile:${normalized}` : 'profile';
                        const photoKey = normalized ? `profilePhoto:${normalized}` : 'profilePhoto';
                        const profileJson = await getData(profileKey);
                        const profile = profileJson ? JSON.parse(profileJson) : null;
                        const profilePhoto = (await getData(photoKey)) || null;
                        if (userPhone && profile) {
                            const updated = parsed.map((m: any) => {
                                        if (m.phoneNumber === userPhone) {
                                            const displayName = profile && profile.name ? profile.name : `${(profile?.firstName || '').trim()}${profile?.lastName ? ` ${profile.lastName}` : ''}`.trim();
                                            return {
                                                ...m,
                                                name: displayName || m.name,
                                                avatar: profilePhoto || m.avatar,
                                            };
                                }
                                return m;
                            });
                            setMembers(updated);
                            return;
                        }
                    } catch (e) {
                        // if profile read fails, just set parsed
                    }

                    setMembers(parsed);
                    return;
                }
            } catch (e) {
                console.error('Error loading members for room', roomId, e);
            }
            // fallback to dummy
            setMembers(dummy_member_list);
        };

        loadMembers();
    }, [roomId]);

    return (
        <>
            {members.map((member) => (
                <MemberCard
                    key={member.id}
                    avatar={member.avatar}
                    memberName={member.name}
                    phoneNumber={member.phoneNumber}
                    role={member.role}
                />
            ))}
        </>
    );
}
