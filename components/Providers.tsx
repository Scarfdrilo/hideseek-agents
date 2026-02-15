'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import { useState, useEffect, type ReactNode } from 'react'
import { monad, REOWN_PROJECT_ID } from '@/lib/wagmi'
import { createConfig, http } from 'wagmi'

// Wagmi config with ConnectKit
const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: [monad],
    transports: {
      [monad.id]: http(),
    },
    walletConnectProjectId: REOWN_PROJECT_ID,
    appName: 'HideSeek Agents',
    appDescription: 'Autonomous AI Worlds on Monad',
  })
)

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        retryDelay: 1000,
        staleTime: 30000,
      },
    },
  }))
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch - only render wallet providers on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Return children without wallet providers during SSR
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider 
          mode="dark"
          customTheme={{
            "--ck-accent-color": "#00ff88",
            "--ck-accent-text-color": "#000000",
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
