import { useCallback, useState } from "react";

export const useGitBackup = () => {
  const [backingUp, setBackingUp] = useState(false);

  const createCheckpoint = useCallback(
    async (filePath: string, currentContent: string, gitCommitSha?: string) => {
      setBackingUp(true);
      const checkpointId = `chk_${Date.now().toString(36)}`;

      // Save locally to cache first
      localStorage.setItem(
        `backup_${checkpointId}`,
        JSON.stringify({
          filePath,
          content: currentContent,
          timestamp: new Date().toISOString(),
        }),
      );

      try {
        // Sync to MongoDB backup vault
        const res = await fetch(`/api/database?action=saveCheckpoint`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkpointId,
            filePath,
            codeBackup: currentContent,
            gitCommitSha,
          }),
        });
        if (!res.ok) throw new Error("MongoDB write failed");
      } catch (err) {
        console.warn(
          "[BACKUP] Failed to sync checkpoint to MongoDB, local cache will be used for restore.",
          err,
        );
      } finally {
        setBackingUp(false);
      }

      return checkpointId;
    },
    [],
  );

  const restoreCheckpoint = useCallback(async (checkpointId: string) => {
    // Attempt local retrieval first
    const localBackup = localStorage.getItem(`backup_${checkpointId}`);
    if (localBackup) {
      try {
        const { content } = JSON.parse(localBackup);
        return content;
      } catch {
        // Fall through to MongoDB retrieval if local cache is corrupt
      }
    }

    // Fallback to MongoDB retrieval
    try {
      const res = await fetch(`/api/database?action=getCheckpoints`);
      if (res.ok) {
        const checkpoints = (await res.json()) as Array<{
          checkpointId: string;
          codeBackup: string;
        }>;
        const target = checkpoints.find((c) => c.checkpointId === checkpointId);
        if (target) {
          return target.codeBackup;
        }
      }
    } catch (error) {
      console.error("[RESTORE] Database extraction failed", error);
    }

    throw new Error(
      `Checkpoint registry file ${checkpointId} could not be extracted.`,
    );
  }, []);

  return { createCheckpoint, restoreCheckpoint, backingUp };
};
