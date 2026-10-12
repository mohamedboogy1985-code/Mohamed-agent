/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GoogleGenAI,
  LiveCallbacks,
  LiveClientToolResponse,
  LiveConnectConfig,
  LiveServerContent,
  LiveServerMessage,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  Part,
  Session,
} from '@google/genai';
import EventEmitter from 'eventemitter3';
import { DEFAULT_LIVE_API_MODEL } from './constants';
import { difference } from 'lodash';
import { base64ToArrayBuffer } from './utils';
import { executeAccountingTool } from './accounting-tools';

export interface StreamingLog {
  count?: number;
  data?: unknown;
  date: Date;
  message: string | object;
  type: string;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'reconnecting';

export interface LiveClientEventTypes {
  audio: (data: ArrayBuffer) => void;
  close: (event: CloseEvent) => void;
  content: (data: LiveServerContent) => void;
  error: (e: ErrorEvent) => void;
  interrupted: () => void;
  log: (log: StreamingLog) => void;
  open: () => void;
  setupcomplete: () => void;
  toolcall: (toolCall: LiveServerToolCall) => void;
  toolexecuted: (data: { name: string; args: any; result: any; summary: string }) => void;
  toolcallcancellation: (toolcallCancellation: LiveServerToolCallCancellation) => void;
  turncomplete: () => void;
  statuschange: (status: ConnectionStatus) => void;
}

export class GenAILiveClient extends EventEmitter<LiveClientEventTypes> {
  public readonly model: string = DEFAULT_LIVE_API_MODEL;
  protected readonly client: GoogleGenAI;
  protected session?: Session;

  private _status: ConnectionStatus = 'disconnected';
  private _autoReconnect: boolean = true;
  private _reconnectAttempts: number = 0;
  private _maxReconnectAttempts: number = 5;
  private _reconnectTimer?: ReturnType<typeof setTimeout>;
  private _heartbeatInterval?: ReturnType<typeof setInterval>;
  private _lastConfig?: LiveConnectConfig;
  private _userRequestedDisconnect: boolean = false;

  public get status(): ConnectionStatus {
    return this._status;
  }

  public get reconnectAttempts(): number {
    return this._reconnectAttempts;
  }

