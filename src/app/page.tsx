// src/app/page.tsx
import PlanetScene from "./components/PlanetScene";

export default function HomePage() {
  return (
    <main className="sceneRoot">
      <PlanetScene />

      {/* Overlay UI */}
      <div className="sceneOverlay">
        <div className="sceneTitle">
          Deep Space | Planetary System Prototype
        </div>

        <div className="sceneBottomInfo">
          <div>
            <div>Camera: auto-orbit</div>
            <div>Scene: three.js + Next.js (TypeScript)</div>
          </div>
          <div className="sceneBadge">
            Real-time WebGL · Experimental UI
          </div>
        </div>
      </div>
    </main>
  );
}