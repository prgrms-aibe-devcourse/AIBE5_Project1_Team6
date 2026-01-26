import FunnelContainer from "../components/funnel/FunnelContainer";
import { useEffect } from "react";
import { useTripStore } from "../stores/tripStore";

export default function Home() {
  const { reset } = useTripStore();

  useEffect(() => {
    // 홈에 돌아오면 상태 초기화
    reset();
  }, [reset]);

  return (
    <div className="centerPage">
      <section className="heroCard">
         <FunnelContainer />
      </section>
    </div>
  );
}