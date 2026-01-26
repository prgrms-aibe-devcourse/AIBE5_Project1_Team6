import React from "react";
import toast from "react-hot-toast";
import TravelErrorScreen from "./TravelErrorScreen";

/**
 * GlobalErrorBoundary
 * - 앱 전역에서 발생한 렌더링/라이프사이클 에러를 잡아
 *   "흰 화면" 대신 친절한 안내 화면을 보여줍니다.
 */
export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // 개발/운영 모두 콘솔에 남겨서 추적 가능하게
    console.error("[GlobalErrorBoundary] Caught error:", error, errorInfo);

    // 사용자에게는 '여행 감성'을 해치지 않는 선에서 부드럽게 안내
    toast.error("앗! 여행 경로가 잠시 꼬였어요. 안내 화면으로 이동할게요.");
  }

  handleReset(action = "home") {
    // 에러 상태를 초기화해서 다시 렌더링 시도
    this.setState({ error: null }, () => {
      if (typeof this.props.onReset === "function") {
        this.props.onReset(action);
        return;
      }

      // 기본 동작
      if (action === "back") {
        window.history.back();
        return;
      }
      if (action === "reload") {
        window.location.reload();
        return;
      }
      // home
      window.location.assign("/");
    });
  }

  render() {
    const { error } = this.state;

    if (error) {
      return <TravelErrorScreen error={error} onAction={this.handleReset} />;
    }

    return this.props.children;
  }
}
