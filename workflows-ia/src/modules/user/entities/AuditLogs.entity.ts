import { 
    Column, 
    Entity, 
    ManyToOne, 
    PrimaryGeneratedColumn 
} from "typeorm";
import { User } from "./user.entity";

@Entity("audit_logs")
export class AuditLogs {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column("character varying", { name: 'action', length: 255 })
    action: string;

    @Column("character varying", { name: 'description', nullable: true, length: 255 })
    description: string | null;

    @Column("character varying", { name: 'details', nullable: true, length: 255 })
    details: string | null;

    @Column("character varying", { name: 'created_at', length: 255 })
    createdAt: string | null;

    @ManyToOne(() => User, (user) => user.id, {onDelete: 'NO ACTION'})
    user: User;

}