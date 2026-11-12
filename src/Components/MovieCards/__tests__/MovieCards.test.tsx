import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MovieCards, { MovieSummary } from '../MovieCards';

const movie: MovieSummary = {
    id: 603,
    title: 'The Matrix',
    overview: 'A computer hacker discovers a hidden world.',
    releaseDate: '1999-03-31',
    posterPath: '/matrix.jpg',
};

test('keeps the movie usable when its poster fails to load', () => {
    const { container } = render(<MovieCards movies={[movie]} />);
    const poster = container.querySelector('img');
    expect(poster).not.toBeNull();
    fireEvent.error(poster!);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('No poster')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'The Matrix' })).toBeVisible();

    const link = screen.getByRole('link', {
        name: 'View The Matrix on TMDB (opens in a new tab)',
    });
    expect(link).toHaveAttribute('href', 'https://www.themoviedb.org/movie/603');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});

test.each([null, 'https://untrusted.example/poster.jpg'])(
    'handles missing movie metadata and rejects an unsafe poster path: %s',
    posterPath => {
        const { container } = render(<MovieCards movies={[{
            ...movie, posterPath, releaseDate: '', overview: '   ',
        }]} />);

        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByText('No poster')).toBeVisible();
        expect(screen.getByText('Year unavailable')).toBeVisible();
        expect(screen.getByText('No overview available.')).toBeVisible();
        expect(container.querySelector('details')).toBeNull();
    }
);

test('does not construct a movie link from an invalid identifier', () => {
    render(<MovieCards movies={[{ ...movie, id: -1 }]} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
});