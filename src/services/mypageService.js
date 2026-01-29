import { supabase } from './supabase';

// --- Memories (추억) ---

export const getMemories = async () => {
    const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// --- Notifications (알림) ---

export const getNotifications = async (userId) => {
    if (!userId) return [];
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const markAllNotificationsAsRead = async (userId) => {
    if (!userId) return;
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) throw error;
};

export const deleteAllNotifications = async (userId) => {
    if (!userId) return;
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

    if (error) throw error;
};

export const markNotificationAsRead = async (id) => {
    const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .select();

    if (error) throw error;
    return data;
};

export const deleteNotification = async (id) => {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- Profile (프로필) ---

export const getProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
};

export const createNotification = async ({ user_id, sender_id, type, message, link }) => {
    const { data, error } = await supabase
        .from('notifications')
        .insert([{
            user_id,
            sender_id,
            type,
            message,
            link
        }]);

    if (error) {
        console.error('Error creating notification:', error);
        return null;
    }
    return data;
};

// --- Badges (뱃지) ---

export const getUserBadges = async (userId) => {
    if (!userId) return [];

    // 사용자의 뱃지 현황 데이터를 가져옵니다. (View 활용)
    // 만약 View를 못 만들었다면 직접 조인해야 하지만, 여기선 직접 조인 방식을 사용하겠습니다 (안전하게).

    // 1. 모든 뱃지 정의 가져오기
    const { data: allBadges, error: badgeError } = await supabase
        .from('badges')
        .select('*');

    if (badgeError) throw badgeError;

    // 2. 사용자의 뱃지 진행상황 가져오기
    const { data: userBadges, error: userBadgeError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);

    if (userBadgeError) throw userBadgeError;

    // 3. 데이터 병합
    // 사용자가 아직 해당 뱃지에 대한 데이터가 없으면 기본값(잠김)으로 표시
    const mergedBadges = allBadges.map(badge => {
        const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
        return {
            id: badge.id,
            title: badge.title,
            icon: badge.icon,
            desc: badge.description,
            xp: badge.xp,
            earned: userBadge ? userBadge.earned : false,
            progress: userBadge ? `${userBadge.progress}/${userBadge.goal}` : null,
            rawProgress: userBadge ? userBadge.progress : 0,
            rawGoal: userBadge ? userBadge.goal : 1,
            date: userBadge?.earned_at ? new Date(userBadge.earned_at).toLocaleDateString() : null
        };
    });

    return mergedBadges;
};

// (임시) 테스트용: 사용자가 처음 들어왔을 때 뱃지 데이터를 초기화해주는 함수
// 실제로는 뱃지 획득 로직이 서버사이드나 특정 액션 시점에 있어야 합니다.
export const initializeUserBadgesIfEmpty = async (userId) => {
    const { data } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);

    if (data && data.length === 0) {
        // 더미 데이터 삽입
        const { error } = await supabase.from('user_badges').insert([
            { user_id: userId, badge_id: 'first_europe', earned: true, progress: 1, goal: 1, earned_at: new Date().toISOString() },
            { user_id: userId, badge_id: 'photo_master', earned: true, progress: 55, goal: 50, earned_at: new Date().toISOString() },
            { user_id: userId, badge_id: 'pro_traveler', earned: false, progress: 3, goal: 10 },
            { user_id: userId, badge_id: 'world_traveler', earned: false, progress: 2, goal: 5 },
        ]);
        if (error) console.error("Error initializing badges:", error);
    }
}
