import React, { useState } from 'react';
import './MovieCards.css';

export type MovieSummary = {
    id: number;
    title: string;
    overview: string;
    releaseDate: string;
    posterPath: string | null;
};

function MovieCard({ movie }: { movie: MovieSummary }) {
    const [failedPoster, setFailedPoster] = useState<string | null>(null);
    const year = /^\d{4}/.exec(movie.releaseDate)?.[0];
    const poster = movie.posterPath && /^\/[a-zA-Z0-9_.-]+$/.test(movie.posterPath)
        ? `https://image.tmdb.org/t/p/w342${movie.posterPath}`
        : null;
    const movieUrl = Number.isSafeInteger(movie.id) && movie.id > 0
        ? `https://www.themoviedb.org/movie/${movie.id}`
        : null;

    return (
        <li className="movie-card">
            <div className="movie-card-heading">
                {poster && failedPoster !== poster ? (
                    <img className="movie-card-poster" src={poster} alt="" loading="lazy"
                        width="72" height="108" onError={() => setFailedPoster(poster)} />
                ) : (
                    <span className="movie-card-poster movie-card-poster-fallback">
                        No poster
                    </span>
                )}
                <div>
                    <h3>{movie.title}</h3>
                    <span className="movie-card-year">{year ?? 'Year unavailable'}</span>
                </div>
            </div>
            {movie.overview?.trim() ? (
                <details className="movie-card-overview">
                    <summary aria-label={`Overview of ${movie.title}`}>Overview</summary>
                    <p>{movie.overview}</p>
                </details>
            ) : (
                <p className="movie-card-empty">No overview available.</p>
            )}
            {movieUrl && (
                <a className="movie-card-link" href={movieUrl} target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${movie.title} on TMDB (opens in a new tab)`}>
                    View on TMDB <span aria-hidden="true">↗</span>
                </a>
            )}
        </li>
    );
}

function MovieCards({ movies }: { movies: MovieSummary[] }) {
    return (
        <ul className="movie-cards" aria-label="Movie results">
            {movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
        </ul>
    );
}

export default MovieCards;