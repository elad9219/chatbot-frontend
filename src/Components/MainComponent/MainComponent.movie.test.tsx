import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import axiosInstance from '../../utils/axiosInstance';
import MainComponent from './MainComponent';

jest.mock('axios', () => ({
    create: () => ({ get: jest.fn(), post: jest.fn() }),
}));
jest.mock('uuid', () => ({ v4: () => 'movie-test-session' }));

test('renders movie cards and sends the refinement in the same session', async () => {
    const previousFlag = process.env.REACT_APP_MOVIE_DEMO;
    process.env.REACT_APP_MOVIE_DEMO = 'true';

    try {
        (axiosInstance.get as jest.Mock).mockResolvedValue({ data: { status: 'UP' } });
        const post = axiosInstance.post as jest.Mock;
        post.mockResolvedValueOnce({
            data: {
                fulfillmentText: 'Here are some comedies under 100 minutes.',
                movies: [{
                    id: 1, title: 'First comedy', overview: 'A test film.',
                    releaseDate: '2000-05-12', posterPath: '/first.jpg',
                }],
                suggestedReply: 'Under 90 minutes',
            },
        }).mockResolvedValueOnce({
            data: {
                fulfillmentText: 'Here are some comedies under 90 minutes.',
                movies: [{
                    id: 2, title: 'Shorter comedy', overview: '',
                    releaseDate: '', posterPath: null,
                }],
            },
        });

        render(<MainComponent />);
        fireEvent.click(screen.getByRole('button', { name: 'Comedy under 100 minutes' }));
        expect(await screen.findByRole('heading', { name: 'First comedy' })).toBeVisible();
        expect(screen.getByText('2000')).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: 'Under 90 minutes' }));
        expect(await screen.findByRole('heading', { name: 'Shorter comedy' })).toBeVisible();
        expect(post.mock.calls.map(([, body]) => body)).toEqual([
            { session: 'movie-test-session', queryResult: { queryText: 'Comedy under 100 minutes' } },
            { session: 'movie-test-session', queryResult: { queryText: 'Under 90 minutes' } },
        ]);
    } finally {
        if (previousFlag === undefined) {
            delete process.env.REACT_APP_MOVIE_DEMO;
        } else {
            process.env.REACT_APP_MOVIE_DEMO = previousFlag;
        }
    }
});