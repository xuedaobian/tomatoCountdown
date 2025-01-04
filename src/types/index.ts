export interface PomodoroRecord {
    date: string;
    duration: number;
    startTime: string;
    endTime: string;
}

export interface HeatmapData {
    date: string;
    count: number;
    minutes: number;
    weekday: number;
}