import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Zap, MessageCircle, X } from 'lucide-react';

export interface BossGuidanceData {
  id: string;
  prNumber: number;
  reason: string;
  concern: 'rejected-critical-fix' | 'approved-risky-change' | 'other';
  recommendation: string;
  agentFeedback: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface BossGuidancePanelProps {
  guidance: BossGuidanceData | null;
  onAccept?: (guidanceId: string) => void;
  onConfirm?: (guidanceId: string) => void;
  onDismiss?: () => void;
  language?: 'en' | 'hi';
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'critical':
      return 'from-red-600 to-red-800';
    case 'high':
      return 'from-orange-600 to-orange-800';
    case 'medium':
      return 'from-yellow-600 to-yellow-800';
    case 'low':
      return 'from-blue-600 to-blue-800';
    default:
      return 'from-gray-600 to-gray-800';
  }
};

const getRiskBadgeColor = (level: string) => {
  switch (level) {
    case 'critical':
      return 'bg-red-900/50 text-red-200 border-red-500/50';
    case 'high':
      return 'bg-orange-900/50 text-orange-200 border-orange-500/50';
    case 'medium':
      return 'bg-yellow-900/50 text-yellow-200 border-yellow-500/50';
    case 'low':
      return 'bg-blue-900/50 text-blue-200 border-blue-500/50';
    default:
      return 'bg-gray-900/50 text-gray-200 border-gray-500/50';
  }
};

const getConcernIcon = (concern: string) => {
  switch (concern) {
    case 'rejected-critical-fix':
      return Zap;
    case 'approved-risky-change':
      return AlertCircle;
    default:
      return MessageCircle;
  }
};

export const BossGuidancePanel: React.FC<BossGuidancePanelProps> = ({
  guidance,
  onAccept,
  onConfirm,
  onDismiss,
  language = 'en'
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!guidance) return null;

  const ConcernIcon = getConcernIcon(guidance.concern);

  const concernTexts = {
    en: {
      'rejected-critical-fix': 'Rejected Critical Fix',
      'approved-risky-change': 'Approved Risky Change',
      'other': 'Decision Review'
    },
    hi: {
      'rejected-critical-fix': 'महत्वपूर्ण फिक्स अस्वीकृत',
      'approved-risky-change': 'जोखिम भरा परिवर्तन स्वीकृत',
      'other': 'निर्णय समीक्षा'
    }
  };

  const riskTexts = {
    en: {
      'low': 'Low Risk',
      'medium': 'Medium Risk',
      'high': 'High Risk',
      'critical': 'Critical Risk'
    },
    hi: {
      'low': 'कम जोखिम',
      'medium': 'मध्यम जोखिम',
      'high': 'उच्च जोखिम',
      'critical': 'गंभीर जोखिम'
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 right-6 w-96 max-h-96 bg-gradient-to-br from-slate-950 to-black rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-50"
      >
        {/* Header */}
        <div className={`p-4 bg-gradient-to-r ${getRiskColor(guidance.riskLevel)} text-white`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 rounded-lg bg-white/20">
                <ConcernIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base">
                  {language === 'en'
                    ? concernTexts.en[guidance.concern]
                    : concernTexts.hi[guidance.concern]}
                </h3>
                <p className="text-xs text-white/80 mt-1">
                  {language === 'en'
                    ? riskTexts.en[guidance.riskLevel]
                    : riskTexts.hi[guidance.riskLevel]}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsExpanded(false);
                onDismiss?.();
              }}
              className="p-1 rounded hover:bg-white/20 transition-colors"
              title={language === 'en' ? 'Dismiss' : 'बंद करें'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-80">
          {/* Boss Reason */}
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-xs font-bold text-yellow-300 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              {language === 'en' ? 'Boss Concern' : 'बॉस की चिंता'}
            </p>
            <p className="text-sm text-white/80 leading-relaxed">{guidance.reason}</p>
          </div>

          {/* Recommendation */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
            <p className="text-xs font-bold text-green-300 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {language === 'en' ? 'Recommendation' : 'सिफारिश'}
            </p>
            <p className="text-sm text-white/80 leading-relaxed">{guidance.recommendation}</p>
          </div>

          {/* Agent Feedback */}
          {guidance.agentFeedback.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs font-bold text-blue-300 mb-2">
                {language === 'en' ? 'Agent Feedback' : 'एजेंट प्रतिक्रिया'}
              </p>
              <ul className="space-y-1">
                {guidance.agentFeedback.map((feedback, idx) => (
                  <li key={idx} className="text-xs text-white/70 flex gap-2">
                    <span className="text-blue-400">•</span>
                    <span>{feedback}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Assessment */}
          <div className={`p-3 rounded-lg border ${getRiskBadgeColor(guidance.riskLevel)}`}>
            <p className="text-xs font-bold mb-2">
              {language === 'en' ? 'Risk Level' : 'जोखिम स्तर'}
            </p>
            <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: {
                    'low': '25%',
                    'medium': '50%',
                    'high': '75%',
                    'critical': '100%'
                  }[guidance.riskLevel] || '0%'
                }}
                className={`h-full bg-gradient-to-r ${getRiskColor(guidance.riskLevel)}`}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-white/60 mt-2">
              {language === 'en'
                ? `This decision carries a ${guidance.riskLevel} risk level`
                : `इस निर्णय में ${guidance.riskLevel} स्तर का जोखिम है`}
            </p>
          </div>

          {/* Info Message */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/70 text-center">
              {language === 'en'
                ? 'The Boss is providing guidance to help avoid potential issues. Please review carefully.'
                : 'संभावित समस्याओं से बचने में मदद के लिए बॉस मार्गदर्शन प्रदान कर रहा है। कृपया सावधानीपूर्वक समीक्षा करें।'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 bg-black/50 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              onAccept?.(guidance.id);
              setIsExpanded(false);
            }}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            {language === 'en' ? 'Accept' : 'स्वीकार करें'}
          </button>

          <button
            onClick={() => {
              onConfirm?.(guidance.id);
              setIsExpanded(false);
            }}
            className="px-4 py-2.5 rounded-lg bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all border border-white/20"
          >
            {language === 'en' ? 'Confirm Decision' : 'निर्णय की पुष्टि करें'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
