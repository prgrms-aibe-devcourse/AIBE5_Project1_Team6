import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Walk from "./pages/Walk";
import Traffic from "./pages/Traffic";
import Airplane from "./pages/Airplane";
import Plans from "./pages/Plans";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/walk" element={<Walk />} />
        <Route path="/traffic" element={<Traffic />} />
        <Route path="/airplane" element={<Airplane />} />
        <Route path="/plans" element={<Plans />} />
      </Route>
    </Routes>
  );
}