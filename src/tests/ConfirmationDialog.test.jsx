import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

describe('ConfirmationDialog Component', () => {
  it('should render the dialog with correct title and message', () => {
    // Arrange
    const title = 'Delete Item?';
    const message = 'Are you sure you want to delete this item?';

    // Act
    render(
      <ConfirmationDialog 
        title={title} 
        message={message} 
        onConfirm={() => {}} 
        onCancel={() => {}} 
      />
    );

    // Assert
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    // Arrange
    const onConfirmMock = vi.fn();
    render(
      <ConfirmationDialog 
        title="Test" 
        message="Test" 
        onConfirm={onConfirmMock} 
        onCancel={() => {}} 
      />
    );

    // Act
    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmButton);

    // Assert
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    // Arrange
    const onCancelMock = vi.fn();
    render(
      <ConfirmationDialog 
        title="Test" 
        message="Test" 
        onConfirm={() => {}} 
        onCancel={onCancelMock} 
      />
    );

    // Act
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    // Assert
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('should use custom confirm and cancel text when provided', () => {
    // Arrange
    render(
      <ConfirmationDialog 
        title="Test" 
        message="Test" 
        onConfirm={() => {}} 
        onCancel={() => {}}
        confirmText="Yes, delete"
        cancelText="No, keep"
      />
    );

    // Assert
    expect(screen.getByRole('button', { name: /Yes, delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /No, keep/i })).toBeInTheDocument();
  });
});
