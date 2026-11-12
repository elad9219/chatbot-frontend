import React from 'react';
import './ChatPendingReply.css';

function ChatPendingReply() {
    return (
        <div className="message bot chat-pending-reply" role="status" aria-label="Bot is responding">
            <b aria-hidden="true">Bot:</b>
            <span className="chat-pending-bubble" aria-hidden="true">
                <span />
                <span />
                <span />
            </span>
            <span className="chat-pending-accessible-text">Waiting for a reply…</span>
        </div>
    );
}

export default ChatPendingReply;