  constructor(apiKey: string, model?: string) {
    super();
    if (model) this.model = model;
    this.client = new GoogleGenAI({ apiKey });

    // Listen to network status changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this._status === 'disconnected' && !this._userRequestedDisconnect && this._lastConfig) {
          this.log('network.online', 'Network online detected, attempting reconnection...');
          this.scheduleReconnect();
        }
      });
      window.addEventListener('offline', () => {
        this.log('network.offline', 'Network offline detected.');
      });
    }
  }

  public async connect(config: LiveConnectConfig): Promise<boolean> {
    if (this._status === 'connected' || this._status === 'connecting') {
      return false;
    }

    this._userRequestedDisconnect = false;
    this._lastConfig = config;
    this.setStatus('connecting');

    const callbacks: LiveCallbacks = {
      onopen: this.onOpen.bind(this),
      onmessage: this.onMessage.bind(this),
      onerror: this.onError.bind(this),
      onclose: this.onClose.bind(this),
    };

    try {
      this.session = await this.client.live.connect({
        model: this.model,
        config: {
          ...config,
        },
        callbacks,
      });

      this._reconnectAttempts = 0;
      this.startHeartbeat();
      this.setStatus('connected');
      return true;
    } catch (e: any) {
      console.error('Error connecting to GenAI Live:', e);
      this.stopHeartbeat();
      this.session = undefined;
      this.setStatus('disconnected');

      if (!this._userRequestedDisconnect && this._autoReconnect) {
        this.scheduleReconnect();
      }
      return false;
    }
  }

  public disconnect(): boolean {
    this._userRequestedDisconnect = true;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = undefined;
    }
    this.stopHeartbeat();
    this.session?.close();
    this.session = undefined;
    this.setStatus('disconnected');
    this.log('client.close', 'User disconnected session');
    return true;
  }

  private setStatus(newStatus: ConnectionStatus) {
    if (this._status !== newStatus) {
      this._status = newStatus;
      this.emit('statuschange', newStatus);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    // Heartbeat every 20 seconds to keep connection alive and verify health
    this._heartbeatInterval = setInterval(() => {
      if (this._status === 'connected' && this.session) {
        this.log('client.heartbeat', 'Ping check');
      }
    }, 20000);
  }

  private stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = undefined;
    }
  }

  private scheduleReconnect() {
    if (this._userRequestedDisconnect || !this._autoReconnect) return;
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      this.log('client.reconnect', `Max reconnect attempts (${this._maxReconnectAttempts}) reached.`);
      this.setStatus('disconnected');
      return;
    }

    this._reconnectAttempts++;
    this.setStatus('reconnecting');
    const delay = Math.min(1000 * Math.pow(2, this._reconnectAttempts - 1), 15000);
    this.log('client.reconnect', `Attempt ${this._reconnectAttempts}/${this._maxReconnectAttempts} in ${delay}ms`);

    this._reconnectTimer = setTimeout(() => {
      if (!this._userRequestedDisconnect && this._lastConfig) {
        this.connect(this._lastConfig);
      }
    }, delay);
  }

  public send(parts: Part | Part[], turnComplete: boolean = true) {
    if (this._status !== 'connected' || !this.session) {
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }
    this.session.sendClientContent({ turns: parts, turnComplete });
    this.log(`client.send`, parts);
  }

  public sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
    if (this._status !== 'connected' || !this.session) {
      return;
    }
    chunks.forEach((chunk) => {
      if (chunk.mimeType.startsWith('audio/')) {
        this.session!.sendRealtimeInput({ audio: chunk });
      } else if (chunk.mimeType.startsWith('image/') || chunk.mimeType.startsWith('video/')) {
        this.session!.sendRealtimeInput({ video: chunk });
      } else {
        (this.session! as any).sendRealtimeInput({ media: chunk });
      }
    });
  }

  public sendToolResponse(toolResponse: LiveClientToolResponse) {
    if (this._status !== 'connected' || !this.session) {
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }
    if (toolResponse.functionResponses && toolResponse.functionResponses.length) {
      this.session.sendToolResponse({
        functionResponses: toolResponse.functionResponses,
      });
    }
    this.log(`client.toolResponse`, { toolResponse });
  }

  protected async onMessage(message: LiveServerMessage) {
    if (message.setupComplete) {
      this.emit('setupcomplete');
      return;
    }

    // Process Function Calling from model
    if (message.toolCall) {
      this.log('server.toolCall', message.toolCall);
      this.emit('toolcall', message.toolCall);

      // Execute each function call and route responses back automatically
      if (message.toolCall.functionCalls && message.toolCall.functionCalls.length > 0) {
        const responses: any[] = [];
        for (const call of message.toolCall.functionCalls) {
          try {
            const { result, summaryText } = await executeAccountingTool(call.name, call.args);
            responses.push({
              id: call.id,
              name: call.name,
              response: { output: result },
            });
            this.emit('toolexecuted', {
              name: call.name,
              args: call.args,
              result,
              summary: summaryText,
            });
          } catch (err: any) {
            console.error(`Error executing tool ${call.name}:`, err);
            responses.push({
              id: call.id,
              name: call.name,
              response: { error: err.message || 'Error executing tool' },
            });
          }
        }

        // Send tool responses back to session so Gemini reads and speaks the results
        if (responses.length > 0) {
          this.sendToolResponse({ functionResponses: responses });
        }
      }
      return;
    }

    if (message.toolCallCancellation) {
      this.log('receive.toolCallCancellation', message);
      this.emit('toolcallcancellation', message.toolCallCancellation);
      return;
    }

    if (message.serverContent) {
      const { serverContent } = message;
      if ('interrupted' in serverContent) {
        this.log('receive.serverContent', 'interrupted');
        this.emit('interrupted');
        return;
      }
      if ('turnComplete' in serverContent) {
        this.log('server.send', 'turnComplete');
        this.emit('turncomplete');
      }

      if (serverContent.modelTurn) {
        let parts: Part[] = serverContent.modelTurn.parts || [];

        const audioParts = parts.filter((p) =>
          p.inlineData?.mimeType?.startsWith('audio/pcm')
        );
        const base64s = audioParts.map((p) => p.inlineData?.data);
        const otherParts = difference(parts, audioParts);

        base64s.forEach((b64) => {
          if (b64) {
            const data = base64ToArrayBuffer(b64);
            this.emit('audio', data);
          }
        });

        if (!otherParts.length) {
          return;
        }

        parts = otherParts;
        const content: LiveServerContent = { modelTurn: { parts } };
        this.emit('content', content);
        this.log(`server.content`, message);
      }
    }
  }

  protected onError(e: ErrorEvent) {
    this.stopHeartbeat();
    console.error('GenAILiveClient error:', e);
    const message = `GenAI Live Error: ${e.message}`;
    this.log(`server.${e.type}`, message);
    this.emit('error', e);

    if (!this._userRequestedDisconnect && this._autoReconnect) {
      this.scheduleReconnect();
    } else {
      this.setStatus('disconnected');
    }
  }

  protected onOpen() {
    this.setStatus('connected');
    this.emit('open');
  }

  protected onClose(e: CloseEvent) {
    this.stopHeartbeat();
    let reason = e.reason || '';
    if (reason.toLowerCase().includes('error')) {
      const prelude = 'ERROR]';
      const idx = reason.indexOf(prelude);
      if (idx > 0) {
        reason = reason.slice(idx + prelude.length + 1);
      }
    }

    this.log(`server.close`, `Disconnected: ${reason || 'normal closure'}`);
    this.emit('close', e);

    if (!this._userRequestedDisconnect && this._autoReconnect) {
      this.scheduleReconnect();
    } else {
      this.setStatus('disconnected');
    }
  }

  protected log(type: string, message: string | object) {
    this.emit('log', {
      type,
      message,
      date: new Date(),
    });
  }
}
