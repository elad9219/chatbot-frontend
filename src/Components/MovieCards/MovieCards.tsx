import React from 'react';
import './MovieCards.css';

export type MovieSummary = {
    id: number;
    title: string;
    overview: string;
    releaseDate: string;
    posterPath: string | null;
};

function MovieCards({ movies }: { movies: MovieSummary[] }) {
    return (
        <ul className="movie-cards" aria-label="Movie recommendations">
            {movies.map(movie => {
                const year = /^\d{4}/.exec(movie.releaseDate)?.[0];
                const poster = movie.posterPath && /^\/[a-zA-Z0-9_.-]+$/.test(movie.posterPath)
                    ? `https://image.tmdb.org/t/p/w342${movie.posterPath}`
                    : null;

                return (
                    <li key={movie.id} className="movie-card">
                        <div className="movie-card-heading">
                            {poster && <img src={poster} alt="" loading="lazy" width="342" height="513" />}
                            <div>
                                <h3>{movie.title}</h3>
                                {year && <span className="movie-card-year">{year}</span>}
                            </div>
                        </div>
                        {movie.overview && (
                            <details className="movie-card-overview">
                                <summary aria-label={`Overview of ${movie.title}`}>Overview</summary>
                                <p>{movie.overview}</p>
                            </details>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

export default MovieCards;