import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RouteCard from '../components/RouteCard';

describe('RouteCard Component', () => {
  const defaultProps = {
    route: 'North Route',
    routeInvoices: [
      {
        id: '1',
        date: '2026-03-23T10:00:00Z',
        shopName: 'Test Shop A',
        totalBill: 1000,
        paidAmount: 500
      },
      {
        id: '2',
        date: '2026-03-23T11:00:00Z',
        shopName: 'Test Shop B',
        totalBill: 2000,
        paidAmount: 2000 // Fully paid, should not display by default
      }
    ],
    onDeleteRoute: vi.fn(),
    openInstallmentModal: vi.fn(),
    onRenameRoute: vi.fn(),
    onRenameShop: vi.fn()
  };

  it('should render the route name', () => {
    // Act
    render(<RouteCard {...defaultProps} />);

    // Assert
    expect(screen.getByText('North Route')).toBeInTheDocument();
  });

  it('should call onDeleteRoute when delete button is clicked', () => {
    // Arrange
    render(<RouteCard {...defaultProps} />);

    // Act
    const deleteBtn = screen.getByTitle('Delete Route');
    fireEvent.click(deleteBtn);

    // Assert
    expect(defaultProps.onDeleteRoute).toHaveBeenCalledWith('North Route');
  });

  it('should open edit input when edit button is clicked', () => {
    // Arrange
    render(<RouteCard {...defaultProps} />);

    // Act
    const editBtn = screen.getByTitle('Rename Route');
    fireEvent.click(editBtn);

    // Assert
    const input = screen.getByDisplayValue('North Route');
    expect(input).toBeInTheDocument();
  });

  it('should call onRenameRoute when a new name is submitted', () => {
    // Arrange
    render(<RouteCard {...defaultProps} />);

    // Act
    const editBtn = screen.getByTitle('Rename Route');
    fireEvent.click(editBtn);
    
    const input = screen.getByDisplayValue('North Route');
    fireEvent.change(input, { target: { value: 'South Route ' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Assert
    expect(defaultProps.onRenameRoute).toHaveBeenCalledWith('North Route', 'South Route');
  });

  it('should reveal invoices with remaining balances when expanded', () => {
     // Arrange
     render(<RouteCard {...defaultProps} />);

     // Act - user clicks header to expand card
     const headerText = screen.getByText('North Route'); 
     const header = headerText.parentElement.parentElement.parentElement; // Walk up to the clickable header container
     fireEvent.click(header); 
 
     // Assert
     expect(screen.getByText('Test Shop A')).toBeInTheDocument();
     // Test Shop B is fully paid, might not be visible based on condition `if (remaining <= 0) return null;`
     expect(screen.queryByText('Test Shop B')).not.toBeInTheDocument();
  });
});
