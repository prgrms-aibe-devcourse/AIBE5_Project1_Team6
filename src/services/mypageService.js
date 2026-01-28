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

    if (error) {
        console.error('getNotifications error:', error);
        return [];
    }
    return data || [];
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

// 다가오는 여행 일정 알림 생성
export const createTripNotifications = async (userId, schedules) => {
    if (!userId || !schedules || schedules.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const schedule of schedules) {
        const startDate = schedule.startDate ? new Date(schedule.startDate) : null;
        if (!startDate) continue;

        startDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

        // 1일, 3일, 7일, 14일 전에 알림 생성 (중복 방지)
        const notificationDays = [1, 3, 7, 14];

        for (const days of notificationDays) {
            if (daysUntil === days) {
                // 이미 같은 알림이 있는지 더 정확하게 확인
                const { data: existingNotifications, error: checkError } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('type', 'schedule')
                    .eq('schedule_id', schedule.id);

                // 이미 해당 일정에 대한 알림이 있으면 건너뛰기
                if (existingNotifications && existingNotifications.length > 0) {
                    // 같은 일수에 대한 알림이 있는지 확인
                    const hasSameDayNotification = existingNotifications.some(notif => {
                        // 데이터베이스에서 가져온 알림을 다시 조회하여 메시지 확인
                        return true; // 일단 하나라도 있으면 건너뛰기
                    });

                    if (hasSameDayNotification) {
                        continue;
                    }
                }

                // 메시지 커스터마이징
                let message;
                if (days === 1) {
                    message = `🎒 내일 출발! ${schedule.title || '여행'} 일정이 하루 남았습니다. 마지막 점검하세요!`;
                } else if (days === 3) {
                    message = `⏰ ${schedule.title || '여행'} 일정이 ${days}일 남았습니다. 준비물 챙기셨나요?`;
                } else if (days === 7) {
                    message = `📋 ${schedule.title || '여행'} 일정이 일주일 남았습니다. 슬슬 준비를 시작하세요!`;
                } else {
                    message = `✈️ ${schedule.title || '여행'} 일정이 ${days}일 남았습니다. 미리 계획을 세워보세요!`;
                }

                try {
                    await supabase
                        .from('notifications')
                        .insert([{
                            user_id: userId,
                            type: 'schedule',
                            message: message,
                            schedule_id: schedule.id,
                            is_read: false
                        }]);
                } catch (insertError) {
                    // 삽입 에러 무시 (중복 방지)
                    console.log('Notification already exists or insert failed:', insertError);
                }
            }
        }
    }
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
