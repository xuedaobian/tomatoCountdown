import { HeatmapData, PomodoroRecord } from '../types';

function processHeatmapData(records: PomodoroRecord[]): HeatmapData[] {
    const heatmap: Map<string, HeatmapData> = new Map();
    
    // 获取过去一年的日期范围（52周）
    const today = new Date();
    const past365Days = Array.from({length: 365}, (_, i) => {
        const date = new Date();
        date.setDate(today.getDate() - i);
        return date;
    }).reverse();

    // 计算起始周
    const startDate = past365Days[0];
    const startWeek = Math.floor(startDate.getTime() / (7 * 24 * 60 * 60 * 1000));

    // 初始化所有日期的数据
    past365Days.forEach(date => {
        const week = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000)) - startWeek;
        heatmap.set(date.toLocaleDateString(), { 
            date: date.toLocaleDateString(),
            weekday: date.getDay(),
            count: 0, 
            minutes: 0,
            week
        });
    });

    // 统计记录
    records.forEach(record => {
        if (heatmap.has(record.date)) {
            const data = heatmap.get(record.date)!;
            data.count += 1;
            data.minutes += record.duration;
        }
    });

    return Array.from(heatmap.values());
}

function getStyles(): string {
    return `
        :root {
            --system-gray: #f5f5f7;
            --system-text: #1d1d1f;
            --system-blue: #0066cc;
            --system-secondary: #86868b;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
            padding: 2rem;
            margin: 0;
            line-height: 1.47059;
            font-weight: 400;
            letter-spacing: -0.022em;
            background-color: white;
            color: var(--system-text);
        }

        h2 {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 2rem;
            color: var(--system-text);
        }

        .stats-container {
            background: var(--system-gray);
            border-radius: 18px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04);
        }

        .stat-number {
            font-size: 2rem;
            font-weight: 600;
            color: var(--system-blue);
            margin-bottom: 0.5rem;
        }

        .stat-label {
            color: var(--system-secondary);
            font-size: 0.9rem;
        }

        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04);
        }

        th {
            background: var(--system-gray);
            padding: 1rem;
            text-align: left;
            font-weight: 500;
            color: var(--system-secondary);
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        td {
            padding: 1rem;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            color: var(--system-text);
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover {
            background-color: var(--system-gray);
        }

        .heatmap-container {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04);
            width: 100%;
            max-width: 890px;
        }

        .heatmap-title {
            font-size: 0.85rem;
            color: var(--system-secondary);
            margin-bottom: 0.8rem;
        }

        .heatmap-wrapper {
            display: grid;
            grid-template-columns: 20px 1fr;
            gap: 8px;
        }

        .weekday-labels {
            display: grid;
            grid-template-rows: repeat(7, 1fr);
            font-size: 0.7rem;
            color: var(--system-secondary);
            align-items: center;
            gap: 3px;
            padding-top: 10px;
        }

        .month-labels {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            font-size: 0.7rem;
            color: var(--system-secondary);
            margin-bottom: 8px;
        }

        .heatmap-grid {
            display: grid;
            grid-template-columns: repeat(53, 1fr);
            grid-template-rows: repeat(7, 1fr);
            gap: 3px;
        }

        .heatmap-day {
            width: 12px;
            height: 12px;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .heatmap-day:hover {
            transform: scale(1.2);
            box-shadow: 0 0 4px rgba(0,0,0,0.1);
        }

        .tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0.5rem;
            border-radius: 6px;
            font-size: 0.8rem;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
        }
    `;
}

function generateHeatmapComponent(heatmapData: HeatmapData[], maxMinutes: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const getColor = (minutes: number): string => {
        const intensity = minutes / maxMinutes;
        if (minutes === 0) return '#f0f0f0';
        if (intensity <= 0.25) return '#9be9a8';
        if (intensity <= 0.5) return '#40c463';
        if (intensity <= 0.75) return '#30a14e';
        return '#216e39';
    };

    return `
        <div class="heatmap-container">
            <div class="heatmap-title">一年专注记录</div>
            <div class="month-labels">
                ${months.map(month => `<div>${month}</div>`).join('')}
            </div>
            <div class="heatmap-wrapper">
                <div class="weekday-labels">
                    ${weekdays.map(day => `<div>${day}</div>`).join('')}
                </div>
                <div class="heatmap-grid">
                    ${heatmapData.map(day => `
                        <div 
                            class="heatmap-day" 
                            style="background: ${getColor(day.minutes)}; grid-column: ${day.week + 1}; grid-row: ${day.weekday + 1}"
                            data-date="${day.date}"
                            data-count="${day.count}"
                            data-minutes="${day.minutes}"
                            title="${day.date}: ${day.minutes} minutes, ${day.count} sessions"
                        ></div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function generateStatsComponent(records: PomodoroRecord[]): string {
    const totalMinutes = records.reduce((acc, cur) => acc + cur.duration, 0);
    const avgMinutes = records.length ? Math.round(totalMinutes / records.length) : 0;

    return `
        <div class="stats-container">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${records.length}</div>
                    <div class="stat-label">总专注次数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalMinutes}</div>
                    <div class="stat-label">总专注分钟</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${avgMinutes}</div>
                    <div class="stat-label">平均专注时长(分钟)</div>
                </div>
            </div>
        </div>
    `;
}

function generateRecordsTable(records: PomodoroRecord[]): string {
    return `
        <table>
            <tr>
                <th>日期</th>
                <th>开始时间</th>
                <th>结束时间</th>
                <th>专注时长</th>
            </tr>
            ${records.map(record => `
                <tr>
                    <td>${record.date}</td>
                    <td>${record.startTime}</td>
                    <td>${record.endTime}</td>
                    <td>${record.duration} 分钟</td>
                </tr>
            `).join('')}
        </table>
    `;
}

function generateTooltipScript(): string {
    return `
        const tooltip = document.querySelector('.tooltip');
        document.querySelectorAll('.heatmap-day').forEach(day => {
            day.addEventListener('mousemove', (e) => {
                const date = day.dataset.date;
                const count = day.dataset.count;
                const minutes = day.dataset.minutes;
                
                tooltip.style.opacity = '1';
                tooltip.style.left = e.pageX + 10 + 'px';
                tooltip.style.top = e.pageY + 10 + 'px';
                tooltip.textContent = \`\${date}
专注次数: \${count}
专注时长: \${minutes}分钟\`;
            });

            day.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
            });
        });
    `;
}

export function getRecordsHtml(records: PomodoroRecord[]): string {
    const heatmapData = processHeatmapData(records);
    const maxMinutes = Math.max(...heatmapData.map(d => d.minutes));
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <script>
                const vscode = acquireVsCodeApi();
                console.log('VSCode API acquired');
            </script>
            <style>${getStyles()}</style>
        </head>
        <body>
            <h2>专注记录</h2>
            ${generateHeatmapComponent(heatmapData, maxMinutes)}
            <div class="tooltip"></div>
            ${generateStatsComponent(records)}
            ${generateRecordsTable(records)}
            <script>${generateTooltipScript()}</script>
        </body>
        </html>
    `;
}