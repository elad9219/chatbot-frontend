import React from 'react';
import './ChatWelcome.css';

type ChatWelcomeProps = {
    onSelect: (query: string) => void;
    disabled: boolean;
};

function ChatWelcome({ onSelect, disabled }: ChatWelcomeProps) {
    return (
        <section className="chat-welcome" aria-labelledby="chat-welcome-title">
            <span className="chat-welcome-icon" aria-hidden="true">🎬</span>
            <h3 id="chat-welcome-title">What are we watching tonight?</h3>
            <p>
                Find a movie by title or discover a comedy under 100 minutes.
                Start with a quick search below, or use the suggestions above.
            </p>
            <div className="chat-welcome-actions">
                <button type="button" disabled={disabled}
                    onClick={() => onSelect('Find the movie The Matrix')}>
                    Try The Matrix
                </button>
                <button type="button" disabled={disabled}
                    onClick={() => onSelect('Look up Inception')}>
                    Try Inception
                </button>
            </div>
            <p className="chat-welcome-hint">
                Chat in English. You can search in one message or let me ask for the title.
            </p>
        </section>
    );
}

export default ChatWelcome;