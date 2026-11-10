import React, { useState, useRef, useEffect } from 'react';
import axiosInstance, { createBackendReadiness } from '../../../utils/axiosInstance';
import globals from '../../../utils/globals';
import { v4 as uuidv4 } from 'uuid';
import './MainComponent.css';

const exampleQueries = [
    'random joke',
    'i want to search a city',
    'joke about money',
    'city of Paris',
    'please give me a joke',
];

const MainComponent: React.FC = () => {
    const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [phase, setPhase] = useState<'idle' | 'checking' | 'waking' | 'sending'>('idle');
    const [notice, setNotice] = useState('');
    const [sessionId] = useState(() => uuidv4());
    const chatEndRef = useRef<HTMLDivElement>(null);
    const backend = useRef<{
        signal: AbortSignal;
        readiness: ReturnType<typeof createBackendReadiness>;
    } | null>(null);
    const pendingAction = useRef<object | null>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
    }, [messages, phase, notice]);

    useEffect(() => {
        const controller = new AbortController();
        const readiness = createBackendReadiness(controller.signal);
        backend.current = { signal: controller.signal, readiness };
        void readiness.wait().catch(() => {
            // Opening the page warms the backend without showing a status.
        });

        return () => {
            controller.abort();
            backend.current = null;
            pendingAction.current = null;
        };
    }, []);

    const formatResponseText = (text: string) => {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                return parsed
                    .map(obj => Object.entries(obj)
                        .map(([key, value], index, entries) =>
                            `   ${key}: ${value}${index < entries.length - 1 ? ',' : ''}`)
                        .join('\n'))
                    .join('\n\n');
            }
        } catch {
            // Plain text replies are displayed as received.
        }
        return text;
    };

    const runRequest = async (request: (signal: AbortSignal) => Promise<string>, queryText?: string) => {
        const connection = backend.current;
        if (!connection || pendingAction.current) return;

        const action = {};
        pendingAction.current = action;
        setNotice('');
        setPhase('checking');
        let dispatched = false;
        const wakeTimer = setTimeout(() => {
            if (pendingAction.current === action) setPhase('waking');
        }, 800);

        try {
            await connection.readiness.wait();
            if (pendingAction.current !== action) return;
            clearTimeout(wakeTimer);
            setPhase('sending');
            dispatched = true;
            const reply = await request(connection.signal);
            if (pendingAction.current !== action) return;

            const text = formatResponseText(reply);
            if (!text.trim()) {
                setNotice('The server returned an empty reply. You can try again.');
                return;
            }
            if (queryText !== undefined) {
                setMessages(current => [...current, { from: 'user', text: queryText }, { from: 'bot', text }]);
                setInput(current => current === queryText ? '' : current);
            } else {
                setMessages(current => [...current, { from: 'bot', text }]);
            }
        } catch {
            if (pendingAction.current !== action) return;
            connection.readiness.invalidate();
            setNotice(dispatched
                ? (queryText === undefined
                    ? 'The request failed. You can try again.'
                    : 'No reply was received. Your message may have arrived. Send again only if you want to retry.')
                : 'The server is still unavailable. You can try again in a moment.');
        } finally {
            clearTimeout(wakeTimer);
            if (pendingAction.current === action) {
                pendingAction.current = null;
                setPhase('idle');
            }
        }
    };

    const send = (override?: string) => {
        const queryText = override ?? input;
        if (!queryText.trim()) return;
        void runRequest(async signal => {
            const response = await axiosInstance.post<{ fulfillmentText?: string }>(
                globals.api.chat,
                { session: sessionId, queryResult: { queryText } },
                { signal }
            );
            const text = response.data?.fulfillmentText;
            if (typeof text !== 'string') throw new Error('Unexpected chat response');
            return text;
        }, queryText);
    };

    const handleExample = (query: string) => {
        if (query === 'help') {
            setMessages(current => [
                ...current,
                {
                    from: 'bot',
                    text: `👋 You can try:\n${exampleQueries.map(example => `• ${example}`).join('\n')}\n\nOr type your own query…`,
                },
            ]);
        } else if (query === 'random joke') {
            void runRequest(async signal => {
                const response = await axiosInstance.get<string>(`${globals.api.chat}/random`, { signal });
                if (typeof response.data !== 'string' || /^\s*<(?:!doctype html|html)\b/i.test(response.data)) {
                    throw new Error('Unexpected joke response');
                }
                return response.data;
            });
        } else {
            send(query);
        }
    };

    const cancelWaiting = () => {
        pendingAction.current = null;
        setPhase('idle');
    };

    return (
        <div className="MainComponent">
            <h2 className="title">🤖 Chatbot</h2>

            <div className="examples-bar">
                <span className="examples-label">Examples:</span>
                {exampleQueries.map((q, i) => (
                    <button key={i} className="example-button" disabled={phase !== 'idle'} onClick={() => handleExample(q)}>
                        {q}
                    </button>
                ))}
                <button className="help-button" onClick={() => handleExample('help')}>
                    help
                </button>
            </div>

            <div className="chat-window">
                {messages.map((m, i) => (
                    <div key={i} className={`message ${m.from}`}>
                        <b>{m.from === 'user' ? 'You' : 'Bot'}:</b>{' '}
                        <span className="message-text">{m.text}</span>
                    </div>
                ))}

                {phase === 'waking' && (
                    <div className="waking-up-msg">
                        <span role="status">The server is waking up… </span>
                        <button type="button" onClick={cancelWaiting}>Cancel</button>
                    </div>
                )}
                {phase === 'sending' && <p role="status">Waiting for a reply…</p>}
                {notice && <p role="alert">{notice}</p>}
                <div ref={chatEndRef} />
            </div>

            <div className="input-area">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={event => {
                        if (event.key === 'Enter' && !event.nativeEvent.isComposing) send();
                    }}
                    placeholder={`Type something… e.g. "joke about money"`}
                    aria-label="Chat message"
                />
                <button onClick={() => send()} className="send-button" aria-label="Send" disabled={phase !== 'idle'}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#333"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default MainComponent;