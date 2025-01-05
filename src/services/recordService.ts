import * as fs from 'fs';
import * as path from 'path';
import { HeatmapData, PomodoroRecord } from '../types';

export class RecordService {
    private records: PomodoroRecord[] = [];
    private recordsPath: string;

    constructor(globalStoragePath: string) {
        this.recordsPath = path.join(globalStoragePath, 'pomodoroRecords.json');
        this.loadRecords();
    }

    public getRecords(): PomodoroRecord[] {
        return this.records;
    }

    public addRecord(record: PomodoroRecord) {
        this.records.push(record);
        this.saveRecords();
    }

    private loadRecords() {
        try {
            if (fs.existsSync(this.recordsPath)) {
                const data = fs.readFileSync(this.recordsPath, 'utf8');
                this.records = JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to load records:', error);
            this.records = [];
        }
    }

    private saveRecords() {
        try {
            fs.mkdirSync(path.dirname(this.recordsPath), { recursive: true });
            fs.writeFileSync(this.recordsPath, JSON.stringify(this.records, null, 2));
        } catch (error) {
            console.error('Failed to save records:', error);
        }
    }

    public processHeatmapData(): HeatmapData[] {
        const heatmap = initializeHeatmap(this.records);
        
        // 统计记录
        this.records.forEach(record => {
            if (heatmap.has(record.date)) {
                const data = heatmap.get(record.date)!;
                data.count += 1;
                data.minutes += record.duration;
            }
        });
    
        return Array.from(heatmap.values());
    }
}

function initializeHeatmap(records: PomodoroRecord[]): Map<string, HeatmapData> {
    const heatmap = new Map<string, HeatmapData>();
    
    // 获取日期范围
    const dates = Array.from(new Set(records.map(record => record.date)));
    
    // 计算起始周
    const startDate = new Date(Math.min(...dates.map(date => new Date(date).getTime())));
    const startWeek = Math.floor(startDate.getTime() / (7 * 24 * 60 * 60 * 1000));
    
    // 初始化每个日期的数据
    dates.forEach(date => {
        const currentDate = new Date(date);
        const week = Math.floor(currentDate.getTime() / (7 * 24 * 60 * 60 * 1000)) - startWeek;
        
        heatmap.set(date, { 
            date, 
            count: 0, 
            minutes: 0, 
            weekday: currentDate.getDay(),
            week
        });
    });
    
    return heatmap;
}