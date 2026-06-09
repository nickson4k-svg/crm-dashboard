import { getClients } from './store.js';

function escapeText(str) {
  if (typeof window.escapeText === 'function') return window.escapeText(str);
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/'/g, '&#039;');
}

function formatUSD(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function renderAnalyticsChart() {
  const clients = getClients();
  const canvas = document.getElementById("analyticsChart");

  const textColor = getComputedStyle(document.body).getPropertyValue('--text').trim() || '#E6EDF3';

  if (canvas && typeof window.Chart !== "undefined") {
    if (window.analyticsChartInstance && typeof window.analyticsChartInstance.destroy === "function") {
      window.analyticsChartInstance.destroy();
      window.analyticsChartInstance = null;
    }

    const statuses = ["Lead", "Nurturing", "Demo", "Won", "Lost"];
    const colors = {
      Lead: "#7C4DFF",
      Nurturing: "#F59E0B",
      Demo: "#3B82F6",
      Won: "#22C55E",
      Lost: "#EF4444",
    };

    const totalByStatus = statuses.map((st) => {
      return clients.reduce((sum, c) => {
        if (c?.status !== st) return sum;
        const v = Number(c?.totalValue);
        return sum + (Number.isFinite(v) ? v : 0);
      }, 0);
    });

    const backgroundColor = statuses.map((st) => colors[st]);

    const chart = new window.Chart(canvas, {
      type: "doughnut",
      data: {
        labels: statuses,
        datasets: [
          {
            data: totalByStatus,
            backgroundColor,
            borderColor: "#121821",
            borderWidth: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: textColor,
            },
          },
        },
      },
    });

    window.analyticsChartInstance = chart;
  }

  const funnelCanvas = document.getElementById("funnelChart");
  if (funnelCanvas && typeof window.Chart !== "undefined") {
    if (window.funnelChartInstance && typeof window.funnelChartInstance.destroy === "function") {
      window.funnelChartInstance.destroy();
      window.funnelChartInstance = null;
    }

    const leadCount = clients.filter(c => c.status !== 'Lost').length;
    const nurturingCount = clients.filter(c => ['Nurturing', 'Demo', 'Won'].includes(c.status)).length;
    const demoCount = clients.filter(c => ['Demo', 'Won'].includes(c.status)).length;
    const wonCount = clients.filter(c => c.status === 'Won').length;

    const dataPoints = [leadCount, nurturingCount, demoCount, wonCount];

    const funnelChart = new window.Chart(funnelCanvas, {
      type: "bar",
      data: {
        labels: ["Lead", "Nurturing", "Demo", "Won"],
        datasets: [
          {
            label: "Конверсія (к-сть)",
            data: dataPoints,
            backgroundColor: ["#7C4DFF", "#F59E0B", "#3B82F6", "#22C55E"],
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 40,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { display: false },
          y: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 14, weight: 'bold' } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.parsed.x;
                const percent = leadCount > 0 ? Math.round((val / leadCount) * 100) : 0;
                return ` ${val} клієнтів (${percent}% від загальної кількості лідів)`;
              }
            }
          }
        },
      },
    });

    window.funnelChartInstance = funnelChart;
  }

  const generateBtn = document.getElementById("generateAiBtn");
  const aiContent = document.getElementById("aiInsightsContent");
  if (!generateBtn || !aiContent) return;

  if (!generateBtn.__aiWired) {
    generateBtn.__aiWired = true;

    generateBtn.addEventListener("click", async () => {
      const btn = generateBtn;
      btn.disabled = true;
      btn.dataset.busy = "1";
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Аналізую воронку...`;

      aiContent.innerHTML = `
        <div style="padding: 14px 0;">
          <div style="color: var(--text); font-weight: 900; margin-bottom: 8px;">Analyzing with AI...</div>
          <div style="height: 10px; background: rgba(230,237,243,0.10); border-radius: 999px; overflow: hidden; margin-bottom: 10px;">
            <div style="height:100%; width:45%; background: rgba(124,77,255,0.75); animation: ai-skel 1.1s ease-in-out infinite;"></div>
          </div>
          <div style="height: 10px; background: rgba(230,237,243,0.10); border-radius: 999px; overflow: hidden; margin-bottom: 10px;">
            <div style="height:100%; width:70%; background: rgba(124,77,255,0.50); animation: ai-skel 1.1s ease-in-out infinite; animation-delay: 0.15s;"></div>
          </div>
          <div style="height: 10px; background: rgba(230,237,243,0.10); border-radius: 999px; overflow: hidden;">
            <div style="height:100%; width:55%; background: rgba(124,77,255,0.35); animation: ai-skel 1.1s ease-in-out infinite; animation-delay: 0.3s;"></div>
          </div>
        </div>
        <style>
          @keyframes ai-skel { 0% { transform: translateX(-20%); } 50% { transform: translateX(20%); } 100% { transform: translateX(-20%); } }
        </style>
      `;

      try {
        const actualTotal = getClients()
          .filter(c => c.status === "Won") 
          .reduce((sum, c) => sum + (Number(c.totalValue) || 0), 0);

        const response = await fetch("/api/forecast", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            clients: getClients()
          })
        });

        if (!response.ok) {
          throw new Error(`AI request failed: ${response.status}`);
        }
            
        const aiResult = await response.json();

        const insightText = String(aiResult?.insight ?? "");
        const expectedRevenue = Number(aiResult?.expectedTotal);

        const safeExpected = Number.isFinite(expectedRevenue) ? expectedRevenue : actualTotal * 1.2;

        aiContent.innerHTML = `
          <div style="font-weight: 900; font-size: 14px; margin-bottom: 10px;">Smart Insight</div>
          <div style="color: var(--text); opacity: 0.95; margin-bottom: 14px; line-height: 1.4; font-size: 14px;">
            ${escapeText(insightText)}
          </div>
          <div style="height: 220px;">
            <canvas id="aiRevenueBarChart"></canvas>
          </div>
        `;

        if (typeof window.Chart !== "undefined") {
          const barCanvas = document.getElementById("aiRevenueBarChart");
          if (barCanvas) {
            if (window.aiRevenueBarChartInstance && typeof window.aiRevenueBarChartInstance.destroy === "function") {
              window.aiRevenueBarChartInstance.destroy();
            }

            window.aiRevenueBarChartInstance = new window.Chart(barCanvas, {
              type: "bar",
              data: {
                labels: ["Expected vs Actual Revenue"],
                datasets: [
                  {
                    label: "Actual Revenue",
                    data: [actualTotal],
                    backgroundColor: "rgba(59,130,246,0.75)",
                    borderColor: "#3B82F6",
                    borderWidth: 1,
                  },
                  {
                    label: "Expected Revenue",
                    data: [safeExpected],
                    backgroundColor: "rgba(245,158,11,0.70)",
                    borderColor: "#F59E0B",
                    borderWidth: 1,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { ticks: { color: textColor } },
                  y: { ticks: { color: textColor } }
                },
                plugins: {
                  legend: {
                    labels: { color: textColor }
                  }
                }
              },
            });
          }
        }
      } catch (err) {
        console.error(err);
        const msg = err && err.message ? String(err.message) : String(err);
        aiContent.innerHTML = `
          <div style="font-weight: 900; font-size: 14px; margin-bottom: 10px;">AI Error</div>
          <div style="color: var(--text); opacity: 0.95; font-size: 14px; white-space: pre-wrap;">Failed to analyze pipeline.\n${escapeText(msg)}</div>
        `;
      } finally {
        btn.disabled = false;
        btn.dataset.busy = "";
        btn.innerHTML = "<i class=\"fa-solid fa-wand-magic-sparkles\"></i> Generate AI Forecast";
      }
    });
  }
}
