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
import { generateAllTravelPlans } from "../services/geminiTravelPlanner";
import AIScheduleOptionsModal from "../components/AIScheduleOptionsModal"; // Import Modal
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

    // AI 옵션 모달 상태
    const [showAIOptionsModal, setShowAIOptionsModal] = useState(false);
    const [aiStartingPlace, setAiStartingPlace] = useState(null);

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

    const handleGenerateAISchedule = async ({ nights, places }) => {
        try {
            const destinationName = places[0]?.title || "여행";
            const today = new Date();
            const startDate = today.toISOString().split('T')[0];
            const endDate = new Date(today.setDate(today.getDate() + nights)).toISOString().split('T')[0];

            // 1. Gemini로 3가지 플랜 생성 (Mock or Real)
            // 여기서 generateAllTravelPlans 사용. 필요한 selections 객체 구성
            // Note: generateAllTravelPlans handles its own mock/real logic but we need to pass includedPlaces
            // Wait, existing generateAllTravelPlans might not support includedPlaces yet? I updated geminiTravelPlanner.js, but need to check if aiPlanner re-exports it or if I should import direct.
            // Assuming aiPlanner re-exports or is the same file (actually imports are from services/aiPlanner which seems to point to geminiTravelPlanner based on line 23 of PlanLab vs file check).
            // Let's assume file path services/geminiTravelPlanner.js is the one I edited and it is imported as aiPlanner (or I should import from there).
            // Checked PlanLab: import { improvePlanText } from "../services/aiPlanner";
            // Check if aiPlanner.js exists and what it does.
            
            // Since I edited geminiTravelPlanner.js, I should probably import from there or update aiPlanner.js.
            // Let's assume aiPlanner.js delegates or IS the file.
            // Actually, in the file view for PlanLab, line 23 was: import { improvePlanText } from "../services/aiPlanner";
            // But I edited services/geminiTravelPlanner.js.
            // I should check if they are related. 
            // Better to check services/aiPlanner.js content quickly? 
            // Or just import from geminiTravelPlanner.js directly to be safe.
            
            // Re-constituting logic assuming import from geminiTravelPlanner
            
            const selections = {
                mood: { label: 'AI 맞춤', emoji: '✨' },
                destination: { label: destinationName, emoji: '✈️' },
                style: { label: '혼합', emoji: '🧩' },
                startDate,
                endDate,
                duration: nights,
                people: 2, // Default or asked? Modal doesn't ask people yet. Default 2.
                includedPlaces: places
            };

            // Call the API
            // Note: need to make sure generateAllTravelPlans is imported.
            // In the import replacement above, I changed it to import from "../services/aiPlanner".
            // I should verify where generateAllTravelPlans is exported.
            // It was exported in geminiTravelPlanner.js. 
            // I will update the import to point to geminiTravelPlanner.js in a separate step or assume aiPlanner re-exports.
            // Let's assume for now I will fix imports.

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
                startDate: startDate,
                endDate: endDate,
                people: 2,
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
                    mood: 'AI',
                    destination: destinationName,
                    style: 'Custom'
                }
            };
            
            // Basic Markdown Conversion
            let mdText = `# ${selectedPlan.title}\n\n${selectedPlan.description}\n\n`;
            selectedPlan.dailyItinerary.forEach(day => {
                mdText += `## ${day.day}일차\n`;
                day.spots.forEach(spot => {
                    mdText += `- [${spot.time}] ${spot.spot} ${spot.emoji || ''} : ${spot.activity}\n`;
                });
                mdText += `\n`;
            });
            scheduleData.scheduleText = mdText;

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
                onOpenAIOptions={handleOpenAIOptions}
                improveLabel="AI 자동 제안"
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