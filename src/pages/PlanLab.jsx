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
import {
    loadSchedules,
    addSchedule,
    updateSchedule,
    removeSchedule,
    clearSchedules,
} from "../services/schedulesStorage";
import "../styles/schedules.css";

export default function PlanLab() {
    const queryClient = useQueryClient();
    const location = useLocation();

    // ... existing states ...
    const [showForm, setShowForm] = useState(false);
    const [showMoodPalette, setShowMoodPalette] = useState(false);
    const [showInstantRoute, setShowInstantRoute] = useState(false);
    const [moodSelections, setMoodSelections] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState(0); // 0: 목록, 1: 세부일정, 2: 수정
    const [selectedForView, setSelectedForView] = useState(null);

    // Load schedules
    const { data: schedules = [], isLoading } = useQuery({
        queryKey: ["schedules"],
        queryFn: loadSchedules,
    });

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
            toast.success("일정이 생성되었습니다!");
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
            toast.success("일정이 수정되었습니다!");
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
            toast.success("일정이 삭제되었습니다.");
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

    const handleClearAll = () => {
        setShowClearConfirm(true);
    };

    const confirmClearAll = async () => {
        setShowClearConfirm(false);
        await clearSchedules();
        queryClient.invalidateQueries(["schedules"]);
        toast.success("모든 일정이 삭제되었습니다.");
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
                    className={activeTab === 1 ? "tabBtn active" : "tabBtn"}
                    onClick={() => setActiveTab(1)}
                    disabled={!selectedForView}
                >
                    계획 세부일정
                </button>
            </div>

            {/* 탭 1: 목록 */}
            {activeTab === 0 && (
                <>
                    {schedules.length > 0 && (
                        <div className="planlabActions">
                            <button className="clearBtn" onClick={handleClearAll}>
                                전체 삭제 (Local Only)
                            </button>
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
            {activeTab === 1 && selectedForView && (
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

            <ConfirmModal
                open={showClearConfirm}
                title="전체 삭제"
                message={`정말 모든 일정을 삭제하시겠습니까?

이 작업은 되돌릴 수 없습니다.
(로컬 저장소만 지원)`}
                confirmText="삭제"
                cancelText="취소"
                variant="danger"
                onConfirm={confirmClearAll}
                onCancel={() => setShowClearConfirm(false)}
            />
        </div>
    );
}
