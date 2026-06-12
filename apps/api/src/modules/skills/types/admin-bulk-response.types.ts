export interface AdminBulkFailure {
  code?: string;
  id: string;
  message: string;
}

export interface AdminBulkOperationResponse {
  failed: AdminBulkFailure[];
  succeeded: string[];
}
