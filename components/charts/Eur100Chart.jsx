import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function Eur100Chart({ charges }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!charges || charges.length === 0) return;

    const ctx = canvasRef.current.getContext("2d");

    if (chartRef.current) chartRef.current.destroy();

    const labels = charges.map(c =>
      new Date(c.date).toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit"
      })
    ).reverse();

    const eur100km = charges.map(c => {
      if (!c.km_since_last || c.km_since_last <= 0) return null;
      return ((c.cost / c.km_since_last) * 100).toFixed(2);
    }).reverse();

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "€/100 km",
          data: eur100km,
          borderColor: "#fbbf24",
          backgroundColor: "rgba(251,191,36,0.2)",
          tension: 0.3
        }]
      },
      options: {
        scales: {
          x: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.2)" } },
          y: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.2)" } }
        }
      }
    });

    return () => chartRef.current?.destroy();
  }, [charges]);

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <h3 className="text-slate-300 text-sm mb-2">🪙 €/100 km</h3>
      <canvas ref={canvasRef} className="w-full h-48 bg-slate-800 rounded" />
    </div>
  );
}
