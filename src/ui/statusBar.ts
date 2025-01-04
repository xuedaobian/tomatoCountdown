import * as vscode from 'vscode';
import { formatTime } from '../utils/timeUtils';

export class StatusBarManager {
    private statusBar: vscode.StatusBarItem;

    constructor() {
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.reset();
    }

    public updateTime(time: number) {
        this.statusBar.text = `🍅 ${formatTime(time)}`;
    }

    public setPaused() {
        this.statusBar.text = `⏸️ ${this.statusBar.text.slice(2)}`;
        this.statusBar.command = 'pomodoro.resume';
    }

    public reset() {
        this.statusBar.text = '🍅 Start Pomodoro';
        this.statusBar.command = 'pomodoro.showMenu';
    }

    public show() {
        this.statusBar.show();
    }

    public dispose() {
        this.statusBar.dispose();
    }
}