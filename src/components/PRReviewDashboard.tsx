import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PullRequest } from '../services/AgentCommunication';
import { GitPullRequest, ExternalLink, CheckCircle2, XCircle, GitMerge, Squash } from 'lucide-react';

interface PRReviewDashboardProps {
  pullRequests: PullRequest[];
  onMerge?: (prId: string, prNumber: number) => Promise<void>;
  onSquash?: (prId: string, prNumber: number) => Promise<void>;
  onIgnore?: (prId: string, prNumber: number) => Promise<void>;
  language?: 'en' | 'hi';
}

export const PRReviewDashboard: React.FC<PRReviewDashboardProps> = ({
  pullRequests,
  onMerge,
  onSquash,
  onIgnore,
  language = 'en'
}) => {
  const [prs, setPrs] = useState<PullRequest[]>(pullRequests);
  const [selectedPr, setSelectedPr] = useState<string | null>(null);
  const [processingPr, setProcessingPr] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'merged' | 'squashed' | 'ignored'>('open');

  useEffect(() => {
    setPrs(pullRequests);
  }, [pullRequests]);

  const handleMergePr = async (pr: PullRequest) => {
    setProcessingPr(pr.id);
    try {
      await onMerge?.(pr.id, pr.prNumber);
      setPrs(prs.map(p => p.id === pr.id ? { ...p, status: 'merged', userDecision: 'merge', userDecisionTime: new Date() } : p));
    } catch (error) {
      console.error('Failed to merge PR:', error);
    } finally {
      setProcessingPr(null);
    }
  };

  const handleSquashPr = async (pr: PullRequest) => {
    setProcessingPr(pr.id);
    try {
      await onSquash?.(pr.id, pr.prNumber);
      setPrs(prs.map(p => p.id === pr.id ? { ...p, status: 'squashed', userDecision: 'squash', userDecisionTime: new Date() } : p));
    } catch (error) {
      console.error('Failed to squash PR:', error);
    } finally {
      setProcessingPr(null);
    }
  };

  const handleIgnorePr = async (pr: PullRequest) => {
    setProcessingPr(pr.id);
    try {
      await onIgnore?.(pr.id, pr.prNumber);
      setPrs(prs.map(p => p.id === pr.id ? { ...p, status: 'ignored', userDecision: 'ignore', userDecisionTime: new Date() } : p));
    } catch (error) {
      console.error('Failed to ignore PR:', error);
    } finally {
      setProcessingPr(null);
    }
  };

  const filteredPrs = prs.filter(pr => {
    if (filterStatus === 'all') return true;
    return pr.status === filterStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-900/50 text-blue-200 border-blue-500/50';
      case 'merged':
        return 'bg-green-900/50 text-green-200 border-green-500/50';
      case 'squashed':
        return 'bg-purple-900/50 text-purple-200 border-purple-500/50';
      case 'ignored':
        return 'bg-red-900/50 text-red-200 border-red-500/50';
      default:
        return 'bg-gray-900/50 text-gray-200 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <GitPullRequest className="w-4 h-4" />;
      case 'merged':
        return <GitMerge className="w-4 h-4" />;
      case 'squashed':
        return <Squash className="w-4 h-4" />;
      case 'ignored':
        return <XCircle className="w-4 h-4" />;
      default:
        return <GitPullRequest className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-black to-slate-950 rounded-3xl border border-white/10 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-black/50 backdrop-blur-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <GitPullRequest className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-white">
                {language === 'en' ? 'Pull Requests' : 'पुल अनुरोध'}
              </h2>
              <p className="text-xs text-white/60">
                {language === 'en'
                  ? `${prs.length} total • ${prs.filter(p => p.status === 'open').length} pending`
                  : `कुल ${prs.length} • ${prs.filter(p => p.status === 'open').length} लंबित`}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-xs text-white/60">{language === 'en' ? 'Open' : 'खुला'}</p>
              <p className="text-lg font-bold text-blue-400">{prs.filter(p => p.status === 'open').length}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-xs text-white/60">{language === 'en' ? 'Merged' : 'मर्ज़'}</p>
              <p className="text-lg font-bold text-green-400">{prs.filter(p => p.status === 'merged').length}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-xs text-white/60">{language === 'en' ? 'Squashed' : 'स्क्वैश'}</p>
              <p className="text-lg font-bold text-purple-400">{prs.filter(p => p.status === 'squashed').length}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-xs text-white/60">{language === 'en' ? 'Ignored' : 'अनदेखा'}</p>
              <p className="text-lg font-bold text-red-400">{prs.filter(p => p.status === 'ignored').length}</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'open', 'merged', 'squashed', 'ignored'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {language === 'en'
                ? status.charAt(0).toUpperCase() + status.slice(1)
                : ({ all: 'सभी', open: 'खुला', merged: 'मर्ज़', squashed: 'स्क्वैश', ignored: 'अनदेखा' }[status])}
            </button>
          ))}
        </div>
      </div>

      {/* PRs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20">
        <AnimatePresence>
          {filteredPrs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-white/60">
                  {language === 'en' ? 'No pull requests' : 'कोई पुल अनुरोध नहीं'}
                </p>
              </div>
            </div>
          ) : (
            filteredPrs.map((pr, idx) => (
              <motion.div
                key={pr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedPr(selectedPr === pr.id ? null : pr.id)}
                className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
              >
                {/* PR Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded border ${getStatusBadgeColor(pr.status)}`}>
                        {getStatusIcon(pr.status)}
                      </div>
                      <h3 className="font-bold text-white text-sm truncate">{pr.title}</h3>
                      <span className="text-xs text-white/50">#{pr.prNumber}</span>
                    </div>
                    <p className="text-xs text-white/60 truncate mb-2">{pr.description?.substring(0, 100)}...</p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border ${getStatusBadgeColor(pr.status)}`}>
                    {language === 'en'
                      ? pr.status.charAt(0).toUpperCase() + pr.status.slice(1)
                      : ({ open: 'खुला', merged: 'मर्ज़', squashed: 'स्क्वैश', ignored: 'अनदेखा' }[pr.status])}
                  </span>
                </div>

                {/* PR Details */}
                <div className="flex items-center gap-2 text-xs text-white/60 mt-2">
                  <span>Branch: <code className="font-mono text-white/70">{pr.branch}</code></span>
                  <span>•</span>
                  <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedPr === pr.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/10 space-y-3"
                    >
                      {/* Description */}
                      <div className="bg-black/50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-white/70 mb-2">
                          {language === 'en' ? 'Description' : 'विवरण'}
                        </p>
                        <p className="text-xs text-white/60 whitespace-pre-wrap max-h-24 overflow-y-auto">
                          {pr.description}
                        </p>
                      </div>

                      {/* Agent Discussions */}
                      {pr.agentDiscussions && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-300 mb-2">
                            {language === 'en' ? 'Agent Discussions' : 'एजेंट चर्चा'}
                          </p>
                          <p className="text-xs text-white/60 whitespace-pre-wrap max-h-20 overflow-y-auto">
                            {pr.agentDiscussions}
                          </p>
                        </div>
                      )}

                      {/* User Decision History */}
                      {pr.userDecision && (
                        <div className={`p-3 rounded-lg border ${
                          pr.userDecision === 'merge' ? 'bg-green-900/20 border-green-500/30' :
                          pr.userDecision === 'squash' ? 'bg-purple-900/20 border-purple-500/30' :
                          'bg-red-900/20 border-red-500/30'
                        }`}>
                          <p className="text-xs font-semibold mb-1">
                            {language === 'en' ? 'Your Decision' : 'आपका निर्णय'}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase">
                              {pr.userDecision}
                            </span>
                            {pr.userDecisionTime && (
                              <span className="text-xs text-white/50">
                                {new Date(pr.userDecisionTime).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {pr.status === 'open' && (
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMergePr(pr);
                            }}
                            disabled={processingPr === pr.id}
                            className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                          >
                            <GitMerge className="w-3 h-3" />
                            {language === 'en' ? 'Merge' : 'मर्ज़'}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSquashPr(pr);
                            }}
                            disabled={processingPr === pr.id}
                            className="px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                          >
                            <Squash className="w-3 h-3" />
                            {language === 'en' ? 'Squash' : 'स्क्वैश'}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIgnorePr(pr);
                            }}
                            disabled={processingPr === pr.id}
                            className="px-3 py-2 rounded-lg bg-red-600/70 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            {language === 'en' ? 'Ignore' : 'अनदेखा'}
                          </button>
                        </div>
                      )}

                      {/* GitHub Link */}
                      <a
                        href={pr.gitHubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-blue-400 hover:text-blue-300 text-xs font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {language === 'en' ? 'View on GitHub' : 'GitHub पर देखें'}
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
