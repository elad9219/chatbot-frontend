import React, { useState } from 'react';
import axios from 'axios';
import globals from '../../../utils/globals';
import { v4 as uuidv4 } from 'uuid';

const MainComponent: React.FC = () => {
    const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [sessionId] = useState(() => uuidv4());

    const send = async () => {
        if (!input) return;
        setMessages(m => [...m, { from: 'user', text: input }]);
        setInput('');
        try {
        const res = await axios.post<{ fulfillmentText: string }>(
            globals.api.chat,
            { session: sessionId, queryResult: { queryText: input } }
        );
        setMessages(m => [...m, { from: 'bot', text: res.data.fulfillmentText }]);
        } catch (err) {
        console.error(err);
        setMessages(m => [...m, { from: 'bot', text: 'Error contacting server' }]);
        }
    };

    // אם הטקסט הוא JSON, מעבירים אותו לפרה עם pretty-print
    const renderText = (text: string, from: string) => {
        if (from === 'bot') {
        try {
            const obj = JSON.parse(text);
            return (
            <pre style={{
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                margin: 0,
                padding: '4px',
                background: '#f5f5f5',
                borderRadius: '4px'
            }}>
                {JSON.stringify(obj, null, 2)}
            </pre>
            );
        } catch {
            // לא JSON, פשוט חוזרים לטקסט רגיל
        }
        }
        return text;
    };

    return (
        <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
        <h2>🚀 Chatbot</h2>
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
                <b>{m.from === 'user' ? 'You' : 'Bot'}:</b>{' '}
                {renderText(m.text, m.from)}
            </div>
            ))}
        </div>
        <div>
            <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="write here.."
            style={{ width: '80%', padding: '8px' }}
            />
            <button onClick={send} style={{ padding: '8px 12px', marginLeft: 8 }}>
            Send
            </button>
        </div>
        </div>
    );
};

export default MainComponent;
