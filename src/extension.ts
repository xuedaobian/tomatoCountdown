import * as vscode from 'vscode';
import { PomodoroService } from './services/pomodoroService';
import { RecordService } from './services/recordService';
import { StatusBarManager } from './ui/statusBar';
import { getRecordsHtml } from './ui/webview';

export function activate(context: vscode.ExtensionContext) {
    // 初始化服务
    const statusBar = new StatusBarManager();
    const recordService = new RecordService(context.globalStoragePath);
    const pomodoroService = new PomodoroService(statusBar, recordService);

    // 显示状态栏
    statusBar.show();

    // 注册命令
    const commands = {
        'pomodoro.showMenu': async () => {
            const items = [
                { label: '开始新的番茄钟', command: 'pomodoro.start' },
                { label: '查看记录', command: 'pomodoro.showRecords' }
            ];

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: '选择操作'
            });

            if (selected) {
                vscode.commands.executeCommand(selected.command);
            }
        },

        'pomodoro.showRecords': () => {
            const panel = vscode.window.createWebviewPanel(
                'pomodoroRecords',
                '番茄钟记录',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            panel.webview.html = getRecordsHtml(recordService.getRecords());
        },

        'pomodoro.start': async () => {
            const input = await vscode.window.showInputBox({
                prompt: '请输入专注时长（分钟）',
                placeHolder: '25',
                validateInput: (value: string) => {
                    const num = parseInt(value);
                    return (isNaN(num) || num <= 0 || num > 180) 
                        ? '请输入1-180之间的数字' 
                        : null;
                }
            });

            if (input) {
                pomodoroService.start(parseInt(input) * 60);
            }
        },

        'pomodoro.pause': () => pomodoroService.pause(),
        'pomodoro.resume': () => pomodoroService.resume(),
        'pomodoro.stop': () => pomodoroService.stop()
    };

    // 注册所有命令
    Object.entries(commands).forEach(([command, handler]) => {
        context.subscriptions.push(
            vscode.commands.registerCommand(command, handler)
        );
    });

    // 添加状态栏到订阅列表
    context.subscriptions.push(statusBar);
}

export function deactivate() {}