import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders network monitor heading', () => {
    render(<App />);
    const headingElement = screen.getByText(/Network Monitor/i);
    expect(headingElement).toBeInTheDocument();
});

test('renders role selection', () => {
    render(<App />);
    const roleElement = screen.getByLabelText(/Role/i);
    expect(roleElement).toBeInTheDocument();
});

test('switch roles and tabs', () => {
    render(<App />);
    const roleElement = screen.getByLabelText(/Role/i);
    fireEvent.change(roleElement, { target: { value: 'admin' } });
    const adminTab = screen.getByText(/Admin Tools/i);
    expect(adminTab).toBeInTheDocument();

    fireEvent.change(roleElement, { target: { value: 'viewer' } });
    const captureTab = screen.getByText(/Capture/i);
    expect(captureTab).toBeInTheDocument();
});

test('starts packet capture', () => {
    render(<App />);
    const startButton = screen.getByText(/Start Packet Capture/i);
    fireEvent.click(startButton);
    expect(screen.getByText(/Stop Packet Capture/i)).toBeInTheDocument();
});
