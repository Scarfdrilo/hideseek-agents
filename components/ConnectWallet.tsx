'use client'

import { ConnectKitButton } from 'connectkit'

export function ConnectWallet() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, address, ensName }) => {
        return (
          <button 
            className={`wallet-btn ${isConnected ? 'connected' : ''}`}
            onClick={show}
          >
            {isConnecting ? 'Connecting...' : 
             isConnected ? (ensName ?? `${address?.slice(0, 6)}...${address?.slice(-4)}`) : 
             '🔗 Connect Wallet'}
            
            <style jsx>{`
              .wallet-btn {
                padding: 0.6rem 1.2rem;
                background: linear-gradient(45deg, #00ff88, #00cc6a);
                border: none;
                border-radius: 8px;
                color: #000;
                font-weight: bold;
                cursor: pointer;
                font-size: 0.95rem;
                transition: all 0.2s;
              }
              .wallet-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
              }
              .wallet-btn.connected {
                background: #1a1a1a;
                border: 1px solid #00ff88;
                color: #00ff88;
              }
              .wallet-btn.connected:hover {
                background: rgba(0, 255, 136, 0.1);
              }
            `}</style>
          </button>
        )
      }}
    </ConnectKitButton.Custom>
  )
}
