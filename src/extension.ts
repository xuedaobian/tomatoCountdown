import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

interface PomodoroRecord {
    date: string;
    duration: number;
    startTime: string;
    endTime: string;
}

interface HeatmapData {
    date: string;
    count: number;
    minutes: number;
}

let timer: NodeJS.Timeout | undefined;
let statusBar: vscode.StatusBarItem | undefined;
let isPaused: boolean = false;
let remainingTime: number = 0;
let startDateTime: Date | undefined;
let records: PomodoroRecord[] = [];
let recordsPath: string;

export function activate(context: vscode.ExtensionContext) {
    recordsPath = path.join(context.globalStoragePath, 'pomodoroRecords.json');
    loadRecords();

    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = '🍅 Start Pomodoro';
    statusBar.command = 'pomodoro.showMenu';
    statusBar.show();

    // 注册命令
    const showMenuCommand = vscode.commands.registerCommand('pomodoro.showMenu', async () => {
        if (timer && !isPaused) {
            // 如果正在计时，则暂停
            vscode.commands.executeCommand('pomodoro.pause');
            return;
        }

        const items = [
            { label: '开始新的番茄钟', command: 'pomodoro.start' },
            { label: '查看记录', command: 'pomodoro.showRecords' }
        ];

        if (isPaused) {
            items.unshift({ label: '继续计时', command: 'pomodoro.resume' });
        }

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: '选择操作'
        });

        if (selected) {
            vscode.commands.executeCommand(selected.command);
        }
    });

    const showRecordsCommand = vscode.commands.registerCommand('pomodoro.showRecords', () => {
        const panel = vscode.window.createWebviewPanel(
            'pomodoroRecords',
            '番茄钟记录',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getRecordsHtml(records);
    });

    const startCommand = vscode.commands.registerCommand('pomodoro.start', async () => {
        const input = await vscode.window.showInputBox({
            prompt: '请输入专注时长（分钟）',
            placeHolder: '25',
            validateInput: (value: string) => {
                const num = parseInt(value);
                if (isNaN(num) || num <= 0 || num > 180) {
                    return '请输入1-180之间的数字';
                }
                return null;
            }
        });

        if (input) {
            const minutes = parseInt(input);
            startPomodoro(minutes * 60);
        }
    });

    const pauseCommand = vscode.commands.registerCommand('pomodoro.pause', () => {
        if (timer && !isPaused) {
            clearInterval(timer);
            timer = undefined;
            isPaused = true;
            statusBar!.text = `⏸️ ${formatTime(remainingTime)}`;
            statusBar!.command = 'pomodoro.resume';
            vscode.window.showInformationMessage('计时已暂停！');
        }
    });

    const resumeCommand = vscode.commands.registerCommand('pomodoro.resume', () => {
        if (isPaused) {
            startTimer();
            isPaused = false;
            statusBar!.command = 'pomodoro.pause';
            vscode.window.showInformationMessage('计时已继续！');
        }
    });

    const stopCommand = vscode.commands.registerCommand('pomodoro.stop', () => {
        stopPomodoro();
    });

    context.subscriptions.push(showMenuCommand, showRecordsCommand, startCommand, stopCommand, pauseCommand, resumeCommand, statusBar);

    let disposable = vscode.commands.registerCommand('tomatocountdown.start', () => {
        // Create and show panel
        const panel = vscode.window.createWebviewPanel(
          'tomatoTimer',
          'Tomato Timer',
          vscode.ViewColumn.One,
          {
            enableScripts: true
          }
        );
    
        // Get path to webview bundle
        const webviewPath = path.join(context.extensionPath, 'dist', 'webview.js');
        const webviewUri = panel.webview.asWebviewUri(vscode.Uri.file(webviewPath));
    
        // Set webview content
        panel.webview.html = getWebviewContent(webviewUri);
    
        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
          message => {
            switch (message.command) {
              case 'alert':
                vscode.window.showInformationMessage(message.text);
                return;
            }
          },
          undefined,
          context.subscriptions
        );
      });
    
      context.subscriptions.push(disposable);
}

