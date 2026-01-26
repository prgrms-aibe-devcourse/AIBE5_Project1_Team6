# ConfirmModal 컴포넌트 사용 가이드

## 개요

`ConfirmModal`은 브라우저 기본 `confirm()`을 대체하는 재사용 가능한 확인 모달 컴포넌트입니다.

---

## 설치 / Import

```javascript
import ConfirmModal from "../components/ConfirmModal";
import { useState } from "react";
```

---

## Props 목록

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `open` | `boolean` | ✅ | - | 모달 표시 여부 |
| `title` | `string` | ❌ | `"확인"` | 모달 제목 |
| `message` | `string` | ✅ | - | 확인 메시지 내용 |
| `confirmText` | `string` | ❌ | `"확인"` | 확인 버튼 텍스트 |
| `cancelText` | `string` | ❌ | `"취소"` | 취소 버튼 텍스트 |
| `variant` | `"default"` \| `"danger"` | ❌ | `"default"` | 버튼 스타일 (일반/위험) |
| `onConfirm` | `function` | ✅ | - | 확인 버튼 클릭 시 실행될 함수 |
| `onCancel` | `function` | ✅ | - | 취소 버튼 클릭 시 실행될 함수 |

---

## 기본 사용법

### 1. State 선언

```javascript
const [showConfirm, setShowConfirm] = useState(false);
```

### 2. 모달 열기/닫기 함수

```javascript
// 모달 열기
const handleDelete = () => {
  setShowConfirm(true);
};

// 확인 시
const confirmDelete = () => {
  setShowConfirm(false);
  // 실제 삭제 로직
  deleteItem();
};

// 취소 시
const cancelDelete = () => {
  setShowConfirm(false);
};
```

### 3. JSX에 컴포넌트 추가

```javascript
<>
  <button onClick={handleDelete}>삭제</button>

  <ConfirmModal
    open={showConfirm}
    title="삭제 확인"
    message="정말 삭제하시겠습니까?"
    confirmText="삭제"
    cancelText="취소"
    variant="danger"
    onConfirm={confirmDelete}
    onCancel={cancelDelete}
  />
</>
```

---

## 사용 예시

### 예시 1: 일반 확인 모달 (기본 스타일)

```javascript
import { useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";

function MyComponent() {
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const handleSave = () => {
    setShowSaveConfirm(true);
  };

  const confirmSave = () => {
    setShowSaveConfirm(false);
    // 저장 로직
    saveData();
    toast.success("저장되었습니다!");
  };

  return (
    <>
      <button onClick={handleSave}>저장</button>

      <ConfirmModal
        open={showSaveConfirm}
        title="저장 확인"
        message="변경사항을 저장하시겠습니까?"
        confirmText="저장"
        cancelText="취소"
        variant="default"
        onConfirm={confirmSave}
        onCancel={() => setShowSaveConfirm(false)}
      />
    </>
  );
}
```

### 예시 2: 위험한 작업 모달 (danger 스타일)

```javascript
import { useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import { useMutation } from "@tanstack/react-query";

function DeleteButton({ itemId }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteItem(id),
    onSuccess: () => {
      toast.success("삭제되었습니다.");
    },
  });

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    deleteMutation.mutate(itemId);
  };

  return (
    <>
      <button className="dangerBtn" onClick={handleDelete}>
        삭제
      </button>

      <ConfirmModal
        open={showDeleteConfirm}
        title="삭제 확인"
        message="정말 이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
```

### 예시 3: 로그아웃 확인

```javascript
import { useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import { supabase } from "../services/supabase";

function LogoutButton() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await supabase.auth.signOut();
    toast.success("로그아웃되었습니다.");
  };

  return (
    <>
      <button onClick={handleLogout}>로그아웃</button>

      <ConfirmModal
        open={showLogoutConfirm}
        title="로그아웃"
        message="정말 로그아웃하시겠습니까?"
        confirmText="로그아웃"
        cancelText="취소"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
```

---

## Variant 스타일

### `variant="default"` (기본)
- 보라색 그라데이션 확인 버튼
- 일반적인 작업에 사용
- 예: 저장, 제출, 적용 등

### `variant="danger"` (위험)
- 빨간색 그라데이션 확인 버튼
- 위험한/되돌릴 수 없는 작업에 사용
- 예: 삭제, 초기화, 로그아웃 등

---

## 주의사항

1. **State 관리**: 모달 표시 여부를 위해 반드시 `useState`로 state를 관리해야 합니다.
   ```javascript
   const [showModal, setShowModal] = useState(false);
   ```

2. **함수 호출 시 모달 닫기**: `onConfirm`이나 `onCancel`에서 반드시 모달을 닫아야 합니다.
   ```javascript
   const confirmAction = () => {
     setShowModal(false); // 모달 닫기
     // 실제 작업 수행
   };
   ```

3. **화살표 함수 사용**: `onCancel`에서 간단히 모달만 닫을 경우 화살표 함수 사용 가능
   ```javascript
   onCancel={() => setShowModal(false)}
   ```

---

## 기존 코드 마이그레이션

### Before (browser confirm)
```javascript
const handleDelete = () => {
  if (confirm("정말 삭제하시겠습니까?")) {
    deleteItem();
  }
};
```

### After (ConfirmModal)
```javascript
// 1. State 추가
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

// 2. 함수 분리
const handleDelete = () => {
  setShowDeleteConfirm(true);
};

const confirmDelete = () => {
  setShowDeleteConfirm(false);
  deleteItem();
};

// 3. JSX에 모달 추가
<ConfirmModal
  open={showDeleteConfirm}
  title="삭제 확인"
  message="정말 삭제하시겠습니까?"
  variant="danger"
  onConfirm={confirmDelete}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

---

## 팀원과 공유하기

이 컴포넌트를 팀원들과 공유할 때는:

1. **이 README 파일**을 프로젝트 문서에 포함
2. **ConfirmModal.jsx**와 **modal.css** 파일이 프로젝트에 있는지 확인
3. 기존 `alert()`나 `confirm()` 사용 코드를 찾아서 이 컴포넌트로 교체

---

## 파일 위치

- 컴포넌트: `src/components/ConfirmModal.jsx`
- 스타일: `src/styles/modal.css`

---

## 질문이나 버그 리포트

문제가 있거나 개선 사항이 있으면 팀 채널에 공유해주세요! 🙌
