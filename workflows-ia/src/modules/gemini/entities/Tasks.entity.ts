import { 
  Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn
} from "typeorm";
import { Projects } from "./Projects.entity";

@Entity("tasks")
export class Tasks {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column("character varying", { name: 'name', length: 255 })
  name: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column("character varying", { name: 'assignedTo', nullable: true, length: 255 })
  assignedTo: string | null;

  @Column("integer", { name: 'sprint', nullable: true })
  sprint: number | null;

  @ManyToOne(() => Projects, (project) => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' }) // usa la FK existente en tu tabla
  project: Projects;
}