function startPomodoro(seconds: number) {
    if (timer) {
        vscode.window.showWarningMessage('已有计时在运行！');
        return;
    }

    remainingTime = seconds;
    isPaused = false;
    startDateTime = new Date();
    startTimer();
    vscode.window.showInformationMessage(`番茄钟开始！设定时间：${formatTime(remainingTime)}`);
}

function completePomodoro() {
    const endDateTime = new Date();
    if (startDateTime) {
        const record: PomodoroRecord = {
            date: startDateTime.toLocaleDateString(),
            duration: Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000 / 60),
            startTime: startDateTime.toLocaleTimeString(),
            endTime: endDateTime.toLocaleTimeString()
        };
        records.push(record);
        saveRecords();
    }
}

function startTimer() {
    statusBar!.text = `🍅 ${formatTime(remainingTime)}`;
    statusBar!.command = 'pomodoro.pause';

    timer = setInterval(() => {
        remainingTime--;
        statusBar!.text = `🍅 ${formatTime(remainingTime)}`;

        if (remainingTime <= 0) {
            clearInterval(timer);
            timer = undefined;
            statusBar!.text = '🍅 Time\'s Up!';
            statusBar!.command = 'pomodoro.showMenu';
            completePomodoro();
            vscode.window.showInformationMessage('时间到！休息一下吧！');
        }
    }, 1000);
}

function stopPomodoro() {
    if (timer || isPaused) {
        clearInterval(timer);
        timer = undefined;
        isPaused = false;
        statusBar!.text = '🍅 Start Pomodoro';
        statusBar!.command = 'pomodoro.showMenu';
        vscode.window.showInformationMessage('已停止计时！');
    } else {
        vscode.window.showWarningMessage('没有计时！');
    }
}

function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function loadRecords() {
    try {
        if (fs.existsSync(recordsPath)) {
            const data = fs.readFileSync(recordsPath, 'utf8');
            records = JSON.parse(data);
        }
    } catch (error) {
        console.error('Failed to load records:', error);
        records = [];
    }
}

function saveRecords() {
    try {
        fs.mkdirSync(path.dirname(recordsPath), { recursive: true });
        fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2));
    } catch (error) {
        console.error('Failed to save records:', error);
    }
}

function processHeatmapData(records: PomodoroRecord[]): HeatmapData[] {
    const heatmap: Map<string, HeatmapData> = new Map();
    
    // 获取过去90天的日期范围
    const today = new Date();
    const past90Days = Array.from({length: 90}, (_, i) => {
        const date = new Date();
        date.setDate(today.getDate() - i);
        return date.toLocaleDateString();
    }).reverse();

    // 初始化所有日期的数据
    past90Days.forEach(date => {
        heatmap.set(date, { date, count: 0, minutes: 0 });
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

function getRecordsHtml(records: PomodoroRecord[]): string {
    const heatmapData = processHeatmapData(records);
    const maxMinutes = Math.max(...heatmapData.map(d => d.minutes));
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
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
                    padding: 2rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.04);
                }

                .heatmap-title {
                    font-size: 1.2rem;
                    color: var(--system-secondary);
                    margin-bottom: 1rem;
                }

                .heatmap-grid {
                    display: grid;
                    grid-template-columns: repeat(13, 1fr);
                    gap: 3px;
                }

                .heatmap-day {
                    aspect-ratio: 1;
                    border-radius: 3px;
                    cursor: pointer;
                    transition: transform 0.1s ease;
                }

                .heatmap-day:hover {
                    transform: scale(1.2);
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
                <div class="heatmap-title">过去90天的专注记录</div>
                <div class="heatmap-grid">
                    ${heatmapData.map(day => {
                        const intensity = day.minutes / maxMinutes;
                        const alpha = intensity * 0.8 + 0.2;
                        return `
                            <div 
                                class="heatmap-day" 
                                style="background: rgba(0, 102, 204, ${alpha})"
                                data-date="${day.date}"
                                data-count="${day.count}"
                                data-minutes="${day.minutes}"
                            ></div>
                        `;
                    }).join('')}
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

function getWebviewContent(webviewUri: vscode.Uri) {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tomato Timer</title>
      </head>
      <body>
        <div id="root"></div>
        <script src="${webviewUri}"></script>
      </body>
      </html>`;
  }

export function deactivate() {
    if (timer) {
        clearInterval(timer);
    }
}