import { v4 as uuidv4 } from 'uuid';

export const GUEST_KEY = 'trip_guest_id';

/**
 * 게스트 ID를 가져오거나 새로 생성합니다.
 * @returns {string} Guest UUID
 */
export const getOrCreateGuestId = () => {
  let guestId = localStorage.getItem(GUEST_KEY);
  if (!guestId) {
    guestId = uuidv4();
    localStorage.setItem(GUEST_KEY, guestId);
  }
  return guestId;
};

/**
 * 게스트 ID를 초기화합니다 (로그인 등으로 전환 시 필요할 경우)
 */
export const clearGuestId = () => {
  localStorage.removeItem(GUEST_KEY);
};
