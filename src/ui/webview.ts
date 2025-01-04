import { HeatmapData, PomodoroRecord } from '../types';

function processHeatmapData(records: PomodoroRecord[]): HeatmapData[] {
    const heatmap: Map<string, HeatmapData> = new Map();
    
    // 获取过去35天的日期范围（5周）
    const today = new Date();
    const past35Days = Array.from({length: 35}, (_, i) => {
        const date = new Date();
        date.setDate(today.getDate() - i);
        return date;
    }).reverse();

    // 初始化所有日期的数据
    past35Days.forEach(date => {
        heatmap.set(date.toLocaleDateString(), { 
            date: date.toLocaleDateString(),
            weekday: date.getDay(),
            count: 0, 
            minutes: 0 
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
            <style>
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
                    padding: 1rem 1.5rem;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.04);
                    max-width: 320px;
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
                    font-size: 0.6rem;
                    color: var(--system-secondary);
                    align-items: center;
                }

                .heatmap-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    grid-template-rows: repeat(7, 1fr);
                    gap: 3px;
                }

                .heatmap-day {
                    aspect-ratio: 1;
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
            </style>
        </head>
        <body>
            <h2>专注记录</h2>
            <div class="heatmap-container">
                <div class="heatmap-title">过去5周的专注记录</div>
                <div class="heatmap-wrapper">
                    <div class="weekday-labels">
                        <div>日</div>
                        <div>一</div>
                        <div>二</div>
                        <div>三</div>
                        <div>四</div>
                        <div>五</div>
                        <div>六</div>
                    </div>
                    <div class="heatmap-grid">
                        ${heatmapData.map(day => {
                            const intensity = day.minutes / maxMinutes;
                            const alpha = intensity * 0.8 + 0.2;
                            return `
                                <div 
                                    class="heatmap-day" 
                                    style="background: rgba(0, 102, 204, ${alpha}); grid-row: ${day.weekday + 1}"
                                    data-date="${day.date}"
                                    data-count="${day.count}"
                                    data-minutes="${day.minutes}"
                                ></div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
            <div class="tooltip"></div>

            <div class="stats-container">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${records.length}</div>
                        <div class="stat-label">总专注次数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${records.reduce((acc, cur) => acc + cur.duration, 0)}</div>
                        <div class="stat-label">总专注分钟</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${records.length ? Math.round(records.reduce((acc, cur) => acc + cur.duration, 0) / records.length) : 0}</div>
                        <div class="stat-label">平均专注时长(分钟)</div>
                    </div>
                </div>
            </div>
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

            <script>
                // 原有的tooltip代码
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
            </script>
        </body>
        </html>
    `;
}