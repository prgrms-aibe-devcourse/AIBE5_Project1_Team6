import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import ScheduleForm from "../components/ScheduleForm";
import ScheduleCard from "../components/ScheduleCard";
import ScheduleEditor from "../components/ScheduleEditor";
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
    const [showForm, setShowForm] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    // Load schedules
    const { data: schedules = [], isLoading } = useQuery({
        queryKey: ["schedules"],
        queryFn: loadSchedules,
    });

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
        },
        onError: (err) => {
            toast.error("삭제 실패: " + err.message);
        },
    });

    const handleCreateSchedule = (scheduleData) => {
        addMutation.mutate(scheduleData);
    };

    const handleUpdateSchedule = (scheduleData) => {
        updateMutation.mutate(scheduleData);
    };

    const handleDeleteSchedule = (id) => {
        deleteMutation.mutate(id);
    };

    const handleClearAll = async () => {
        if (!confirm("정말 모든 일정을 삭제하시겠습니까? (로컬만 지원)")) return;
        await clearSchedules();
        queryClient.invalidateQueries(["schedules"]);
        toast.success("모든 일정이 삭제되었습니다.");
    };

    return (
        <div className="pageWrap">
            <div className="planlabHeader">
                <div>
                    <h2 className="pageTitle">PlanLab · 일정 생성 & 관리</h2>
                    <p className="pageDesc">
                        새로운 여행 일정을 만들고 관리하세요. AI가 체크리스트와 팁을 추천해드립니다!
                    </p>
                </div>
                <button className="createBtn" onClick={() => setShowForm(true)}>
                    + 새 일정 만들기
                </button>
            </div>

            <div className="planlabActions">
                <button
                    className="refreshBtn"
                    onClick={() => queryClient.invalidateQueries(["schedules"])}
                >
                    🔄 새로고침
                </button>
                {schedules.length > 0 && (
                    <button className="clearBtn" onClick={handleClearAll}>
                        전체 삭제 (Local Only)
                    </button>
                )}
            </div>

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
                            onClick={() => setSelectedSchedule(schedule)}
                        />
                    ))}
                </div>
            )}

            {/* Create Form Modal */}
            {showForm && (
                <ScheduleForm
                    onSubmit={handleCreateSchedule}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {/* Edit Drawer */}
            <ScheduleEditor
                open={!!selectedSchedule}
                schedule={selectedSchedule}
                onClose={() => setSelectedSchedule(null)}
                onSave={handleUpdateSchedule}
                onDelete={handleDeleteSchedule}
            />
        </div>
    );
}
