import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import axiosInstance from '../../../utils/axiosInstance';
import MainComponent from '../MainComponent';

jest.mock('axios', () => ({
    create: () => ({ get: jest.fn(), post: jest.fn() }),
    isAxiosError: (error?: { isAxiosError?: boolean }) => error?.isAxiosError === true,
}));
jest.mock('uuid', () => ({ v4: () => 'feedback-test-session' }));

const get = axiosInstance.get as jest.Mock;
const post = axiosInstance.post as jest.Mock;

beforeEach(() => {
    get.mockReset().mockResolvedValue({ data: { status: 'UP' } });
    post.mockReset();
});

function sendMessage() {
    const input = screen.getByRole('textbox', { name: 'Chat message' });
    fireEvent.change(input, { target: { value: 'Find the movie The Matrix' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    return input;
}

test('shows a pending bubble only during the request and replaces it with the reply', async () => {
    let resolveReply!: (reply: { data: { fulfillmentText: string } }) => void;
    post.mockReturnValue(new Promise(resolve => { resolveReply = resolve; }));
    render(<MainComponent />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    const input = sendMessage();
    expect(await screen.findByRole('status', { name: 'Bot is responding' })).toBeVisible();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(post).toHaveBeenCalledTimes(1);

    await act(async () => {
        resolveReply({ data: { fulfillmentText: 'Here are your movie matches.' } });
    });

    expect(screen.getByText('Here are your movie matches.')).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(post).toHaveBeenCalledTimes(1);
});

test('removes the pending bubble on failure and preserves the draft without resending', async () => {
    let rejectReply!: (reason: unknown) => void;
    post.mockReturnValue(new Promise((_, reject) => { rejectReply = reject; }));
    render(<MainComponent />);

    const input = sendMessage();
    await screen.findByRole('status', { name: 'Bot is responding' });
    await act(async () => {
        rejectReply({ isAxiosError: true });
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Your message may have arrived');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(input).toHaveValue('Find the movie The Matrix');
    expect(post).toHaveBeenCalledTimes(1);
});