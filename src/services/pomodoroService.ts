import * as vscode from 'vscode';
import { StatusBarManager } from '../ui/statusBar';
import { RecordService } from './recordService';

export class PomodoroService {
    private timer?: NodeJS.Timeout;
    private isPaused: boolean = false;
    private remainingTime: number = 0;
    private startDateTime?: Date;

    constructor(
        private statusBar: StatusBarManager,
        private recordService: RecordService
    ) {}

    public start(seconds: number): void {
        if (this.timer) {
            vscode.window.showWarningMessage('已有计时在运行！');
            return;
        }

        this.remainingTime = seconds;
        this.isPaused = false;
        this.startDateTime = new Date();
        this.startTimer();
        vscode.window.showInformationMessage(`番茄钟开始！设定时间：${seconds / 60}分钟`);
    }

    public pause(): void {
        if (this.timer && !this.isPaused) {
            clearInterval(this.timer);
            this.timer = undefined;
            this.isPaused = true;
            this.statusBar.setPaused();
            vscode.window.showInformationMessage('计时已暂停！');
        }
    }

    public resume(): void {
        if (this.isPaused) {
            this.startTimer();
            this.isPaused = false;
            vscode.window.showInformationMessage('计时已继续！');
        }
    }

    public stop(): void {
        if (this.timer || this.isPaused) {
            clearInterval(this.timer);
            this.timer = undefined;
            this.isPaused = false;
            this.statusBar.reset();
            vscode.window.showInformationMessage('已停止计时！');
        }
    }

    private startTimer(): void {
        this.statusBar.updateTime(this.remainingTime);
        
        this.timer = setInterval(() => {
            this.remainingTime--;
            this.statusBar.updateTime(this.remainingTime);

            if (this.remainingTime <= 0) {
                this.completePomodoro();
            }
        }, 1000);
    }

    private completePomodoro(): void {
        clearInterval(this.timer);
        this.timer = undefined;
        this.statusBar.reset();
        
        const endDateTime = new Date();
        if (this.startDateTime) {
            const record = {
                date: this.startDateTime.toLocaleDateString(),
                duration: Math.floor((endDateTime.getTime() - this.startDateTime.getTime()) / 1000 / 60),
                startTime: this.startDateTime.toLocaleTimeString(),
                endTime: endDateTime.toLocaleTimeString()
            };
            this.recordService.addRecord(record);
        }
        
        vscode.window.showInformationMessage('时间到！休息一下吧！');
    }
}