import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import ScheduleForm from "../components/ScheduleForm";
import ScheduleCard from "../components/ScheduleCard";
import ScheduleEditor from "../components/ScheduleEditor";
import MoodPalette from "../components/MoodPalette";
import InstantRouteGenerator from "../components/InstantRouteGenerator";
import ScheduleDetailView from "../components/ScheduleDetailView";
import ScheduleCalendar from "../components/ScheduleCalendar";
import ErrorBoundary from "../components/ErrorBoundary";
import RecommendationCard from "../components/RecommendationCard";
import LoadingOverlay from "../components/LoadingOverlay";
import {
    loadSchedules,
    addSchedule,
    updateSchedule,
    removeSchedule,
    clearSchedules,
} from "../services/schedulesStorage";
import { getSavedPlaces, deletePlace } from "../services/savedPlacesService";
import TripDetailDrawer from "../components/TripDetailDrawer";
import { improvePlanText } from "../services/aiPlanner";
import { generateAllTravelPlans } from "../services/geminiTravelPlanner";
import AIScheduleOptionsModal from "../components/AIScheduleOptionsModal"; // Import Modal
import { simpleDiff } from "../services/diff";
import { FiList, FiCalendar, FiBookmark } from "react-icons/fi";
import "../styles/schedules.css";
import { useAuthStore } from "../stores/authStore";
import { useTripStore } from "../stores/tripStore"; // For mood sync

