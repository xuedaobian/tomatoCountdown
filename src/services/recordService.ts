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
          heatmap.set(date, { date, count: 0, minutes: 0, weekday: new Date(date).getDay() });
      });
  
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