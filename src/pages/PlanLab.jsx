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
import ErrorBoundary from "../components/ErrorBoundary";
import RecommendationCard from "../components/RecommendationCard";
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
import { simpleDiff } from "../services/diff";
import "../styles/schedules.css";
import { useAuthStore } from "../stores/authStore";

export default function PlanLab() {
    const queryClient = useQueryClient();
    const location = useLocation();
    const { user } = useAuthStore();

    // ... existing states ...
    const [showForm, setShowForm] = useState(false);
    const [showMoodPalette, setShowMoodPalette] = useState(false);
    const [showInstantRoute, setShowInstantRoute] = useState(false);
    const [moodSelections, setMoodSelections] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [activeTab, setActiveTab] = useState(0); // 0: 목록, 1: 세부일정, 2: 수정
    const [selectedForView, setSelectedForView] = useState(null);

    // 상세 보기 (Drawer) 관련 상태
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [drawerNights, setDrawerNights] = useState(1);
    const [drawerPeople, setDrawerPeople] = useState(2);
    const [drawerPlanText, setDrawerPlanText] = useState("");
    const [drawerDiffResult, setDrawerDiffResult] = useState(null);

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
    const { data: savedPlaces = [] } = useQuery({
        queryKey: ["savedPlaces", user?.id],
        queryFn: () => getSavedPlaces(user?.id),
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

    const handleMoodComplete = (selections) => {
        setMoodSelections(selections);
        setShowMoodPalette(false);
        setShowInstantRoute(true);
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
            savedPlaceId: place.id // 삭제를 위해 원본 ID 저장
        };
        
        setSelectedPlace(mergedItem);
        setDrawerNights(1);
        setDrawerPeople(2);
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
                people: payload.people || 2,
                scheduleText: payload.planText || "",
                items: payload.items || [],
                totalCost: payload.totalCost || 0,
                moodData: {
                    mood: 'refresh',
                    destination: payload.title,
                    style: 'relaxed'
                }
            };
            
            await addMutation.mutateAsync(scheduleData);

            // 핵심: '저장된 장소' -> '일정'으로 이동 (삭제 처리)
            if (selectedPlace?.savedPlaceId) {
                await deletePlace(selectedPlace.savedPlaceId);
                queryClient.invalidateQueries(["savedPlaces"]);
            }

            toast.success(`"${payload.title}" 일정이 상단 목록에 추가되었습니다!`);
            setSelectedPlace(null);
            setActiveTab(0); // 목록 탭으로 자동 이동
        } catch (e) {
            toast.error("일정 변환 실패: " + e.message);
        }
    };

    return (
        <div className="pageWrap">
            <div className="planlabHeader">
                <div>
                    <h2 className="pageTitle">Walk2Fly · 컵라면보다 빠른 1초 여행 계획 ✨</h2>
                    <p className="pageDesc">
                        계획 부담 제로! 그냥 느낌만 고르세요. AI가 1초 만에 완벽한 여행을 만들어드립니다.
                    </p>
                </div>
                <button className="createBtn" onClick={() => setShowMoodPalette(true)}>
                    ✨ 1초 만에 일정 만들기
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
            </div>

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
                    ) : (
                        <div className="schedulesGrid">
                            {schedules.map((schedule) => (
                                <ScheduleCard
                                    key={schedule.id}
                                    schedule={schedule}
                                    onClick={handleCardClick}
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteSchedule}
                                />
                            ))}
                        </div>
                    )}

                    {/* 저장된 장소 섹션 */}
                    {user && savedPlaces.length > 0 && (
                        <>
                            <div style={{ 
                                margin: '40px 0 24px', 
                                borderTop: '2px solid var(--border-color, #e5e7eb)',
                                paddingTop: '32px'
                            }}>
                                <h3 style={{ 
                                    fontSize: '1.3rem', 
                                    fontWeight: '700', 
                                    color: 'var(--text-main)',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    📍 저장된 장소
                                </h3>
                                <p style={{ 
                                    color: 'var(--text-sub)', 
                                    fontSize: '0.9rem',
                                    marginBottom: '20px'
                                }}>
                                    Walk/Traffic/Airplane에서 저장한 장소들
                                </p>
                            </div>
                            <div className="grid" style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                gap: '12px',
                                padding: '10px 4px 20px 4px'
                            }}>
                                {savedPlaces.map((place) => (
                                    <div key={place.id} style={{ 
                                        position: 'relative'
                                    }}>
                                        <div style={{ 
                                            transform: 'scale(0.85)', 
                                            transformOrigin: 'top left',
                                            width: '117.6%',
                                            marginBottom: '-15%'
                                        }}>
                                            <RecommendationCard
                                                title={place.title}
                                                country={place.country}
                                                tag={place.tag}
                                                desc={place.description}
                                                image={place.image || "https://images.unsplash.com/photo-1533658280665-224492bf552f?auto=format&fit=crop&w=800&q=80"}
                                                matchScore={place.match_score || 95}
                                                onClick={() => handlePlaceClick(place)}
                                            />
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteSavedPlace(place.id); }}
                                            style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '4px',
                                                background: 'rgba(255,255,255,0.92)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '22px',
                                                height: '22px',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                                zIndex: 10
                                            }}
                                            title="삭제"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
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

            {/* Schedule Editor Modal */}
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
                diffResult={drawerDiffResult}
                onImprove={handleImprovePlace}
                onSave={onSaveFromDrawer}
                improveLabel="AI 자동 제안"
            />
        </div>
    );
}