import React, { useEffect, useRef } from 'react';
import { Message, Agent, translate } from '../services/AgentCommunication';
import { MessageCircle, Volume2, Copy } from 'lucide-react';

interface AgentGroupChatProps {
  messages: Message[];
  agents: Map<string, Agent>;
  language: 'en' | 'hi';
  onMessageSend?: (content: string) => void;
  isLoading?: boolean;
}

export const AgentGroupChat: React.FC<AgentGroupChatProps> = ({
  messages,
  agents,
  language,
  onMessageSend,
  isLoading = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = React.useState('');

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onMessageSend?.(inputValue);
      setInputValue('');
    }
  };

  const handlePlayAudio = async (audioUrl?: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      await audio.play();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getMessageBackgroundColor = (type: Message['type']): string => {
    switch (type) {
      case 'system':
        return 'bg-gray-900/50 border-l-4 border-yellow-500';
      case 'decision':
        return 'bg-green-900/20 border-l-4 border-green-500';
      case 'audio':
        return 'bg-blue-900/20 border-l-4 border-blue-500';
      default:
        return 'bg-white/5';
    }
  };

  const agent = messages.length > 0 ? agents.get(messages[0].senderId) : undefined;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 to-black rounded-3xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-black/50 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Agent Meeting Chat</h3>
            <p className="text-xs text-white/60">
              {messages.length} messages • {agents.size} agents
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-white/60 font-medium">
                {language === 'en' ? 'No messages yet' : 'अभी कोई संदेश नहीं'}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const sender = agents.get(message.senderId);
            const isSystem = message.type === 'system';
            const isDecision = message.type === 'decision';

            return (
              <div key={message.id} className={`flex gap-3 ${isSystem ? 'justify-center' : ''}`}>
                {/* Avatar */}
                {!isSystem && sender && (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg font-bold text-white text-sm"
                    style={{ backgroundColor: sender.color }}
                    title={sender.name}
                  >
                    {sender.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}

                {/* Message Content */}
                <div className={`flex-1 ${isSystem ? 'max-w-full' : 'max-w-xs lg:max-w-md'}`}>
                  {!isSystem && sender && (
                    <p className="text-xs font-bold mb-1">
                      <span style={{ color: sender.color }}>{sender.name}</span>
                      <span className="text-white/40 ml-2">{sender.role}</span>
                    </p>
                  )}

                  <div className={`rounded-2xl px-4 py-3 ${getMessageBackgroundColor(message.type)}`}>
                    <p className="text-sm text-white break-words">{message.content}</p>

                    {/* Audio Transcript */}
                    {message.audioTranscript && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <p className="text-xs text-white/70 italic">
                          {language === 'en' ? 'Transcript:' : 'ट्रांस्क्रिप्ट:'} {message.audioTranscript}
                        </p>
                      </div>
                    )}

                    {/* Message Footer */}
                    <div className="flex items-center justify-between mt-2 text-xs text-white/50">
                      <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                      <div className="flex gap-2">
                        {message.audioUrl && (
                          <button
                            onClick={() => handlePlayAudio(message.audioUrl)}
                            className="hover:text-white/80 transition-colors"
                            title={language === 'en' ? 'Play audio' : 'ऑडियो चलाएं'}
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className="hover:text-white/80 transition-colors"
                          title={language === 'en' ? 'Copy message' : 'संदेश कॉपी करें'}
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-white/10 bg-black/50 backdrop-blur-lg">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              language === 'en'
                ? 'Type a message to the team...'
                : 'टीम को संदेश टाइप करें...'
            }
            disabled={isLoading}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {language === 'en' ? 'Send' : 'भेजें'}
          </button>
        </div>
      </div>
    </div>
  );
};
