import { useEffect } from "react";
import "../styles/modal.css";

export default function ConfirmModal({
    open,
    title = "확인",
    message,
    confirmText = "확인",
    cancelText = "취소",
    onConfirm,
    onCancel,
    variant = "default", // "default" | "danger"
}) {
    useEffect(() => {
        if (open) {
            // Prevent body scroll when modal is open
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open) return null;

    const handleConfirm = () => {
        onConfirm?.();
    };

    const handleCancel = () => {
        onCancel?.();
    };

    return (
        <div className="confirmModalOverlay" onClick={handleCancel}>
            <div className="confirmModalCard" onClick={(e) => e.stopPropagation()}>
                <div className="confirmModalHeader">
                    <h3 className="confirmModalTitle">{title}</h3>
                </div>

                <div className="confirmModalBody">
                    <p className="confirmModalMessage">{message}</p>
                </div>

                <div className="confirmModalFooter">
                    <button className="confirmModalBtnCancel" onClick={handleCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={variant === "danger" ? "confirmModalBtnDanger" : "confirmModalBtnConfirm"}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
