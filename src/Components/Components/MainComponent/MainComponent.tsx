import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosInstance'; // Replaced standard axios
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
    const [isWakingUp, setIsWakingUp] = useState(false); // State for cold start message
    const sessionId = useRef(uuidv4()).current;
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isWakingUp]);

    // Listeners for cold start events
    useEffect(() => {
        const handleWakeUp = () => setIsWakingUp(true);
        const handleAwake = () => setIsWakingUp(false);

        window.addEventListener('serverWakingUp', handleWakeUp);
        window.addEventListener('serverAwake', handleAwake);

        return () => {
            window.removeEventListener('serverWakingUp', handleWakeUp);
            window.removeEventListener('serverAwake', handleAwake);
        };
    }, []);

    // Helper to pretty‑print JSON (cities) or just return text
    const formatResponseText = (text: string) => {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                return parsed
                .map(obj =>
                    Object.entries(obj)
                    .map(([k, v], i, arr) => `   ${k}: ${v}${i < arr.length - 1 ? ',' : ''}`)
                    .join('\n')
                )
                .join('\n\n');
            }
        } catch {
            // Not JSON, return as is
        }
        return text;
    };

    const send = async (override?: string) => {
        const queryText = override ?? input;
        if (!queryText.trim()) return;
        setMessages(m => [...m, { from: 'user', text: queryText }]);
        setInput('');
        
        try {
            const res = await axiosInstance.post<{ fulfillmentText: string }>(
                globals.api.chat,
                { session: sessionId, queryResult: { queryText } }
            );
            const botText = formatResponseText(res.data.fulfillmentText);
            setMessages(m => [...m, { from: 'bot', text: botText }]);
        } catch {
            setIsWakingUp(false); // Ensure waking up message is cleared on final fail
            setMessages(m => [...m, { from: 'bot', text: '❌ Error contacting server' }]);
        }
    };

    const handleExample = (q: string) => {
        if (q === 'help') {
            setMessages(m => [
                ...m,
                {
                    from: 'bot',
                    text:
                        `👋 You can try:\n` +
                        `• random joke\n` +
                        `• i want to search a city\n` +
                        `• joke about money\n` +
                        `• city of Paris\n` +
                        `• please give me a joke\n` +
                        `\nOr type your own query…`,
                },
            ]);
        }
        else if (q.startsWith('random')) {
            const parts = q.split(' ');
            if (parts.length === 2) {
                axiosInstance
                .get<string>(`${globals.api.chat}/random`)
                .then(res => setMessages(m => [...m, { from: 'bot', text: res.data }]))
                .catch(() => setMessages(m => [...m, { from: 'bot', text: '❌ Error contacting server' }]));
            } else {
                const category = parts[1];
                axiosInstance
                .get<string>(`${globals.api.chat}/random/${encodeURIComponent(category)}`)
                .then(res => setMessages(m => [...m, { from: 'bot', text: res.data }]))
                .catch(() => setMessages(m => [...m, { from: 'bot', text: '❌ Error contacting server' }]));
            }
        }
        else {
            send(q);
        }
    };

    return (
        <div className="MainComponent">
            <h2 className="title">🤖 Chatbot</h2>

            <div className="examples-bar">
                <span className="examples-label">Examples:</span>
                {exampleQueries.map((q, i) => (
                <button key={i} className="example-button" onClick={() => handleExample(q)}>
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
                
                {/* Waking Up Message Indicator */}
                {isWakingUp && (
                    <div className="waking-up-msg">
                        ⏳ השרת החינמי מתעורר (יכול לקחת כ-10 שניות), אנא המתן...
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="input-area">
                <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={`Type something… e.g. "joke about money"`}
                disabled={isWakingUp} // Prevent typing while waking up
                />
                <button onClick={() => send()} className="send-button" aria-label="Send" disabled={isWakingUp}>
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