import React, { useState, useRef } from 'react';
import axios from 'axios';
import globals from '../../../utils/globals';
import { v4 as uuidv4 } from 'uuid';

const exampleQueries = [
    'i want to search a city',
    'joke about money',
    'city of Paris',
    'please give me a joke',
    'help'
    ];

    const MainComponent: React.FC = () => {
    const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
    const [input, setInput] = useState('');
    const sessionId = useRef(uuidv4()).current;

    const send = async (text?: string) => {
        const queryText = text ?? input;
        if (!queryText.trim()) return;
        setMessages(m => [...m, { from: 'user', text: queryText }]);
        setInput('');
        try {
        const res = await axios.post<{ fulfillmentText: string }>(
            globals.api.chat,
            { session: sessionId, queryResult: { queryText } }
        );
        setMessages(m => [...m, { from: 'bot', text: res.data.fulfillmentText }]);
        } catch {
        setMessages(m => [...m, { from: 'bot', text: '❌ Error contacting server' }]);
        }
    };

    const handleExample = (q: string) => {
        if (q === 'help') {
        setMessages(m => [...m, { from: 'bot', text:
            `👋 You can try:\n• i want to search a city\n• joke about money\n• city of Paris\n• please give me a joke`
        }]);
        } else {
        send(q);
        }
    };

    return (
        <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
        <h2>🚀 Chatbot</h2>

        {/* פס ההצעות */}
        <div style={{ marginBottom: 10 }}>
            {exampleQueries.map((q, i) => (
            <button
                key={i}
                onClick={() => handleExample(q)}
                style={{
                margin: '0 4px 4px 0',
                padding: '4px 8px',
                borderRadius: 12,
                border: '1px solid #888',
                background: '#f0f0f0',
                cursor: 'pointer'
                }}
            >
                {q}
            </button>
            ))}
        </div>

        <div
            style={{
            maxHeight: 300,
            overflowY: 'auto',
            border: '1px solid #ccc',
            padding: 10,
            marginBottom: 10
            }}
        >
            {messages.map((m, i) => (
            <div
                key={i}
                style={{
                textAlign: m.from === 'user' ? 'right' : 'left',
                margin: '5px 0'
                }}
            >
                <b>{m.from === 'user' ? 'You' : 'Bot'}:</b> {m.text}
            </div>
            ))}
        </div>

        <div>
            <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type something…"
            style={{ width: '80%', padding: '8px' }}
            />
            <button onClick={() => send()} style={{ padding: '8px 12px', marginLeft: 8 }}>
            Send
            </button>
        </div>
        </div>
    );
};

export default MainComponent;
