import "../styles/diff.css";

export default function ScheduleDiff({ original, modified, onClose }) {
    const renderDiff = (label, oldValue, newValue) => {
        const hasChanged = oldValue !== newValue;

        if (!hasChanged && !oldValue && !newValue) return null;

        return (
            <div className="diffRow">
                <div className="diffLabel">{label}</div>
                <div className="diffComparison">
                    <div className={hasChanged ? "diffValue old" : "diffValue same"}>
                        {oldValue || <span className="emptyValue">없음</span>}
                    </div>
                    <div className="diffArrow">
                        {hasChanged ? "→" : "="}
                    </div>
                    <div className={hasChanged ? "diffValue new" : "diffValue same"}>
                        {newValue || <span className="emptyValue">없음</span>}
                    </div>
                </div>
            </div>
        );
    };

    const getDiffCount = () => {
        let changes = 0;
        const fields = ['title', 'description', 'startDate', 'endDate', 'people', 'scheduleText'];
        fields.forEach(field => {
            if (original[field] !== modified[field]) changes++;
        });
        return changes;
    };

    const changeCount = getDiffCount();

    return (
        <div className="diffOverlay" onClick={onClose}>
            <div className="diffModal" onClick={(e) => e.stopPropagation()}>
                <div className="diffHeader">
                    <div>
                        <h2 className="diffTitle">📊 변경사항 미리보기</h2>
                        <p className="diffSubtitle">
                            {changeCount > 0
                                ? `총 ${changeCount}개 항목이 변경되었습니다.`
                                : "변경된 항목이 없습니다."
                            }
                        </p>
                    </div>
                    <button className="diffCloseBtn" onClick={onClose}>✕</button>
                </div>

                <div className="diffContent">
                    <div className="diffLegend">
                        <div className="legendItem">
                            <span className="legendColor old"></span>
                            <span>변경 전</span>
                        </div>
                        <div className="legendItem">
                            <span className="legendColor new"></span>
                            <span>변경 후</span>
                        </div>
                        <div className="legendItem">
                            <span className="legendColor same"></span>
                            <span>변경 없음</span>
                        </div>
                    </div>

                    <div className="diffFields">
                        {renderDiff("여행 제목", original.title, modified.title)}
                        {renderDiff("설명", original.description, modified.description)}
                        {renderDiff("시작 날짜", original.startDate, modified.startDate)}
                        {renderDiff("종료 날짜", original.endDate, modified.endDate)}
                        {renderDiff("인원", original.people?.toString(), modified.people?.toString())}

                        {/* Schedule Text Diff */}
                        <div className="diffRow fullWidth">
                            <div className="diffLabel">일정 세부사항</div>
                            <div className="diffTextComparison">
                                <div className="diffTextBlock">
                                    <div className="diffTextHeader">변경 전</div>
                                    <pre className={original.scheduleText !== modified.scheduleText ? "diffTextContent old" : "diffTextContent same"}>
                                        {original.scheduleText || "작성된 일정이 없습니다."}
                                    </pre>
                                </div>
                                <div className="diffTextBlock">
                                    <div className="diffTextHeader">변경 후</div>
                                    <pre className={original.scheduleText !== modified.scheduleText ? "diffTextContent new" : "diffTextContent same"}>
                                        {modified.scheduleText || "작성된 일정이 없습니다."}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="diffFooter">
                    <button className="diffConfirmBtn" onClick={onClose}>
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}
