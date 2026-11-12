import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import axiosInstance from '../../../utils/axiosInstance';
import MainComponent from '../MainComponent';

jest.mock('axios', () => ({
    create: () => ({ get: jest.fn(), post: jest.fn() }),
    isAxiosError: (error?: { isAxiosError?: boolean }) => error?.isAxiosError === true,
}));
jest.mock('uuid', () => ({ v4: () => 'language-test-session' }));

test('keeps language guidance visible after a reply and accepts a non-Latin movie title', async () => {
    const previousFlag = process.env.REACT_APP_MOVIE_DEMO;
    process.env.REACT_APP_MOVIE_DEMO = 'true';

    try {
        (axiosInstance.get as jest.Mock).mockResolvedValue({ data: { status: 'UP' } });
        const post = axiosInstance.post as jest.Mock;
        post.mockResolvedValue({ data: { fulfillmentText: 'Movie search completed.' } });
        render(<MainComponent />);

        const input = screen.getByRole('textbox', { name: 'Chat message' });
        const hint = screen.getByText(/Ask in English\. Movie titles/);
        expect(input).toHaveAttribute('aria-describedby', hint.id);
        expect(hint).toBeVisible();
        expect(screen.getByRole('link', { name: 'The Movie Database' }))
            .toHaveAttribute('href', 'https://www.themoviedb.org');

        fireEvent.change(input, { target: { value: 'הערת שוליים' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        await screen.findByText('Movie search completed.');

        expect(post).toHaveBeenCalledTimes(1);
        expect(post.mock.calls[0][1].queryResult.queryText).toBe('הערת שוליים');
        expect(hint).toBeVisible();
    } finally {
        if (previousFlag === undefined) delete process.env.REACT_APP_MOVIE_DEMO;
        else process.env.REACT_APP_MOVIE_DEMO = previousFlag;
    }
});