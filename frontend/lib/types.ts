export type User = {
  id: string;
  name: string;
  email: string;
};

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
};

export type TimeEntry = {
  id: string;
  startTime: string;
  endTime: string;
  task: Task;
};

export type ReportSummary = {
  weekHours: number;
  todayHours: number;
};
