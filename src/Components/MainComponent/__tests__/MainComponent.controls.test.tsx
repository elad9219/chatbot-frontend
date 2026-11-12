import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { v4 as uuidv4 } from 'uuid';
import axiosInstance from '../../../utils/axiosInstance';
import MainComponent from '../MainComponent';

jest.mock('axios', () => ({
    create: () => ({ get: jest.fn(), post: jest.fn() }),
    isAxiosError: (error?: { isAxiosError?: boolean }) => error?.isAxiosError === true,
}));
jest.mock('uuid', () => ({ v4: jest.fn() }));

const previousFlag = process.env.REACT_APP_MOVIE_DEMO;
const get = axiosInstance.get as jest.Mock;
const post = axiosInstance.post as jest.Mock;

beforeEach(() => {
    process.env.REACT_APP_MOVIE_DEMO = 'true';
    get.mockReset().mockResolvedValue({ data: { status: 'UP' } });
    post.mockReset();
    (uuidv4 as jest.Mock).mockReset()
        .mockReturnValueOnce('first-session').mockReturnValue('second-session');
});

afterEach(() => {
    if (previousFlag === undefined) delete process.env.REACT_APP_MOVIE_DEMO;
    else process.env.REACT_APP_MOVIE_DEMO = previousFlag;
});

test('shows the submitted message while waiting and prevents duplicate sends', async () => {
    let resolveReply!: (reply: { data: { fulfillmentText: string } }) => void;
    post.mockReturnValue(new Promise(resolve => { resolveReply = resolve; }));
    render(<MainComponent />);

    const input = screen.getByRole('textbox', { name: 'Chat message' });
    fireEvent.change(input, { target: { value: 'Find the movie The Matrix' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByRole('status')).toHaveTextContent('Waiting for a reply');
    expect(screen.getByText('Find the movie The Matrix')).toBeVisible();
    expect(screen.getByRole('button', { name: 'New chat' })).toBeDisabled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(post).toHaveBeenCalledTimes(1);

    await act(async () => {
        resolveReply({ data: { fulfillmentText: 'Here is your movie.' } });
    });
    expect(screen.getByText('Here is your movie.')).toBeVisible();
    expect(screen.getAllByText('Find the movie The Matrix')).toHaveLength(1);
});

test('starts a new session, clears replies and preserves the draft', async () => {
    post.mockResolvedValue({ data: { fulfillmentText: 'First conversation reply.' } });
    render(<MainComponent />);
    fireEvent.click(screen.getByRole('button', { name: 'Try The Matrix' }));
    await screen.findByText('First conversation reply.');

    const input = screen.getByRole('textbox', { name: 'Chat message' });
    fireEvent.change(input, { target: { value: 'My next draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'New chat' }));

    expect(screen.queryByText('First conversation reply.')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What are we watching tonight?' })).toBeVisible();
    expect(input).toHaveValue('My next draft');
    expect(input).toHaveFocus();
    expect(post).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(input, { key: 'Enter' });
    await screen.findByText('First conversation reply.');
    expect(post.mock.calls.map(([, body]) => body.session))
        .toEqual(['first-session', 'second-session']);
});

test('opens help without sending a message and runs a selected example once', async () => {
    post.mockResolvedValue({ data: { fulfillmentText: 'Example completed.' } });
    const { container } = render(<MainComponent />);
    fireEvent.click(screen.getByText('Help', { selector: 'summary' }));
    expect(post).not.toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: 'A few ways to get started' })).toBeVisible();

    const panel = screen.getByRole('heading', { name: 'A few ways to get started' }).parentElement!;
    fireEvent.click(within(panel).getByRole('button', { name: 'Find the movie The Matrix' }));
    expect(await screen.findByText('Example completed.')).toBeVisible();
    expect(post).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.chat-header-help')).not.toHaveAttribute('open');
});