import type { Task } from "./Tasks";

export interface Project {
  id: number;
  name: string;
  priority: string;
  endDate: string;
  backtech: string;
  fronttech: string;
  cloudTech: string;
  sprintsQuantity: number;
  tasks: Task[];
}