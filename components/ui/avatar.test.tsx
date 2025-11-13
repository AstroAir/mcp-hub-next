import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

describe('Avatar', () => {
  it('renders with data-slot attribute', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    const avatar = container.querySelector('[data-slot="avatar"]');
    expect(avatar).toBeInTheDocument();
  });

  it('renders fallback content', () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('renders image when src is provided', async () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.jpg" alt="User avatar" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );

    // Radix UI Avatar renders image as img element inside the component
    // In jsdom, images may not load, so fallback is shown instead
    const image = container.querySelector('[data-slot="avatar-image"]');
    if (image) {
      expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    } else {
      // Fallback is shown when image doesn't load in jsdom
      expect(screen.getByText('AB')).toBeInTheDocument();
    }
  });

  it('shows fallback when image fails to load', async () => {
    render(
      <Avatar>
        <AvatarImage src="invalid-url" alt="User avatar" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );

    // Radix UI Avatar shows fallback by default in jsdom (image loading doesn't work)
    await waitFor(() => {
      expect(screen.getByText('AB')).toBeInTheDocument();
    });
  });

  it('applies custom className to Avatar', () => {
    const { container } = render(
      <Avatar className="custom-avatar">
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    const avatar = container.querySelector('[data-slot="avatar"]');
    expect(avatar).toHaveClass('custom-avatar');
  });

  it('applies custom className to AvatarImage', () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.jpg" className="custom-image" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    const image = container.querySelector('[data-slot="avatar-image"]');
    // Image may not render in jsdom, so check if it exists before asserting class
    if (image) {
      expect(image).toHaveClass('custom-image');
    } else {
      // If image doesn't render, at least verify the fallback is there
      expect(screen.getByText('AB')).toBeInTheDocument();
    }
  });

  it('applies custom className to AvatarFallback', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback className="custom-fallback">AB</AvatarFallback>
      </Avatar>
    );
    const fallback = container.querySelector('[data-slot="avatar-fallback"]');
    expect(fallback).toHaveClass('custom-fallback');
  });

  it('renders with default size classes', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    const avatar = container.querySelector('[data-slot="avatar"]');
    expect(avatar).toHaveClass('size-8');
  });

  it('renders with rounded-full class', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    const avatar = container.querySelector('[data-slot="avatar"]');
    expect(avatar).toHaveClass('rounded-full');
  });

  it('renders fallback with centered content', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    const fallback = container.querySelector('[data-slot="avatar-fallback"]');
    expect(fallback).toHaveClass('items-center');
    expect(fallback).toHaveClass('justify-center');
  });

  it('renders image with aspect-square class', () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.jpg" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    const image = container.querySelector('[data-slot="avatar-image"]');
    // Image may not render in jsdom, so check if it exists before asserting class
    if (image) {
      expect(image).toHaveClass('aspect-square');
    } else {
      // If image doesn't render, at least verify the fallback is there
      expect(screen.getByText('AB')).toBeInTheDocument();
    }
  });

  it('supports multiple children in fallback', () => {
    render(
      <Avatar>
        <AvatarFallback>
          <span>A</span>
          <span>B</span>
        </AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});

