export interface HeatmapData {
    date: string;
    weekday: number;
    count: number;
    minutes: number;
    week: number;  // 添加周数属性用于定位
}

export interface PomodoroRecord {
    date: string;          // 日期，格式：YYYY/MM/DD
    startTime: string;     // 开始时间，格式：HH:mm:ss
    endTime: string;       // 结束时间，格式：HH:mm:ss
    duration: number;      // 专注时长（分钟）
}
