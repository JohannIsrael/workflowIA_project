
import { 
    Column, 
    Entity, 
    OneToMany, 
    PrimaryGeneratedColumn 
} from "typeorm";
import { Tasks } from "./Tasks.entity";

@Entity("projects")
export class Projects {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column("character varying", { name: 'name', length: 255 })
    name: string;

    @Column("character varying", { name: 'priority', nullable: true, length: 255 })
    priority: string | null;

    @Column("character varying", { name: 'backtech', nullable: true, length: 255 })
    backtech: string | null;

    @Column("character varying", { name: 'fronttech', nullable: true,length: 255 })
    fronttech: string | null;

    @Column("character varying", { name: 'cloudTech', nullable: true, length: 255 })
    cloudTech: string | null;

    @Column("integer", { name: 'sprints_quantity', nullable: true })
    sprintsQuantity: number | null;

    @Column("character varying", { name: 'endDate', nullable: true, length: 255 })
    endDate: string | null;

    @OneToMany(() => Tasks, (task) => task.project, { cascade: true })
    tasks: Tasks[];

}
