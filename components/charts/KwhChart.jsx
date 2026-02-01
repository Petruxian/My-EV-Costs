import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function KwhChart({ charges }) {
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

    const kwh = charges.map(c => parseFloat(c.kwh_added)).reverse();

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "kWh aggiunti",
          data: kwh,
          backgroundColor: "rgba(6,182,212,0.5)"
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
      <h3 className="text-slate-300 text-sm mb-2">⚡ kWh per ricarica</h3>
      <canvas ref={canvasRef} className="w-full h-48 bg-slate-800 rounded" />
    </div>
  );
}
