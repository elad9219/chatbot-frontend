import React from 'react';
import './ChatFooter.css';

function ChatFooter() {
    return (
        <footer className="chat-footer" aria-label="Credits and chat language">
            <div className="chat-footer-attribution">
                <a className="chat-footer-logo" href="https://www.themoviedb.org"
                    aria-label="The Movie Database">
                    <img src={`${process.env.PUBLIC_URL}/tmdb-logo.svg`} alt="TMDB"
                        width="90" height="12" />
                </a>
                <p>
                    This product uses the TMDB API but is not endorsed or certified by TMDB.
                </p>
            </div>
            <p id="chat-language-hint" className="chat-language-hint">
                Ask in English. Movie titles can be entered in other languages, but matches may vary.
            </p>
        </footer>
    );
}

export default ChatFooter;