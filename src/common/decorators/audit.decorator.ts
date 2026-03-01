import { SetMetadata } from '@nestjs/common';

export const AUDIT_METADATA = 'audit_metadata';

export interface AuditMetadata {
  action: string;
  entityType: string;
  getEntityId?: (req: any, res: any) => string | undefined;
  getChanges?: (req: any, res: any) => any;
  getDetails?: (req: any, res: any) => string | undefined;
  logErrors?: boolean;
}

export const Audit = (metadata: AuditMetadata) =>
  SetMetadata(AUDIT_METADATA, {
    ...metadata,
    logErrors: metadata.logErrors ?? true,
  });
