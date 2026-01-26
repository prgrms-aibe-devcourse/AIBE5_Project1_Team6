import { supabase } from './supabase';

/**
 * 여행 데이터를 Supabase에 저장합니다.
 * user_id가 있으면 회원 데이터로, 없으면 guest_id로 저장합니다.
 * @param {Object} tripData - 저장할 여행 데이터 (store의 state)
 * @param {string|null} userId - 로그인한 사용자 ID (없으면 null)
 * @param {string|null} guestId - 비회원 식별 ID (없으면 null)
 */
export const saveTrip = async (tripData, userId, guestId) => {
  if (!userId && !guestId) {
    throw new Error("User ID or Guest ID represents a required field.");
  }

  // 1. 저장할 데이터 정제
  const payload = {
    trip_data: tripData,
    user_id: userId || null,
    guest_id: userId ? null : guestId // 회원이면 guest_id는 비워둡니다 (정책에 따라 다름)
  };

  // 2. Insert into 'trips' table
  const { data, error } = await supabase
    .from('trips')
    .insert([payload]);

  if (error) {
    console.error('Error saving trip:', error);
    throw error;
  }

  return data;
};
