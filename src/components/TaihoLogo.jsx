import React from 'react';

export default function TaihoLogo({ height = 36, showText = true, className = '' }) {
  return (
    <div
      className={`taiho-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        userSelect: 'none'
      }}
      title="TAIHO Kogyo Industrial Platform"
    >
      <div
        style={{
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          padding: '2px 4px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <img
          src="/taiho-logo.svg"
          alt="TAIHO Logo"
          style={{
            height: height - 6,
            width: 'auto',
            display: 'block',
            objectFit: 'contain'
          }}
        />
      </div>
    </div>
  );
}
