import { supabase } from "./supabase";

/**
 * 사용자의 저장된 장소 목록 조회
 */
export async function getSavedPlaces(userId) {
    if (!userId) return [];
    
    const { data, error } = await supabase
        .from('saved_places')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('저장된 장소 조회 실패:', error);
        return [];
    }
    
    return data || [];
}

/**
 * 카테고리별 저장된 장소 조회
 */
export async function getSavedPlacesByCategory(userId, category) {
    if (!userId) return [];
    
    const { data, error } = await supabase
        .from('saved_places')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('카테고리별 저장된 장소 조회 실패:', error);
        return [];
    }
    
    return data || [];
}

/**
 * 장소 저장
 */
export async function savePlace(userId, placeData) {
    if (!userId) {
        throw new Error('로그인이 필요합니다.');
    }
    
    const { data, error } = await supabase
        .from('saved_places')
        .insert({
            user_id: userId,
            title: placeData.title,
            image: placeData.image || placeData.firstimage,
            country: placeData.country || '대한민국',
            description: placeData.description || placeData.desc || placeData.overview,
            tag: placeData.tag,
            category: placeData.category, // 'walk', 'traffic', 'airplane'
            match_score: placeData.matchScore || 95,
            place_data: placeData // 전체 데이터 JSON으로 저장
        })
        .select()
        .single();
    
    if (error) {
        console.error('장소 저장 실패:', error);
        throw error;
    }
    
    return data;
}

/**
 * 중복 확인 (같은 제목의 장소가 이미 저장되어 있는지)
 */
export async function isPlaceSaved(userId, title) {
    if (!userId) return false;
    
    const { data, error } = await supabase
        .from('saved_places')
        .select('id')
        .eq('user_id', userId)
        .eq('title', title)
        .maybeSingle();
    
    if (error) {
        console.error('중복 확인 실패:', error);
        return false;
    }
    
    return !!data;
}

/**
 * 저장된 장소 삭제
 */
export async function deletePlace(placeId) {
    const { error } = await supabase
        .from('saved_places')
        .delete()
        .eq('id', placeId);
    
    if (error) {
        console.error('장소 삭제 실패:', error);
        throw error;
    }
    
    return true;
}
