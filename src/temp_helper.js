export function getPersonaDesc(key) {
    if(key === 'burnout') return '당신은 쉼을 통해 더 나아가는 여행자입니다.';
    if(key === 'refresh') return '당신은 일상 속 신선한 자극을 즐기는 탐험가입니다.';
    if(key === 'active') return '당신은 새로운 도전에서 에너지를 얻는 모험가입니다.';
    return '당신은 조용한 사색을 통해 깊이 있는 여행을 즐깁니다.';
}
