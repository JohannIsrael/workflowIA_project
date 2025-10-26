
import { AuditLogs } from "../entities/AuditLogs.entity";


export interface IAuditLogsOperations {
    logAction(data: AuditLogs): Promise<void>;
    getAllAuditLogs(page: number, limit: number): Promise<AuditLogs[]>;
    findAuditLog(id: string): Promise<AuditLogs>;
}
