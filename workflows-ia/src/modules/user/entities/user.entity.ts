import { 
    Column, 
    Entity, 
    PrimaryGeneratedColumn 
} from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column("character varying", { name: 'name', length: 255 })
    name: string;

    @Column("character varying", { name: 'email', length: 255 })
    email: string;

    @Column("character varying", { name: 'full_name', nullable: true, length: 255 })
    fullName: string | null;

    @Column("character varying", { name: 'password', length: 255 })
    password: string;

    @Column("character varying", { name: 'created_at', length: 255 })
    createdAt: string | null;

    @Column("character varying", { name: 'last_login', nullable: true, length: 255 })
    lastLogin: string | null;

    @Column("character varying", { name: 'token', nullable: true, length: 255 })
    token: string | null;
}
