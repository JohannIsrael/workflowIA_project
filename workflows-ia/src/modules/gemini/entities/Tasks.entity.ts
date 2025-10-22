import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn, 
    ManyToOne
} from "typeorm";
import { Projects } from "./Projects.entity";

@Entity("tasks")
export class Tasks {
   
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column("character varying", { name: 'name', length: 255 })
    name:string;

    @Column("character varying", { name: 'description', nullable: true, length: 255 })
    description: string | null;

    @Column("character varying", { name: 'assignedTo', nullable: true, length: 255 })
    assignedTo: string | null;

    @Column("integer", { name: 'sprint', nullable: true })
    sprint: number;
 
    @ManyToOne(() => Projects, (project) => project.id)
    project: Projects;
}