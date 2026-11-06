import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  X,
  Bot,
  Wifi,
  WifiOff,
  Globe,
  Sparkles,
  HelpCircle,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { aiApi, OfflineFaqItem } from '../../services/aiApi';
import { ChatMessage } from '../../types/ai';

interface AiAssistantSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  caseNumber?: string;
}

export const AiAssistantSlideOver: React.FC<AiAssistantSlideOverProps> = ({
  isOpen,
  onClose,
  caseNumber = '#CJ-101'
}) => {
  // Baseline initial dialogue matching Member 4 / Screenshot 9
  const initialMessages: ChatMessage[] = [
    {
      sender: 'You',
      text: 'Where is the affected area?',
      timestamp: '10:04 AM',
      language: 'en'
    },
    {
      sender: 'AI',
      text: 'The affected area is Kandyya, Sri Lanka. The area is experiencing heavy flooding and road closures.',
      timestamp: '10:04 AM',
      confidence: 0.98,
      language: 'en'
    },
    {
      sender: 'You',
      text: 'What are the immediate needs?',
      timestamp: '10:05 AM',
      language: 'en'
    },
    {
      sender: 'AI',
      text: 'Immediate needs include food, clean water, medical aid, and temporary shelter for the affected families.',
      timestamp: '10:05 AM',
      confidence: 0.96,
      language: 'en'
    }
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('resqnet_ai_chat_history_v1');
      return saved ? JSON.parse(saved) : initialMessages;
    } catch {
      return initialMessages;
    }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedLang, setDetectedLang] = useState<'en' | 'si' | 'ta'>('en');
  const [isOffline, setIsOffline] = useState<boolean>(aiApi.isSimulatedOffline() || (typeof navigator !== 'undefined' && !navigator.onLine));
  const [selectedLanguage, setSelectedLanguage] = useState<'auto' | 'en' | 'si' | 'ta'>('auto');
  const [showFaqDrawer, setShowFaqDrawer] = useState(false);
  const [offlineFaqs, setOfflineFaqs] = useState<OfflineFaqItem[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('resqnet_ai_chat_history_v1', JSON.stringify(messages));
    } catch {}
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      checkNetwork();
      setOfflineFaqs(aiApi.getOfflineFaqs());
    }
  }, [isOpen]);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(aiApi.isSimulatedOffline());
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkNetwork = async () => {
    const health = await aiApi.checkHealth();
    setIsOffline(health.status === 'Offline' || aiApi.isSimulatedOffline());
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (selectedLanguage === 'auto') {
      const lang = aiApi.detectLanguage(val);
      setDetectedLang(lang);
    }
  };

  const toggleSimulatedOffline = () => {
    const next = !aiApi.isSimulatedOffline();
    aiApi.setSimulatedOffline(next);
    setIsOffline(next || !navigator.onLine);
  };

  const clearHistory = () => {
    setMessages(initialMessages);
    localStorage.removeItem('resqnet_ai_chat_history_v1');
  };

  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (overrideText || input).trim();
    if (!textToSend || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const effectiveLang = selectedLanguage === 'auto' ? aiApi.detectLanguage(textToSend) : selectedLanguage;

    const userMsg: ChatMessage = {
      sender: 'You',
      text: textToSend,
      timestamp: timeStr,
      language: effectiveLang
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiApi.askChatbot(textToSend, caseNumber, effectiveLang);
      const aiMsg: ChatMessage = {
        sender: 'AI',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: res.detectedLanguage,
        isFallback: res.isFallback,
        confidence: res.confidence,
        suggestedAction: res.suggestedAction
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'AI',
          text: 'Unable to reach the live AI gateway. Fallback emergency guidelines remain active for this crisis zone.',
          timestamp: 'Now',
          isFallback: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFaqClick = (faq: OfflineFaqItem) => {
    handleSend(undefined, faq.question);
    setShowFaqDrawer(false);
  };

  if (!isOpen) return null;

  const langNames: Record<'en' | 'si' | 'ta', string> = {
    en: 'English',
    si: 'Sinhala (සිංහල)',
    ta: 'Tamil (தமிழ்)'
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          zIndex: 9998,
          transition: 'opacity 0.25s ease'
        }}
      />

      {/* Slide-over panel */}
      <aside
        role="dialog"
        aria-label="AI Assistant"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '540px',
          maxWidth: '100vw',
          backgroundColor: '#0a192f',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.45)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          color: '#ffffff'
        }}
      >
        {/* Top Header Matching Screenshot 9 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #1e293b',
            paddingBottom: '14px',
            marginBottom: '14px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0a192f'
                }}
              >
                <Bot size={18} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                9. AI Assistant (slide-over)
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', marginLeft: '36px' }}>
              Case Number: <strong style={{ color: '#38bdf8' }}>{caseNumber}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={clearHistory}
              title="Reset conversation"
              style={{
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                borderRadius: '8px',
                border: '1px solid #334155',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={12} /> Clear
            </button>

            <button
              onClick={onClose}
              aria-label="Close Assistant"
              style={{
                backgroundColor: '#1e293b',
                color: '#cbd5e1',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'grid',
                placeItems: 'center',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status & Fallback Indicator Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isOffline ? 'rgba(245, 158, 11, 0.15)' : 'rgba(18, 168, 107, 0.15)',
            border: `1px solid ${isOffline ? '#f59e0b' : '#12A86B'}`,
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            marginBottom: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isOffline ? (
              <>
                <WifiOff size={14} color="#f59e0b" />
                <span style={{ color: '#fef3c7', fontWeight: 700 }}>
                  Offline Fallback Mode
                </span>
                <span style={{ color: '#fbbf24', fontSize: '11px' }}>
                  (Answering from local FAQ &amp; Heuristics)
                </span>
              </>
            ) : (
              <>
                <Wifi size={14} color="#34d399" />
                <span style={{ color: '#d1fae5', fontWeight: 700 }}>AI Gateway Online</span>
                <span style={{ color: '#a7f3d0', fontSize: '11px' }}>
                  (Multilingual Engine)
                </span>
              </>
            )}
          </div>

          <button
            onClick={toggleSimulatedOffline}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '6px',
              padding: '3px 8px',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {isOffline ? 'Test Online' : 'Test Offline'}
          </button>
        </div>

        {/* Language selector & quick FAQ trigger bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#94a3b8',
            marginBottom: '10px',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={13} color="#38bdf8" />
            <span>Lang:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '3px 6px',
                fontSize: '11px'
              }}
            >
              <option value="auto">Auto-detect ({langNames[detectedLang].split(' ')[0]})</option>
              <option value="en">English (EN)</option>
              <option value="si">Sinhala (සිංහල)</option>
              <option value="ta">Tamil (தமிழ்)</option>
            </select>
          </div>

          <button
            onClick={() => setShowFaqDrawer(!showFaqDrawer)}
            style={{
              backgroundColor: showFaqDrawer ? '#38bdf8' : 'rgba(56, 189, 248, 0.12)',
              color: showFaqDrawer ? '#0a192f' : '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={12} />
            {showFaqDrawer ? 'Hide FAQs' : 'Emergency FAQs'}
          </button>
        </div>

        {/* Offline FAQ drawer if toggled */}
        {showFaqDrawer && (
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '12px',
              maxHeight: '180px',
              overflowY: 'auto'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginBottom: '8px', textTransform: 'uppercase' }}>
              Quick Emergency Questions ({isOffline ? 'Offline Ready' : 'Verified'})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {offlineFaqs.map((faq) => (
                <button
                  key={faq.id}
                  onClick={() => handleFaqClick(faq)}
                  style={{
                    textAlign: 'left',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: '#e2e8f0',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {faq.question}
                  </span>
                  <ChevronRight size={12} color="#94a3b8" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Container Card (White Card Matching Screenshot 9) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            flex: 1,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden'
          }}
        >
          {/* Messages scroll area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {messages.map((m, idx) => {
              const isUser = m.sender === 'You';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      maxWidth: '85%',
                      flexDirection: isUser ? 'row-reverse' : 'row'
                    }}
                  >
                    {!isUser && (
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#0a192f',
                          color: '#38bdf8',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        <Bot size={15} />
                      </div>
                    )}

                    <div
                      style={{
                        backgroundColor: isUser ? '#2563eb' : '#f1f5f9',
                        color: isUser ? '#ffffff' : '#0f172a',
                        padding: '12px 16px',
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        fontSize: '13.5px',
                        lineHeight: 1.5,
                        boxShadow: isUser ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
                        border: isUser ? 'none' : '1px solid #e2e8f0'
                      }}
                    >
                      {m.text}

                      {/* Suggested Action Pill if AI response */}
                      {m.suggestedAction && (
                        <div
                          style={{
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px dashed #cbd5e1',
                            fontSize: '11px',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Sparkles size={12} color="#2563eb" />
                          <span>Action: {m.suggestedAction}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata: sender + time + fallback tag */}
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      marginTop: '4px',
                      paddingLeft: isUser ? 0 : '36px',
                      paddingRight: isUser ? '4px' : 0,
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center'
                    }}
                  >
                    <span>{m.sender}</span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                    {m.isFallback && (
                      <span
                        style={{
                          backgroundColor: '#fef3c7',
                          color: '#b45309',
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}
                      >
                        Offline Mode
                      </span>
                    )}
                    {m.confidence !== undefined && (
                      <span style={{ color: '#16a34a', fontSize: '10px' }}>
                        {Math.round(m.confidence * 100)}% conf
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#0a192f',
                    color: '#38bdf8',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <Bot size={15} />
                </div>
                <div
                  style={{
                    backgroundColor: '#f1f5f9',
                    padding: '10px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#2563eb',
                      borderRadius: '50%',
                      animation: 'pulse 1s infinite'
                    }}
                  />
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#2563eb',
                      borderRadius: '50%',
                      animation: 'pulse 1s infinite 0.2s'
                    }}
                  />
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#2563eb',
                      borderRadius: '50%',
                      animation: 'pulse 1s infinite 0.4s'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                    AI is analyzing crisis queries...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input field area matching Screenshot 9 */}
          <form
            onSubmit={handleSend}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid #e2e8f0'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={
                isOffline
                  ? 'Ask emergency question in English, සිංහල, or தமிழ் (Offline FAQ)...'
                  : 'Ask about affected area, supplies, shelters in EN, SI, TA...'
              }
              style={{
                flex: 1,
                padding: '13px 18px',
                borderRadius: '999px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13.5px',
                color: '#0f172a',
                outline: 'none',
                backgroundColor: '#f8fafc'
              }}
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              style={{
                backgroundColor: input.trim() && !loading ? '#2563eb' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                boxShadow: input.trim() ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
};
