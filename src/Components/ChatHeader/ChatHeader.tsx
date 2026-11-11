import React, { useRef, useState } from 'react';
import './ChatHeader.css';

type ChatHeaderProps = {
    busy: boolean;
    onNewChat: () => void;
    onSelect: (query: string) => void;
};

function ChatHeader({ busy, onNewChat, onSelect }: ChatHeaderProps) {
    const [helpOpen, setHelpOpen] = useState(false);
    const helpRef = useRef<HTMLDetailsElement>(null);
    const helpButtonRef = useRef<HTMLElement>(null);

    const closeHelp = () => {
        setHelpOpen(false);
        if (helpRef.current) helpRef.current.open = false;
    };

    const selectExample = (query: string) => {
        if (busy) return;
        closeHelp();
        helpButtonRef.current?.focus();
        onSelect(query);
    };

    return (
        <header className="chat-header">
            <div className="chat-header-brand">
                <span className="chat-header-mark" aria-hidden="true">
                    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor"
                        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="5" width="22" height="22" rx="5" />
                        <path d="M10 5v22M22 5v22M5 11h5M5 21h5M22 11h5M22 21h5" />
                        <path d="m14 12 6 4-6 4z" fill="currentColor" stroke="none" />
                    </svg>
                </span>
                <div>
                    <span className="chat-header-eyebrow">YOUR MOVIE COMPANION</span>
                    <h1>Movie <span>Night</span></h1>
                </div>
            </div>
            <div className="chat-header-actions">
                <button type="button" disabled={busy} onClick={() => {
                    closeHelp();
                    onNewChat();
                }}>
                    New chat
                </button>
                <details className="chat-header-help" ref={helpRef}
                    onToggle={event => setHelpOpen(event.currentTarget.open)} onKeyDown={event => {
                    if (event.key === 'Escape') {
                        closeHelp();
                        helpButtonRef.current?.focus();
                    }
                }}>
                    <summary ref={helpButtonRef}>Help</summary>
                    {helpOpen && <div className="chat-help-panel">
                        <h2>A few ways to get started</h2>
                        <p>Chat in English. Search for a movie directly, or ask me to find one by title.</p>
                        <button type="button" disabled={busy}
                            onClick={() => selectExample('Find the movie The Matrix')}>
                            Find the movie The Matrix
                        </button>
                        <button type="button" disabled={busy}
                            onClick={() => selectExample('Comedy under 100 minutes')}>
                            Comedy under 100 minutes
                        </button>
                        <p>After a comedy search, use the suggestion in the reply to narrow it to under 90 minutes.</p>
                        <p>New chat clears the conversation and starts fresh. Your draft stays in the input.</p>
                    </div>}
                </details>
            </div>
            <p className="chat-header-subtitle">
                Find a film by title. Discover a short comedy. Make it a movie night.
            </p>
        </header>
    );
}

export default ChatHeader;