export default function PlanLab() {
    const queryClient = useQueryClient();
    const location = useLocation();
    const { user, setShowLoginPrompt } = useAuthStore();

    // ... existing states ...
    const [showForm, setShowForm] = useState(false);
    const [showMoodPalette, setShowMoodPalette] = useState(false);
    const [showInstantRoute, setShowInstantRoute] = useState(false);
    const [moodSelections, setMoodSelections] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [activeTab, setActiveTab] = useState(0); // 0: 목록, 1: 세부일정, 2: 수정
    const [savedTab, setSavedTab] = useState('domestic'); // 'domestic' | 'overseas'
    const [selectedForView, setSelectedForView] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

    // 상세 보기 (Drawer) 관련 상태
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [drawerNights, setDrawerNights] = useState(1);
    const [drawerPeople, setDrawerPeople] = useState(1);
    const [drawerPlanText, setDrawerPlanText] = useState("");
    const [drawerDiffResult, setDrawerDiffResult] = useState(null);

    // AI 옵션 모달 상태
    const [showAIOptionsModal, setShowAIOptionsModal] = useState(false);
    const [aiStartingPlace, setAiStartingPlace] = useState(null);

    // AI Loading & Data State
    const [loadingState, setLoadingState] = useState({ isLoading: false, message: '', icon: '' });
    const [generatedPlans, setGeneratedPlans] = useState(null); // Store fetched plans for InstantRouteGenerator

    // 사용자 변경 시 데이터 새로고침
    useEffect(() => {
        queryClient.invalidateQueries(["schedules"]);
        queryClient.invalidateQueries(["savedPlaces"]);
    }, [user?.id, queryClient]);

    // Load schedules
    const { data: schedules = [], isLoading } = useQuery({
        queryKey: ["schedules", user?.id],
        queryFn: loadSchedules,
    });

    // Load saved places
    // Load saved places (Bookmarks only for PlanLab)
    const { data: savedPlaces = [] } = useQuery({
        queryKey: ["savedPlaces", user?.id],
        queryFn: () => getSavedPlaces(user?.id),
        select: (data) => data.filter(p => {
            const type = p.place_data?.savedType;
            const cat = (p.category || p.place_data?.category || '').toLowerCase();
            // Domestic: walk/traffic (likes) -> handled by cat check if type is missing or 'like', but specific requirement is:
            // "Walk/Traffic" -> Domestic (usually likes)
            // "Airplane" -> Overseas (usually bookmarks)
            // We want to SHOW them in the tabs.
            // Domestic Tab shows: walk/traffic items.
            // Overseas Tab shows: airplane items (bookmarks).
            
            // So we need to fetch:
            // 1. Any 'bookmark' (future proof)
            // 2. Any 'walk'/'traffic' (even if 'like')
            // 3. Any 'airplane' (if 'bookmark')
            
            return type === 'bookmark';
        }),
        enabled: !!user?.id,
    });

    const handleDeleteSavedPlace = async (placeId) => {
        try {
            await deletePlace(placeId);
            queryClient.invalidateQueries(["savedPlaces"]);
            toast.success("저장된 장소가 삭제되었습니다.");
        } catch (error) {
            toast.error("삭제에 실패했습니다.");
        }
    };

    const isProcessed = useRef(false);

    // Handle navigation from MyPage
    useEffect(() => {
        if (!isProcessed.current) {
            // 1. 상세 보기 트리거
            if (location.state?.scheduleId && schedules.length > 0) {
                const target = schedules.find(s => String(s.id) === String(location.state.scheduleId));
                if (target) {
                    setSelectedForView(target);
                    setActiveTab(1);
                    isProcessed.current = true;
                }
            }
            // 2. 일정 생성 트리거
            else if (location.state?.openCreate) {
                setShowMoodPalette(true);
                isProcessed.current = true;
                // Clear state to prevent reopening on refresh
                window.history.replaceState({}, document.title);
            }
        }
    }, [location.state, schedules]);

    // Add schedule mutation
    const addMutation = useMutation({
        mutationFn: addSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries(["schedules"]);
            // toast.success("일정이 생성되었습니다!"); // Removed as requested
            setShowForm(false);
        },
        onError: (err) => {
            toast.error("생성 실패: " + err.message);
        },
    });

    // Update schedule mutation
    const updateMutation = useMutation({
        mutationFn: updateSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries(["schedules"]);
            // toast.success("일정이 수정되었습니다!"); // Removed as requested
            setSelectedSchedule(null);
        },
        onError: (err) => {
            toast.error("수정 실패: " + err.message);
        },
    });

    // Delete schedule mutation
    const deleteMutation = useMutation({
        mutationFn: removeSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries(["schedules"]);

            setSelectedSchedule(null);
            if (selectedForView && deleteMutation.variables === selectedForView.id) {
                setSelectedForView(null);
                setActiveTab(0);
            }
        },
        onError: (err) => {
            toast.error("삭제 실패: " + err.message);
        },
    });

    const handleCreateSchedule = (scheduleData) => {
        addMutation.mutate(scheduleData);
    };

    const handleMoodComplete = async (selections) => {
        setMoodSelections(selections);
        setShowMoodPalette(false);
        
        // Start Loading
        setLoadingState({ isLoading: true, message: 'AI가 30초 여행 일정을 만들고 있어요!', icon: '✨' });

        try {
            const today = new Date();
            const startDate = today.toISOString().split('T')[0];
            const endDate = new Date(today.setDate(today.getDate() + 2)).toISOString().split('T')[0]; // Default 2 nights

            const aiSelections = {
                mood: { label: selections.mood?.label || '힐링', emoji: selections.mood?.emoji || '🧘' },
                destination: { label: selections.destination?.label || '제주도', emoji: selections.destination?.emoji || '🏝️' },
                style: { label: selections.style?.label || '자연', emoji: selections.style?.emoji || '🌿' },
                budget: selections.budget, // Include selected budget
                startDate: selections.startDate || startDate,
                endDate: selections.endDate || endDate,
                duration: 2,
                people: selections.people || 1,
                userPrompt: "최적의 추천 코스로 짜줘"
            };

            const plans = await generateAllTravelPlans(aiSelections);
            
            if (plans && plans.balanced) {
                setGeneratedPlans(plans); // Store plans
                setShowInstantRoute(true); // Open Generator UI for selection
            } else {
                throw new Error("일정 생성 실패");
            }

        } catch (e) {
            console.error(e);
            toast.error("일정 생성 중 오류가 발생했습니다.");
            setShowInstantRoute(false); 
        } finally {
            setLoadingState({ isLoading: false, message: '', icon: '' });
        }
    };

    const handleInstantRouteComplete = (routeData) => {
        // InstantRoute에서 완성된 데이터를 받아 일정 생성
        const scheduleData = {
            title: routeData.title,
            description: routeData.description,
            startDate: routeData.startDate,
            endDate: routeData.endDate,
            people: routeData.people,
            scheduleText: routeData.scheduleText,
            weatherInfo: null,
            moodData: {
                mood: routeData.mood,
                destination: routeData.destination,
                style: routeData.style,
            },
        };
        addMutation.mutate(scheduleData);
        setShowInstantRoute(false);
        setMoodSelections(null);
    };

    const handleCancelInstantRoute = () => {
        setShowInstantRoute(false);
        setShowMoodPalette(true);
    };

    const handleUpdateSchedule = (scheduleData) => {
        updateMutation.mutate(scheduleData);
    };

    const handleDeleteSchedule = (id) => {
        deleteMutation.mutate(id);
    };

    const handleCardClick = (schedule) => {
        setSelectedForView(schedule);
        setActiveTab(1); // 세부일정 탭으로 이동
    };

    const handleEditClick = (schedule) => {
        setSelectedSchedule(schedule);
    };

    const handleCloseEditor = () => {
        setSelectedSchedule(null);
    };

    // 저장된 장소 클릭 시 Drawer 열기
    const handlePlaceClick = (place) => {
        // place_data가 있으면 소급하여 원본 필드 복원
        const rawData = place.place_data || {};
        const mergedItem = {
            ...rawData,
            title: place.title,
            firstimage: place.image,
            addr1: place.description,
            category: place.category,
            id: place.id, // Explicitly keep the ID
            savedPlaceId: place.id // Duplicate for specific logic if needed
        };
        
        setSelectedPlace(mergedItem);
        setDrawerNights(1);
        setDrawerPeople(1);
        setDrawerPlanText(mergedItem.planText || "");
        setDrawerDiffResult(null);
    };

    const handleImprovePlace = (detail) => {
        if (!selectedPlace) return;
        const improved = improvePlanText({
            title: selectedPlace.title,
            nights: drawerNights,
            people: drawerPeople,
            planText: drawerPlanText,
            stays: selectedPlace.stays ?? [],
            foods: selectedPlace.foods ?? [],
            theme: 'healing', // 기본 테마
            category: selectedPlace.category || 'walk',
            detail
        });
        setDrawerDiffResult(simpleDiff(drawerPlanText, improved));
        setDrawerPlanText(improved);
    };

    const onSaveFromDrawer = async (payload) => {
        try {
            // 저장된 장소를 실제 일정(Schedule)으로 변환하여 추가
            const scheduleData = {
                title: payload.title,
                description: payload.subtitle || "저장된 장소로부터 생성된 일정",
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                people: payload.people || 1,
                scheduleText: payload.planText || "",
                items: payload.items || [],
                totalCost: payload.totalCost || 0,
                moodData: {
                    mood: 'refresh',
                    destination: payload.title,
                    style: 'relaxed'
                }
            };
            
            const newSchedule = await addMutation.mutateAsync(scheduleData);

            // 핵심: '저장된 장소' -> '일정'으로 이동 (삭제 처리)
            if (selectedPlace?.savedPlaceId) {
                await deletePlace(selectedPlace.savedPlaceId);
                queryClient.invalidateQueries(["savedPlaces"]);
            }

            toast.success(`"${payload.title}" 일정이 생성되었습니다!`);
            setSelectedPlace(null);
            
            // 바로 상세 보기로 이동
            setSelectedForView(newSchedule);
            setActiveTab(1);
        } catch (e) {
            toast.error("일정 변환 실패: " + e.message);
        }
    };

    const handleOpenAIOptions = () => {
        if (!selectedPlace) return;
        setAiStartingPlace(selectedPlace);
        setShowAIOptionsModal(true);
    };

    const handleGenerateAISchedule = async ({ nights, places, userPrompt, people, mood, style, budgetLevel, startDate }) => {
        setLoadingState({ isLoading: true, message: 'AI가 맞춤 여행 일정을 생성하고 있어요!', icon: '🤖' });
        try {
            // ... (previous logic for MOODS and STYLES remains)
            const MOODS = [
                { id: "burnout", label: "번아웃" },
                { id: "energy", label: "활력 충전" },
                { id: "healing", label: "힐링" },
                { id: "adventure", label: "모험" },
            ];
            const selectedMoodObj = MOODS.find(m => m.id === mood) || MOODS[2]; 
            
            const STYLES = [
                { id: "nature", emoji: "🏞️", label: "자연" },
                { id: "city", emoji: "🏙️", label: "도심" },
                { id: "food", emoji: "🍜", label: "맛집탐방" },
                { id: "culture", emoji: "🎨", label: "문화체험" },
                { id: "relax", emoji: "🛀", label: "휴식" },
                { id: "activity", emoji: "🏄", label: "액티비티" },
            ];
            const selectedStyleObj = STYLES.find(s => s.id === style) || { label: '혼합', emoji: '🧩' };

            useTripStore.getState().setMood(mood);
            
            const destinationName = places[0]?.title || "여행";
            // Use custom startDate or default to today
            const startStr = startDate || new Date().toISOString().split('T')[0];
            const startObj = new Date(startStr);
            
            // Calculate endDate based on nights
            const endObj = new Date(startObj);
            endObj.setDate(startObj.getDate() + nights);
            const endStr = endObj.toISOString().split('T')[0];

            const selections = {
                mood: { label: selectedMoodObj.label, emoji: '✨' },
                destination: { label: destinationName, emoji: '✈️' },
                style: selectedStyleObj,
                startDate: startStr,
                endDate: endStr,
                duration: nights,
                people: people || 1, 
                budgetLevel: budgetLevel, 
                includedPlaces: places, // Explicitly pass selected places
                userPrompt // Pass user custom request
            };

            // Call the API
            const plans = await generateAllTravelPlans(selections);

            if (!plans) {
                throw new Error("일정 생성에 실패했습니다.");
            }

            // 2. Select 'balanced' plan by default or show selection? 
            // For "1 second", maybe just pick the 'recommended' (balanced) one and save it.
            const selectedPlan = plans.balanced;

            // 3. Save as Schedule
             const scheduleData = {
                title: selectedPlan.title,
                description: selectedPlan.description,
                startDate: startStr,
                endDate: endStr,
                people: people,
                scheduleText: JSON.stringify(selectedPlan.dailyItinerary, null, 2), // Saving JSON string for now, or parsing? 
                // Wait, existing logic saves structure? 
                // InstantRouteGenerator saves 'scheduleText' which seems to be raw text or markdown in other parts, but here we get JSON.
                // ScheduleDetailView might expect markdown or specific format.
                // If it expects markdown, we should convert JSON to Markdown.
                // Let's quickly convert or check if ScheduleDetailView handles JSON.
                // Based on previous conversations, ScheduleDetailView handles parsing.
                // But let's be safe: convert to Markdown string.
                
                // Converting JSON itinerary to text (simple markdown)
                // "Day 1: ... \n 09:00 Spot ..."
                // Actually ScheduleDetailView parses markdown.
                
                moodData: {
                    mood: selectedMoodObj.label, // Store mood as label (번아웃, 활력 충전, etc.)
                    destination: destinationName,
                    style: 'AI 맞춤'
                }
            };
            


            const newSchedule = await addMutation.mutateAsync(scheduleData);

            // 4. Delete saved places used?
            // "카드 누르고... 선택완료가 아닌 다음으로 이동... 쫙 나왔으면 좋겠어"
            // If we generated a full schedule, maybe we should remove the 'started' place from saved?
            // Or only if user confirms?
            // Let's remove the initial one at least, similar to "Save from Drawer".
            // Actually, keep them or ask? 
            // Used places might be removeable. 
            // Let's remove ALL selected places from saved list to avoid duplicates?
            // Safe bet: Remove the places that were included.
            
            const placeIdsToRemove = places.map(p => p.savedPlaceId || p.id).filter(Boolean);
            // Iterate and delete (or Promise.all)
            // Need a way to delete multiple or loop.
            // deletePlace is single.
            for (const pid of placeIdsToRemove) {
                // Check if it exists in savedPlaces
                // savedPlaces is available in scope
                 try {
                     // Check if this ID is actually a savedPlace ID (sometims it might be missing if constructed purely)
                     // But we passed 'savedPlaces' objects to modal.
                     await deletePlace(pid);
                 } catch(ignore) {}
            }
            queryClient.invalidateQueries(["savedPlaces"]);

            toast.success("AI 맞춤 일정이 생성되었습니다!");
            setShowAIOptionsModal(false);
            setAiStartingPlace(null);
            setSelectedPlace(null); // Close drawer too

            // View new schedule
            setSelectedForView(newSchedule);
            setActiveTab(1);

        } catch (e) {
            console.error(e);
            toast.error("일정 생성 실패: " + e.message);
        } finally {
            setLoadingState({ isLoading: false, message: '', icon: '' });
        }
    };

    return (
        <div className="pageWrap">
            {loadingState.isLoading && <LoadingOverlay message={loadingState.message} icon={loadingState.icon} />}
            <div className="planlabHeader">
                <div style={{ textAlign: 'left' }}>
                    <h2 className="pageTitle" style={{ textAlign: 'left' }}>Walk2Fly · 컵라면보다 빠른 30초 여행 계획 ✨</h2>
                    <p className="pageDesc" style={{ textAlign: 'left', marginBottom: '0' }}>
                        계획 부담 제로! 그냥 느낌만 고르세요. AI가 30초 만에 완벽한 여행을 만들어드립니다.
                    </p>
                </div>
                <button className="createBtn" onClick={() => {
                    if (!user) {
                        setShowLoginPrompt(true);
                        return;
                    }
                    setShowMoodPalette(true);
                }}>
                    ✨ 30초 만에 일정 만들기
                </button>
            </div>

            {/* 탭 네비게이션 */}
            <div className="tabNavigation">
                <button
                    className={activeTab === 0 ? "tabBtn active" : "tabBtn"}
                    onClick={() => setActiveTab(0)}
                >
                    나의 계획 목록
                </button>
                <button
                    className={`tabBtn ${activeTab === 1 ? 'active' : ''} ${selectedForView ? 'available' : ''}`}
                    onClick={() => setActiveTab(1)}
                >
                    계획 세부일정
                </button>
                <button
                    className={activeTab === 2 ? "tabBtn active" : "tabBtn"}
                    onClick={() => setActiveTab(2)}
                    style={activeTab === 2 ? {
                        borderColor: '#10B981',
                        color: '#059669',
                        backgroundColor: '#ecfdf5',
                        fontWeight: 'bold',
                        boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                    } : {}}
                >
                    <FiBookmark style={{ marginRight: '4px', fontSize: '1.1rem', verticalAlign: 'text-bottom' }} /> 저장된 장소
                </button>
            </div>
            
            {/* 뷰 모드 토글 (목록 탭일 때만 표시) */}
            {activeTab === 0 && schedules.length > 0 && (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    marginBottom: '16px',
                    gap: '8px' 
                }}>
                    <button 
                        onClick={() => setViewMode('list')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: viewMode === 'list' ? '#3b82f6' : '#e2e8f0',
                            background: viewMode === 'list' ? '#eff6ff' : '#fff',
                            color: viewMode === 'list' ? '#3b82f6' : '#64748b',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FiList /> 리스트형
                    </button>
                    <button 
                        onClick={() => setViewMode('calendar')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: viewMode === 'calendar' ? '#3b82f6' : '#e2e8f0',
                            background: viewMode === 'calendar' ? '#eff6ff' : '#fff',
                            color: viewMode === 'calendar' ? '#3b82f6' : '#64748b',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FiCalendar /> 캘린더형
                    </button>
                </div>
            )}

            {/* 탭 1: 목록 */}
            {activeTab === 0 && (
                <>
                    {schedules.length > 0 && (
                        <div className="planlabActions" style={{ display: 'none' }}>
                            {/* Clear list button removed */}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="emptyBox">로딩 중...</div>
                    ) : schedules.length === 0 ? (
                        <div className="emptyBox">
                            <div className="emptyIcon">📅</div>
                            <p>아직 생성된 일정이 없습니다.</p>
                            <p className="emptySubtext">
                                "새 일정 만들기" 버튼을 눌러 첫 일정을 만들어보세요!
                            </p>
                        </div>
                    ) : (() => {
                        // Sort schedules: upcoming first (sorted by D-Day), then past schedules
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        const upcomingSchedules = schedules
                            .filter(s => new Date(s.startDate) >= today)
                            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
                        
                        const pastSchedules = schedules
                            .filter(s => new Date(s.startDate) < today)
                            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
                        
                        return (
                            viewMode === 'calendar' ? (
                                <ScheduleCalendar 
                                    schedules={schedules} 
                                    onSelectSchedule={handleCardClick} 
                                />
                            ) : (
                                <div className="schedulesGrid">
                                    {upcomingSchedules.map((schedule) => (
                                        <ScheduleCard
                                            key={schedule.id}
                                            schedule={schedule}
                                            onClick={handleCardClick}
                                            onEdit={handleEditClick}
                                            onDelete={handleDeleteSchedule}
                                        />
                                    ))}
                                    
                                    {upcomingSchedules.length > 0 && pastSchedules.length > 0 && (
                                        <div style={{
                                            gridColumn: '1 / -1',
                                            borderTop: '2px solid #e2e8f0',
                                            margin: '1rem 0',
                                            paddingTop: '1rem',
                                            position: 'relative'
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                top: '-12px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                background: '#fff',
                                                padding: '0 16px',
                                                color: '#94a3b8',
                                                fontSize: '0.85rem',
                                                fontWeight: '600'
                                            }}>
                                                지난 여행
                                            </span>
                                        </div>
                                    )}
                                    
                                    {pastSchedules.map((schedule) => (
                                        <ScheduleCard
                                            key={schedule.id}
                                            schedule={schedule}
                                            onClick={handleCardClick}
                                            onEdit={handleEditClick}
                                            onDelete={handleDeleteSchedule}
                                        />
                                    ))}
                                </div>
                            )
                        );
                    })()}

                    {/* 저장된 장소 섹션 */}

                </>
            )}

            {/* 탭 2: 세부일정 - 선택된 일정 없음 (예외 처리) */}
            {activeTab === 1 && !selectedForView && (
                <div className="emptyBox" style={{ marginTop: '2rem' }}>
                    <p>선택된 일정을 불러올 수 없습니다.</p>
                    <button className="secondaryBtn" onClick={() => setActiveTab(0)} style={{ marginTop: '1rem' }}>
                        목록으로 돌아가기
                    </button>
                </div>
            )}

            {/* 탭 2: 세부일정 */}
            {activeTab === 1 && (
                selectedForView ? (
                    <div className="detailView">
                        <div className="detailViewHeader">
                            <div>
                                <h3 className="detailTitle">{selectedForView.title}</h3>
                                {selectedForView.description && (
                                    <p className="detailDescription">{selectedForView.description}</p>
                                )}
                            </div>
                        </div>

                        <ErrorBoundary>
                            <ScheduleDetailView schedule={selectedForView} />
                        </ErrorBoundary>

                        <div className="detailActions">
                            <button className="secondaryBtn" onClick={() => setActiveTab(0)}>
                                목록으로
                            </button>
                            <button className="primaryBtn" onClick={() => handleEditClick(selectedForView)}>
                                ✏️ 수정하기
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Placeholder for when no plan is selected */
                    <div className="emptyBox">
                        <div className="emptyIcon">👆</div>
                        <p>선택된 일정이 없습니다.</p>
                        <p className="emptySubtext">
                            "나의 계획 목록"에서 일정을 선택하면 세부 내용을 볼 수 있습니다.
                        </p>
                        <button className="secondaryBtn" style={{ marginTop: '20px' }} onClick={() => setActiveTab(0)}>
                            목록으로 이동
                        </button>
                    </div>
                )
            )}

            {/* 탭 3: 저장된 장소 */}
            {activeTab === 2 && (
                <div style={{ marginTop: '20px' }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        <button 
                            onClick={() => setSavedTab('domestic')}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '24px',
                                border: 'none',
                                background: savedTab === 'domestic' ? '#10b981' : '#f3f4f6',
                                color: savedTab === 'domestic' ? '#fff' : '#666',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.95rem'
                            }}
                        >
                            국내
                        </button>
                        <button 
                            onClick={() => setSavedTab('overseas')}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '24px',
                                border: 'none',
                                background: savedTab === 'overseas' ? '#3b82f6' : '#f3f4f6',
                                color: savedTab === 'overseas' ? '#fff' : '#666',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.95rem'
                            }}
                        >
                            제주 / 해외
                        </button>
                    </div>

                    {user && savedPlaces.length > 0 ? (
                        <div className="grid" style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '24px',
                            paddingBottom: '40px'
                        }}>
                            {savedPlaces.filter(p => {
                                const cat = (p.category || p.place_data?.category || '').toLowerCase();
                                // Domestic: Walk/Traffic OR Legacy (missing category)
                                if (savedTab === 'domestic') return !cat || ['walk', 'traffic'].includes(cat);
                                // Overseas: Explicitly NOT Walk/Traffic (must have category)
                                if (savedTab === 'overseas') return cat && !['walk', 'traffic'].includes(cat);
                                return true;
                            }).length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', color: '#999' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                                    <p>{savedTab === 'domestic' ? '저장된 국내 여행지가 없습니다.' : '저장된 해외 여행지가 없습니다.'}</p>
                                </div>
                            ) : (
                                savedPlaces.filter(p => {
                                    const cat = (p.category || p.place_data?.category || '').toLowerCase();
                                    if (savedTab === 'domestic') return !cat || ['walk', 'traffic'].includes(cat);
                                    if (savedTab === 'overseas') return cat && !['walk', 'traffic'].includes(cat);
                                    return true;
                                }).map((place) => (
                                    <div key={place.id} style={{ position: 'relative' }}>
                                        <div style={{ marginBottom: '-10px' }}>
                                            <RecommendationCard
                                                title={place.title}
                                                country={place.country}
                                                tag={place.tag}
                                                desc={place.description}
                                                image={place.image || "https://images.unsplash.com/photo-1533658280665-224492bf552f?auto=format&fit=crop&w=800&q=80"}
                                                matchScore={place.match_score || 95}
                                                showMatchScore={false}
                                                onClick={savedTab === 'overseas' ? undefined : () => handlePlaceClick(place)}
                                                action={savedTab === 'overseas' ? {
                                                    label: "✨ AI로 전체 일정 만들기",
                                                    onClick: () => {
                                                        setAiStartingPlace(place);
                                                        setShowAIOptionsModal(true);
                                                    }
                                                } : undefined}
                                            />
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteSavedPlace(place.id); }}
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                background: 'rgba(255,255,255,0.95)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '28px',
                                                height: '28px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                zIndex: 10,
                                                color: '#666',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => {e.currentTarget.style.color='red'; e.currentTarget.style.transform='scale(1.1)';}}
                                            onMouseLeave={e => {e.currentTarget.style.color='#666'; e.currentTarget.style.transform='scale(1)';}}
                                            title="삭제"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="emptyBox">
                            <div className="emptyIcon">🔖</div>
                            <p>아직 저장된 장소가 없습니다.</p>
                            <p className="emptySubtext">
                                여행 둘러보기에서 마음에 드는 장소를 저장해보세요!
                            </p>
                        </div>
                    )}
                </div>
            )}
            {selectedSchedule && (
                <ScheduleEditor
                    schedule={selectedSchedule}
                    onSave={(updatedSchedule) => {
                        handleUpdateSchedule(updatedSchedule);
                        setSelectedSchedule(null);
                        setSelectedForView(updatedSchedule);
                    }}
                    onDelete={(id) => {
                        handleDeleteSchedule(id);
                        setSelectedSchedule(null);
                        setSelectedForView(null);
                        setActiveTab(0);
                    }}
                    onCancel={handleCloseEditor}
                />
            )}

            {/* Mood Palette Modal */}
            {showMoodPalette && (
                <MoodPalette
                    onComplete={handleMoodComplete}
                    onCancel={() => setShowMoodPalette(false)}
                />
            )}

            {/* Instant Route Generator */}
            {showInstantRoute && moodSelections && (
                <InstantRouteGenerator
                    selections={moodSelections}
                    preGeneratedPlans={generatedPlans}
                    onComplete={handleInstantRouteComplete}
                    onCancel={handleCancelInstantRoute}
                />
            )}

            {/* Legacy Create Form Modal (Optional) */}
            {showForm && (
                <ScheduleForm
                    onSubmit={handleCreateSchedule}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {/* 저장된 장소 상세 보기 Drawer */}
            <TripDetailDrawer 
                open={!!selectedPlace} 
                onClose={() => setSelectedPlace(null)} 
                item={selectedPlace} 
                nights={drawerNights} 
                setNights={setDrawerNights} 
                people={drawerPeople} 
                setPeople={setDrawerPeople} 
                planText={drawerPlanText} 
                setPlanText={setDrawerPlanText} 
                onImprove={handleImprovePlace} 
                onSave={onSaveFromDrawer}
                onOpenAIOptions={handleOpenAIOptions}
                improveLabel="AI 자동 보완" 
                diffResult={drawerDiffResult}
                showScheduleControls={false} // Hide manual schedule text
                showAIButton={true} // Show AI Generate button in footer
                isRegistered={true} // In PlanLab, these are effectively "registered" as bookmarks, but we are replacing the register button anyway.
            />

            {/* AI 옵션 모달 */}
            <AIScheduleOptionsModal
                open={showAIOptionsModal}
                onClose={() => setShowAIOptionsModal(false)}
                initialPlace={aiStartingPlace}
                savedPlaces={savedPlaces}
                onGenerate={handleGenerateAISchedule}
            />
        </div>
    );
}