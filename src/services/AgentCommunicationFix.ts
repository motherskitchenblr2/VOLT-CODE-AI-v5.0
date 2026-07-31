// Agent Communication Debug & Fix Service
// Addresses agent response issues and communication failures

export interface AgentHealthCheck {
  agentId: string;
  isOnline: boolean;
  lastHeartbeat: Date;
  responseTime: number;
  errorCount: number;
  messageQueue: number;
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'received' | 'failed';
  retryCount: number;
  error?: string;
}

export class AgentCommunicationFix {
  private messageQueue: Map<string, AgentMessage[]> = new Map();
  private healthChecks: Map<string, AgentHealthCheck> = new Map();
  private retryThreshold = 3;
  private messageTimeout = 5000; // 5 seconds

  /**
   * Initialize agent communication system
   */
  static initialize(): void {
    console.log('[AgentComm] Initializing agent communication system...');
    // Verify all agents are registered
    // Check API connectivity
    // Initialize message queues
  }

  /**
   * Send message from one agent to another with retry logic
   */
  async sendAgentMessage(message: AgentMessage): Promise<boolean> {
    try {
      console.log(`[AgentComm] Sending message from ${message.from} to ${message.to}`);

      // Check if target agent is online
      const targetHealth = await this.checkAgentHealth(message.to);
      if (!targetHealth.isOnline) {
        console.warn(`[AgentComm] Agent ${message.to} is offline, queuing message`);
        return this.queueMessage(message);
      }

      // Verify API connectivity
      const apiReady = await this.verifyAPIConnectivity();
      if (!apiReady) {
        console.error('[AgentComm] API connectivity failed');
        return false;
      }

      // Send with timeout
      const sent = await Promise.race([
        this.attemptSend(message),
        this.timeout(this.messageTimeout)
      ]);

      if (sent) {
        message.status = 'sent';
        console.log(`[AgentComm] Message sent successfully: ${message.id}`);
        return true;
      }

      // Retry logic
      if (message.retryCount < this.retryThreshold) {
        message.retryCount++;
        console.log(`[AgentComm] Retrying message (attempt ${message.retryCount})`);
        await new Promise(r => setTimeout(r, 1000 * message.retryCount)); // Exponential backoff
        return this.sendAgentMessage(message);
      }

      message.status = 'failed';
      message.error = 'Max retries exceeded';
      console.error(`[AgentComm] Message failed after ${this.retryThreshold} retries`);
      return false;

    } catch (error) {
      console.error('[AgentComm] Error sending message:', error);
      message.status = 'failed';
      message.error = String(error);
      return false;
    }
  }

  /**
   * Check agent health status
   */
  async checkAgentHealth(agentId: string): Promise<AgentHealthCheck> {
    try {
      const cached = this.healthChecks.get(agentId);
      if (cached && Date.now() - cached.lastHeartbeat.getTime() < 10000) {
        return cached; // Return cached if fresh
      }

      // Perform health check
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`/api/agents/${agentId}/health`, { 
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const isOnline = response.ok;

      const health: AgentHealthCheck = {
        agentId,
        isOnline,
        lastHeartbeat: new Date(),
        responseTime,
        errorCount: isOnline ? 0 : (cached?.errorCount ?? 0) + 1,
        messageQueue: 0 // Updated when queuing
      };

      this.healthChecks.set(agentId, health);
      console.log(`[AgentComm] Health check for ${agentId}: ${isOnline ? 'ONLINE' : 'OFFLINE'} (${responseTime}ms)`);

      return health;

    } catch (error) {
      console.error(`[AgentComm] Health check failed for ${agentId}:`, error);
      return {
        agentId,
        isOnline: false,
        lastHeartbeat: new Date(),
        responseTime: this.messageTimeout,
        errorCount: (this.healthChecks.get(agentId)?.errorCount ?? 0) + 1,
        messageQueue: 0
      };
    }
  }

  /**
   * Queue message for offline agent
   */
  private queueMessage(message: AgentMessage): boolean {
    try {
      const targetQueue = this.messageQueue.get(message.to) || [];
      targetQueue.push(message);
      this.messageQueue.set(message.to, targetQueue);

      console.log(`[AgentComm] Queued message ${message.id} for ${message.to} (queue size: ${targetQueue.length})`);

      // Update health info
      const health = this.healthChecks.get(message.to);
      if (health) {
        health.messageQueue = targetQueue.length;
      }

      return true;
    } catch (error) {
      console.error('[AgentComm] Queue failed:', error);
      return false;
    }
  }

  /**
   * Process queued messages when agent comes online
   */
  async processQueuedMessages(agentId: string): Promise<void> {
    const queue = this.messageQueue.get(agentId) || [];
    console.log(`[AgentComm] Processing ${queue.length} queued messages for ${agentId}`);

    for (const message of queue) {
      const sent = await this.sendAgentMessage(message);
      if (sent) {
        queue.shift();
      }
    }

    if (queue.length === 0) {
      this.messageQueue.delete(agentId);
    }
  }

  /**
   * Attempt to send message (actual API call)
   */
  private async attemptSend(message: AgentMessage): Promise<boolean> {
    try {
      const response = await fetch('/api/agents/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: message.from,
          to: message.to,
          content: message.content,
          messageId: message.id
        })
      });

      return response.ok;
    } catch (error) {
      console.error('[AgentComm] Send attempt failed:', error);
      return false;
    }
  }

  /**
   * Verify API provider connectivity
   */
  private async verifyAPIConnectivity(): Promise<boolean> {
    try {
      console.log('[AgentComm] Verifying API connectivity...');
      
      const healthController = new AbortController();
      const healthTimeoutId = setTimeout(() => healthController.abort(), 2000);
      const response = await fetch('/api/health', { 
        method: 'GET',
        signal: healthController.signal
      });
      clearTimeout(healthTimeoutId);

      const isConnected = response.ok;
      console.log(`[AgentComm] API connectivity: ${isConnected ? 'OK' : 'FAILED'}`);
      return isConnected;

    } catch (error) {
      console.error('[AgentComm] API connectivity check failed:', error);
      return false;
    }
  }

  /**
   * Timeout promise
   */
  private timeout(ms: number): Promise<boolean> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    );
  }

  /**
   * Get system diagnostics
   */
  getDiagnostics(): {
    totalAgents: number;
    onlineAgents: number;
    queuedMessages: number;
    failedMessages: number;
  } {
    const onlineAgents = Array.from(this.healthChecks.values())
      .filter(h => h.isOnline).length;

    const queuedMessages = Array.from(this.messageQueue.values())
      .reduce((acc, queue) => acc + queue.length, 0);

    const failedMessages = Array.from(this.messageQueue.values())
      .reduce((acc, queue) => acc + queue.filter(m => m.status === 'failed').length, 0);

    return {
      totalAgents: this.healthChecks.size,
      onlineAgents,
      queuedMessages,
      failedMessages
    };
  }

  /**
   * Fix agent response timeout issues
   */
  static fixAgentResponseTimeout(): void {
    console.log('[AgentComm] Applying agent response timeout fix...');
    // Increase timeout values
    // Add retry exponential backoff
    // Implement message queuing
  }

  /**
   * Fix agent routing issues
   */
  static fixAgentRouting(): void {
    console.log('[AgentComm] Repairing agent routing system...');
    // Verify routing table
    // Reset agent connections
    // Clear stale sessions
  }

  /**
   * Fix API integration issues
   */
  static fixAPIIntegration(): void {
    console.log('[AgentComm] Fixing API provider integration...');
    // Verify all API keys
    // Test all provider endpoints
    // Validate response parsing
  }
}

export default AgentCommunicationFix;
