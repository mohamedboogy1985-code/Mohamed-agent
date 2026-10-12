/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { AudioRecorder } from '@/lib/audio-recorder';
import { useAgent, useUI, useUser } from '@/lib/state';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Terminal,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Zap,
} from 'lucide-react';

export const VoiceConsole: React.FC = () => {
  const { client, connected, status, volume, connect, disconnect } = useLiveAPIContext();
  const { current } = useAgent();
  const { name, companyName } = useUser();
  const { eventLogs, addEventLog, clearEventLogs } = useUI();

  const [muted, setMuted] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [lastExecutedTool, setLastExecutedTool] = useState<{
    name: string;
    summary: string;
    timestamp: number;
  } | null>(null);

  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Initialize AudioRecorder
  useEffect(() => {
    const recorder = new AudioRecorder(16000);
    audioRecorderRef.current = recorder;

    const onData = (base64: string) => {
      if (!muted) {
        client.sendRealtimeInput([
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64,
          },
        ]);
      }
    };

    let lastVolTime = 0;
    const onVolume = (vol: number) => {
      const now = performance.now();
      if (now - lastVolTime > 40) {
        lastVolTime = now;
        setMicVolume(vol);
      }
    };

    const onError = (err: any) => {
      console.error('Audio recorder error:', err);
      setMicError(err?.message || 'تعذر تشغيل الميكروفون. يرجى التحقق من أذونات المتصفح.');
      addEventLog({
        type: 'system',
        text: `خطأ في الميكروفون: ${err?.message || 'تم رفض الإذن أو الجهاز غير متوفر'}`,
      });
    };

    recorder.on('data', onData);
    recorder.on('volume', onVolume);
    recorder.on('error', onError);

    return () => {
      recorder.off('data', onData);
      recorder.off('volume', onVolume);
      recorder.off('error', onError);
      recorder.stop();
    };
  }, [client, muted, addEventLog]);

  // Start or stop recording when connected state changes
  useEffect(() => {
    const recorder = audioRecorderRef.current;
    if (!recorder) return;

    if (connected && !muted) {
      setMicError(null);
      recorder.start().catch((e) => {
        setMicError('يرجى السماح للتطبيق باستخدام الميكروفون للمحادثة الصوتية.');
      });
    } else {
      recorder.stop();
      setMicVolume(0);
    }
  }, [connected, muted]);

  // Listen to tool execution events from GenAILiveClient
  useEffect(() => {
    const onToolExecuted = (data: {
      name: string;
      args: any;
      result: any;
      summary: string;
    }) => {
      setLastExecutedTool({
        name: data.name,
        summary: data.summary,
        timestamp: Date.now(),
      });
      addEventLog({
        type: 'tool',
        text: `⚡ استدعاء دالة محاسبية: ${data.name}`,
        details: { args: data.args, result: data.result, summary: data.summary },
      });
    };

    const onContent = (content: any) => {
      const parts = content?.modelTurn?.parts || [];
      const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join(' ');
      if (textParts) {
        addEventLog({
          type: 'speech',
          speaker: 'agent',
          text: textParts,
        });
      }
    };

    client.on('toolexecuted', onToolExecuted);
    client.on('content', onContent);

    return () => {
      client.off('toolexecuted', onToolExecuted);
      client.off('content', onContent);
    };
  }, [client, addEventLog]);

  // Scroll logs to bottom when updated
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [eventLogs]);

  // Quick prompt execution
  const handleQuickPrompt = (prompt: string) => {
    if (!connected) {
      addEventLog({
        type: 'system',
        text: 'يرجى بدء الاتصال الصوتي أولاً للتمكن من التحدث مع المحاسب.',
      });
      connect().then(() => {
        setTimeout(() => {
          client.send({ text: prompt }, true);
          addEventLog({ type: 'speech', speaker: 'user', text: prompt });
        }, 800);
      });
      return;
    }
    client.send({ text: prompt }, true);
    addEventLog({ type: 'speech', speaker: 'user', text: prompt });
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!connected) {
      connect().then(() => {
        setTimeout(() => {
          client.send({ text: inputText }, true);
          addEventLog({ type: 'speech', speaker: 'user', text: inputText });
          setInputText('');
        }, 800);
      });
      return;
    }
    client.send({ text: inputText }, true);
    addEventLog({ type: 'speech', speaker: 'user', text: inputText });
    setInputText('');
  };

  // Calculate dynamic visual scale from speaker or mic volume
  const activeVolume = Math.max(volume, micVolume);
  const orbScale = connected ? 1 + Math.min(activeVolume * 2.2, 0.6) : 1;
  const glowColor = current.bodyColor || '#2563eb';

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4 text-zinc-100">
      {/* Top Header & Assistant Info */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md ring-2 ring-white/10"
            style={{ backgroundColor: current.bodyColor }}
          >
            {current.name.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">{current.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-900/40 text-blue-300 border border-blue-700/50">
                {current.voice}
              </span>
            </div>
            <p className="text-xs text-zinc-400">{current.title}</p>
          </div>
        </div>

        {/* Mic toggle and controls */}
        <div className="flex items-center gap-2">
          {connected && (
            <button
              onClick={() => setMuted(!muted)}
              className={`p-2 rounded-xl text-xs font-medium border transition-colors ${
                muted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700'
              }`}
              title={muted ? 'إلغاء كتم الميكروفون' : 'كتم الميكروفون'}
            >
              {muted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            </button>
          )}

          <button
            onClick={connected ? disconnect : connect}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition-all ${
              connected
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50'
            }`}
          >
            {connected ? 'إيقاف' : 'اتصال صوتي'}
          </button>
        </div>
      </div>

      {/* Mic Permission or Hardware Alert */}
      {micError && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{micError}</p>
            <p className="text-[11px] text-rose-400/80 mt-0.5">
              تأكد من منح الإذن للمتصفح أو مراجعة إعدادات الخصوصية في الجهاز.
            </p>
          </div>
          <button
            onClick={() => {
              setMicError(null);
              audioRecorderRef.current?.start().catch(() => {});
            }}
            className="px-2 py-1 rounded bg-rose-800 hover:bg-rose-700 text-white text-[10px]"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Voice Visualizer Avatar Area */}
      <div className="relative py-6 flex flex-col items-center justify-center bg-zinc-950/60 rounded-xl border border-zinc-800/80 overflow-hidden">
        {/* Background glow animation */}
        <div
          className="absolute w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-300"
          style={{
            backgroundColor: glowColor,
            transform: `scale(${orbScale * 1.3})`,
          }}
        />

        {/* Central interactive voice orb */}
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-100 ease-out cursor-pointer"
          style={{
            transform: `scale(${orbScale})`,
            backgroundColor: glowColor,
            boxShadow: `0 0 35px ${glowColor}80`,
          }}
          onClick={connected ? disconnect : connect}
          title={connected ? 'المحاسب يستمع إليك الآن' : 'انقر لبدء المحادثة الصوتية'}
        >
          <div className="w-20 h-20 rounded-full bg-zinc-950/80 flex items-center justify-center">
            {connected ? (
              <div className="flex items-center gap-1">
                <span
                  className="w-1.5 bg-emerald-400 rounded-full transition-all duration-75"
                  style={{ height: `${12 + Math.min(activeVolume * 60, 24)}px` }}
                />
                <span
                  className="w-1.5 bg-blue-400 rounded-full transition-all duration-75"
                  style={{ height: `${16 + Math.min(activeVolume * 90, 32)}px` }}
                />
                <span
                  className="w-1.5 bg-indigo-400 rounded-full transition-all duration-75"
                  style={{ height: `${10 + Math.min(activeVolume * 50, 20)}px` }}
                />
              </div>
            ) : (
              <Mic className="w-7 h-7 text-zinc-400" />
            )}
          </div>
        </div>

        {/* Voice status label */}
        <div className="mt-3 text-center">
          <p className="text-xs font-medium text-zinc-300">
            {connected
              ? activeVolume > 0.05
                ? 'جاري تدفق الصوت بالذكاء الاصطناعي...'
                : 'المحاسب بانتظار استفسارك الصوتي...'
              : 'اضغط على الدائرة أو زر الاتصال للبدء'}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
            Model: {client.model} | Rate: 16kHz IN / 24kHz OUT
          </p>
        </div>
      </div>

      {/* Real-time Tool Execution Banner */}
      {lastExecutedTool && (
        <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-200 animate-fadeIn">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono text-[11px]">
                {lastExecutedTool.name}()
              </span>
              <span className="text-[10px] text-zinc-400">
                {new Date(lastExecutedTool.timestamp).toLocaleTimeString('ar-EG')}
              </span>
            </div>
            <p className="text-blue-100 text-[11px] mt-0.5">{lastExecutedTool.summary}</p>
          </div>
        </div>
      )}

      {/* Quick Vocal Prompts */}
      <div>
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
          <span className="flex items-center gap-1 font-semibold text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            أوامر صوتية سريعة بنقرة واحدة (النقابة العامة للبناء):
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            'كم رصيد الخزينة وحساب البنك الأهلي حالياً؟',
            'أعطني الملخص المالي والفائض للنقابة',
            'سجل قيد تحصيل اشتراكات نقداً بـ 15,000 جنيه',
            'ما هو رصيد صندوق الرعاية ببنك مصر؟',
            'هل ميزان المراجعة متزن بدقة؟',
            'ما هو رصيد مستشفى المقاولين؟',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(prompt)}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors text-right"
            >
              💬 {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Live Conversation Transcript Stream */}
      <div className="flex flex-col flex-1 min-h-[160px] max-h-[220px] bg-zinc-950/80 rounded-xl border border-zinc-800 p-3 overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Terminal className="w-3 h-3 text-zinc-500" />
            سجل الحوار والأوامر الصوتية
          </span>
          <button
            onClick={clearEventLogs}
            className="text-[10px] text-zinc-500 hover:text-zinc-300"
          >
            مسح السجل
          </button>
        </div>

        <div
          ref={logsContainerRef}
          className="flex-1 overflow-y-auto space-y-2 pt-2 pr-1 text-xs"
        >
          {eventLogs.map((log) => (
            <div
              key={log.id}
              className={`p-2 rounded-lg text-xs leading-relaxed ${
                log.speaker === 'user'
                  ? 'bg-blue-950/50 border border-blue-900/60 text-blue-200 mr-4'
                  : log.speaker === 'agent'
                  ? 'bg-zinc-800/70 border border-zinc-700 text-zinc-100 ml-4'
                  : log.type === 'tool'
                  ? 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-300'
                  : 'bg-zinc-900/50 text-zinc-400 text-[11px]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5">
                <span className="font-medium">
                  {log.speaker === 'user'
                    ? 'أنت'
                    : log.speaker === 'agent'
                    ? current.name
                    : log.type === 'tool'
                    ? 'النظام المحاسبي'
                    : 'معلومات'}
                </span>
                <span>{new Date(log.timestamp).toLocaleTimeString('ar-SA')}</span>
              </div>
              <p>{log.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Manual text instruction bar */}
      <form onSubmit={handleSendText} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="اكتب أمرك للمحاسب هنا (أو تحدث مباشرة بالصوت)..."
          className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>إرسال</span>
        </button>
      </form>
    </div>
  );
};
