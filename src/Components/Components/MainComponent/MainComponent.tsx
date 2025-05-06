import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
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
    const sessionId = useRef(uuidv4()).current;
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
        }
        return text;
    };

    const send = async (override?: string) => {
        const queryText = override ?? input;
        if (!queryText.trim()) return;
        setMessages(m => [...m, { from: 'user', text: queryText }]);
        setInput('');
        try {
        const res = await axios.post<{ fulfillmentText: string }>(
            globals.api.chat,
            { session: sessionId, queryResult: { queryText } }
        );
        const botText = formatResponseText(res.data.fulfillmentText);
        setMessages(m => [...m, { from: 'bot', text: botText }]);
        } catch {
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
            axios
            .get<string>(`${globals.api.chat}/random`)
            .then(res => setMessages(m => [...m, { from: 'bot', text: res.data }]))
            .catch(() => setMessages(m => [...m, { from: 'bot', text: '❌ Error contacting server' }]));
        } else {
            const category = parts[1];
            axios
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
            <div ref={chatEndRef} />
        </div>

        <div className="input-area">
            <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={`Type something… e.g. "joke about money"`}
            />
            <button onClick={() => send()} className="send-button" aria-label="Send">
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
