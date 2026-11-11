import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import axiosInstance from '../../utils/axiosInstance';
import MainComponent from './MainComponent';

jest.mock('axios', () => ({
    create: () => ({ get: jest.fn(), post: jest.fn() }),
    isAxiosError: (error?: { isAxiosError?: boolean }) => error?.isAxiosError === true,
}));
jest.mock('uuid', () => ({ v4: () => 'welcome-test-session' }));

test('starts a suggested search once without sending a welcome message', async () => {
    const previousFlag = process.env.REACT_APP_MOVIE_DEMO;
    process.env.REACT_APP_MOVIE_DEMO = 'true';

    try {
        (axiosInstance.get as jest.Mock).mockResolvedValue({ data: { status: 'UP' } });
        const post = axiosInstance.post as jest.Mock;
        post.mockResolvedValue({ data: { fulfillmentText: 'Movie search completed.' } });

        render(<MainComponent />);

        expect(screen.getByRole('heading', {
            name: 'What are we watching tonight?',
        })).toBeVisible();
        expect(post).not.toHaveBeenCalled();

        const shortcut = screen.getByRole('button', { name: 'Try The Matrix' });
        fireEvent.click(shortcut);
        expect(shortcut).toBeDisabled();
        fireEvent.click(shortcut);

        expect(await screen.findByText('Movie search completed.')).toBeVisible();
        expect(post).toHaveBeenCalledTimes(1);
        expect(post).toHaveBeenCalledWith(
            expect.any(String),
            {
                session: 'welcome-test-session',
                queryResult: { queryText: 'Find the movie The Matrix' },
            },
            expect.objectContaining({ signal: expect.anything() })
        );
        expect(screen.queryByRole('heading', {
            name: 'What are we watching tonight?',
        })).not.toBeInTheDocument();
    } finally {
        if (previousFlag === undefined) {
            delete process.env.REACT_APP_MOVIE_DEMO;
        } else {
            process.env.REACT_APP_MOVIE_DEMO = previousFlag;
        }
    }
});