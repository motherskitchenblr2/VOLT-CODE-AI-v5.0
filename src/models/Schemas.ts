import mongoose, { Schema, Document } from 'mongoose';

// 1. Session History Schema
export interface ISession extends Document {
  username: string;
  sessionId: string;
  repoPath: string;
  branch: string;
  originalCode: string;
  fixedCode: string;
  issues: Array<{
    id: number;
    type: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    line: number;
    description: string;
    original: string;
    fixed: string;
    explanation: string;
  }>;
  summary: string;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  modelUsed: string;
  provider: string;
  createdAt: Date;
}

const SessionSchema: Schema = new Schema({
  username: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, unique: true },
  repoPath: { type: String, required: true },
  branch: { type: String, required: true },
  originalCode: { type: String, required: true },
  fixedCode: { type: String },
  issues: [{
    id: { type: Number },
    type: { type: String },
    severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'] },
    line: { type: Number },
    description: { type: String },
    original: { type: String },
    fixed: { type: String },
    explanation: { type: String }
  }],
  summary: { type: String },
  tokensUsed: { type: Number, default: 0 },
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  modelUsed: { type: String },
  provider: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// 2. Safe Git Checkpoint Schema (Epic 09 & 10)
export interface ICheckpoint extends Document {
  checkpointId: string;
  username: string;
  filePath: string;
  codeBackup: string;
  gitCommitSha: string;
  createdAt: Date;
}

const CheckpointSchema: Schema = new Schema({
  checkpointId: { type: String, required: true, unique: true },
  username: { type: String, required: true, index: true },
  filePath: { type: String, required: true },
  codeBackup: { type: String, required: true },
  gitCommitSha: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// 3. User Settings & Encrypted Keys Schema (Epic 17 & Gap 7)
export interface IUserSettings extends Document {
  username: string;
  agentMode: 'manual' | 'assist' | 'auto-syntax' | 'auto-debug' | 'team-review';
  debounceDelay: number;
  autoApplyFixes: boolean;
  enableSentinel: boolean;
  permissions: {
    readOnly: boolean;
    generatePatches: boolean;
    modifyFiles: boolean;
    createBranches: boolean;
    runTests: boolean;
    pushBranches: boolean;
    createPRs: boolean;
  };
  keys: {
    groqKeyEncrypted: string;
    openrouterKeyEncrypted: string;
    nvidiaKeyEncrypted: string;
    huggingfaceKeyEncrypted: string;
    githubTokenEncrypted: string;
  };
  updatedAt: Date;
}

const UserSettingsSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  agentMode: { type: String, default: 'assist' },
  debounceDelay: { type: Number, default: 800 },
  autoApplyFixes: { type: Boolean, default: false },
  enableSentinel: { type: Boolean, default: false },
  permissions: {
    readOnly: { type: Boolean, default: false },
    generatePatches: { type: Boolean, default: true },
    modifyFiles: { type: Boolean, default: false },
    createBranches: { type: Boolean, default: false },
    runTests: { type: Boolean, default: true },
    pushBranches: { type: Boolean, default: false },
    createPRs: { type: Boolean, default: false }
  },
  keys: {
    groqKeyEncrypted: { type: String, default: '' },
    openrouterKeyEncrypted: { type: String, default: '' },
    nvidiaKeyEncrypted: { type: String, default: '' },
    huggingfaceKeyEncrypted: { type: String, default: '' },
    githubTokenEncrypted: { type: String, default: '' }
  },
  updatedAt: { type: Date, default: Date.now }
});

// 4. Audit Log Schema
export interface IAuditLog extends Document {
  username: string;
  action: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  username: { type: String, required: true, index: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  status: { type: String, enum: ['SUCCESS', 'WARNING', 'FAILED'], required: true },
  createdAt: { type: Date, default: Date.now }
});

export const SessionModel = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
export const CheckpointModel = mongoose.models.Checkpoint || mongoose.model<ICheckpoint>('Checkpoint', CheckpointSchema);
export const UserSettingsModel = mongoose.models.UserSettings || mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
