import { useCallback, useState } from 'react';

export const useGitBackup = (username: string) => {
  const [backingUp, setBackingUp] = useState(false);

  const createCheckpoint = useCallback(async (filePath: string, currentContent: string, gitCommitSha?: string) => {
    setBackingUp(true);
    const checkpointId = `chk_${Date.now().toString(36)}`;
    
    // Save locally to cache first
    localStorage.setItem(`backup_${checkpointId}`, JSON.stringify({
      filePath,
      content: currentContent,
      timestamp: new Date().toISOString()
    }));

    try {
      // Sync to MongoDB backup vault
      const res = await fetch(`/api/database?action=saveCheckpoint&username=${encodeURIComponent(username)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkpointId,
          filePath,
          codeBackup: currentContent,
          gitCommitSha
        })
      });
      if (!res.ok) throw new Error('MongoDB write failed');
    } catch (err) {
      console.warn('[BACKUP] Failed to sync checkpoint to MongoDB, local cache will be used for restore.', err);
    } finally {
      setBackingUp(false);
    }

    return checkpointId;
  }, [username]);

  const restoreCheckpoint = useCallback(async (checkpointId: string) => {
    // Attempt local retrieval first
    const localBackup = localStorage.getItem(`backup_${checkpointId}`);
    if (localBackup) {
      const { content } = JSON.parse(localBackup);
      return content;
    }

    // Fallback to MongoDB retrieval
    try {
      const res = await fetch(`/api/database?action=getCheckpoints&username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const checkpoints = await res.json();
        const target = checkpoints.find((c: any) => c.checkpointId === checkpointId);
        if (target) {
          return target.codeBackup;
        }
      }
    } catch (error) {
      console.error('[RESTORE] Database extraction failed', error);
    }
    
    throw new Error(`Checkpoint registry file ${checkpointId} could not be extracted.`);
  }, [username]);

  return { createCheckpoint, restoreCheckpoint, backingUp };
};
