export interface RestoreCheckpointDetails {
  checkpointId: string;
  filePath: string;
  codeBackup: string;
  timestamp: string;
}

export class RecoveryCenter {
  constructor(
    private logCallback: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void,
    private username: string
  ) {}

  public async undoLastRepair(checkpointId: string): Promise<string> {
    this.logCallback(`[RECOVERY] Intercepting undo command for checkpoint: ${checkpointId}`, 'info');
    
    const rawData = localStorage.getItem(`backup_${checkpointId}`);
    if (!rawData) {
      // Fetch fallback from MongoDB Vault
      const dbResponse = await fetch(`/api/database?action=getCheckpoints&username=${encodeURIComponent(this.username)}`);
      if (dbResponse.ok) {
        const checkpoints = await dbResponse.json();
        const target = checkpoints.find((c: any) => c.checkpointId === checkpointId);
        if (target) {
          this.logCallback(`[RECOVERY] Snapshot recovered successfully from database.`, 'success');
          return target.codeBackup;
        }
      }
      throw new Error(`Checkpoint ${checkpointId} not registered inside system recovery registers.`);
    }

    const { content } = JSON.parse(rawData);
    this.logCallback(`[RECOVERY] Reverted workspace changes matching checkpoint ${checkpointId}.`, 'success');
    return content;
  }

  public async cleanSessionHistory(): Promise<boolean> {
    localStorage.removeItem('codeSessions');
    this.logCallback('[RECOVERY] Transient session registry cleared.', 'success');
    return true;
  }
}
