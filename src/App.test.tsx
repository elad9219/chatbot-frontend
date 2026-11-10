import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import axiosInstance from './utils/axiosInstance';
import App from './App';

jest.mock('axios', () => ({
    create: () => ({ get: jest.fn(), post: jest.fn() }),
}));
jest.mock('uuid', () => ({ v4: () => 'test-session' }));

const get = axiosInstance.get as jest.Mock;
const post = axiosInstance.post as jest.Mock;
const healthy = { data: { status: 'UP' } };

function typeAndSend(text: string) {
    const input = screen.getByRole('textbox', { name: 'Chat message' });
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: 'Enter' });
    return input;
}

beforeEach(() => {
    get.mockReset();
    post.mockReset();
});

test('warms silently when the page opens', async () => {
    get.mockResolvedValue(healthy);
    render(<App />);

    expect(get).toHaveBeenCalledWith(expect.stringContaining('/actuator/health'), expect.any(Object));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
});

test('waits for the same health check, then sends the message once', async () => {
    let resolveHealth!: (response: typeof healthy) => void;
    get.mockReturnValue(new Promise(resolve => { resolveHealth = resolve; }));
    post.mockResolvedValue({ data: { fulfillmentText: 'Hello!' } });
    render(<App />);

    const input = typeAndSend('Hi');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText(/server is waking up/i, {}, { timeout: 2500 })).toBeVisible();
    expect(get).toHaveBeenCalledTimes(1);
    expect(post).not.toHaveBeenCalled();

    await act(async () => { resolveHealth(healthy); });
    expect(await screen.findByText('Hello!')).toBeVisible();
    expect(post).toHaveBeenCalledTimes(1);
});

test('cancels a queued message while the silent health check continues', async () => {
    let resolveHealth!: (response: typeof healthy) => void;
    get.mockReturnValue(new Promise(resolve => { resolveHealth = resolve; }));
    render(<App />);

    const input = typeAndSend('Hi');
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }, { timeout: 2500 }));
    await act(async () => { resolveHealth(healthy); });

    expect(input).toHaveValue('Hi');
    expect(post).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('keeps the draft and never automatically repeats a failed POST', async () => {
    get.mockResolvedValue(healthy);
    post.mockRejectedValue(new Error('Network Error'));
    render(<App />);

    const input = typeAndSend('Hi');

    expect(await screen.findByRole('alert')).toHaveTextContent(/message may have arrived/i);
    expect(input).toHaveValue('Hi');
    expect(post).toHaveBeenCalledTimes(1);
});

test('reports an empty reply without clearing the draft', async () => {
    get.mockResolvedValue(healthy);
    post.mockResolvedValue({ data: { fulfillmentText: '[]' } });
    render(<App />);

    const input = typeAndSend('city of Paris');

    expect(await screen.findByRole('alert')).toHaveTextContent(/empty reply/i);
    expect(input).toHaveValue('city of Paris');
    expect(post).toHaveBeenCalledTimes(1);
});

test('ignores an HTML wake page and waits for an UP response', async () => {
    jest.useFakeTimers();
    try {
        get.mockResolvedValueOnce({ data: '<html>Starting</html>' }).mockResolvedValueOnce(healthy);
        post.mockResolvedValue({ data: { fulfillmentText: 'Hello!' } });
        render(<App />);
        typeAndSend('Hi');

        await act(async () => { await Promise.resolve(); });
        expect(post).not.toHaveBeenCalled();

        await act(async () => { jest.advanceTimersByTime(2500); });
        expect(get).toHaveBeenCalledTimes(2);
        expect(post).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Hello!')).toBeVisible();
    } finally {
        jest.useRealTimers();
    }
});