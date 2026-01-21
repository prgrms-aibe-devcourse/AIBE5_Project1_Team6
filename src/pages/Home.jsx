import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();

  return (
    <div className="centerPage">
      <section className="heroCard">
        <h1 className="heroTitle">당신만의 여행을 계획해보세요.</h1>

        <div className="heroButtons">
          <button className="heroBtn" onClick={() => nav("/walk")}>Walk</button>
          <button className="heroBtn" onClick={() => nav("/traffic")}>Traffic</button>
          <button className="heroBtn" onClick={() => nav("/airplane")}>Airplane</button>
        </div>
      </section>
    </div>
  );
}