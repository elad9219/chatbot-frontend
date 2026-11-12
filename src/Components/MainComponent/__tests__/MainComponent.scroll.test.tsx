import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import axiosInstance from '../../../utils/axiosInstance';
import MainComponent from '../MainComponent';

jest.mock('axios', () => ({
    create: () => ({ get: jest.fn(), post: jest.fn() }),
    isAxiosError: (error?: { isAxiosError?: boolean }) => error?.isAxiosError === true,
}));
jest.mock('uuid', () => ({ v4: () => 'scroll-test-session' }));

const get = axiosInstance.get as jest.Mock;
const post = axiosInstance.post as jest.Mock;

beforeEach(() => {
    get.mockReset().mockResolvedValue({ data: { status: 'UP' } });
    post.mockReset();
});

test('scrolls the conversation during waiting and after the reply without moving its ancestors', async () => {
    let resolveReply!: (reply: { data: { fulfillmentText: string } }) => void;
    post.mockReturnValue(new Promise(resolve => { resolveReply = resolve; }));
    const { container } = render(<div data-testid="outer-page"><MainComponent /></div>);
    const outerPage = screen.getByTestId('outer-page');
    const chatWindow = container.querySelector<HTMLDivElement>('.chat-window')!;
    let contentHeight = 1400;

    // JSDOM has no layout; provide conversation dimensions explicitly.
    Object.defineProperties(chatWindow, {
        scrollHeight: { configurable: true, get: () => contentHeight },
        clientHeight: { configurable: true, value: 400 },
    });
    outerPage.scrollTop = 37;
    const previousPageScroll = document.documentElement.scrollTop;
    document.documentElement.scrollTop = 19;

    try {
        const input = screen.getByRole('textbox', { name: 'Chat message' });
        fireEvent.change(input, { target: { value: 'Find the movie The Matrix' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        await screen.findByRole('status', { name: 'Bot is responding' });

        expect(chatWindow.scrollTop).toBe(1000);
        expect(outerPage.scrollTop).toBe(37);
        expect(document.documentElement.scrollTop).toBe(19);

        contentHeight = 2200;
        await act(async () => {
            resolveReply({ data: { fulfillmentText: 'Here are your movie matches.' } });
        });

        expect(screen.getByText('Here are your movie matches.')).toBeVisible();
        expect(chatWindow.scrollTop).toBe(1800);
        expect(outerPage.scrollTop).toBe(37);
        expect(document.documentElement.scrollTop).toBe(19);
    } finally {
        document.documentElement.scrollTop = previousPageScroll;
    }
});