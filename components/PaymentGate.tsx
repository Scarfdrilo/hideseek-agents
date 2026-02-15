'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { ConnectKitButton } from 'connectkit'

// Admin wallet - can see all worlds without paying
const ADMIN_WALLET = '0x0a01A6423D6bF683F53BFd8C18bF8375E1aA50BC'.toLowerCase()

// Contract address
const CONTRACT_ADDRESS = '0x769c418EA0481f45Ea20071186cd00013Ef7eD28'

// Simplified ABI for the functions we need
const CONTRACT_ABI = [
  {
    name: 'payEntryFee',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'hasAccess',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'user', type: 'address' }
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getAgent',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'owner', type: 'address' },
        { name: 'entryFee', type: 'uint256' },
        { name: 'isActive', type: 'bool' },
        { name: 'totalVisits', type: 'uint256' },
        { name: 'totalEarned', type: 'uint256' },
      ]
    }],
  },
] as const

interface PaymentGateProps {
  agentId: number
  worldName: string
  entryFee?: string
  children: React.ReactNode
}

export default function PaymentGate({ agentId, worldName, entryFee = '0.003', children }: PaymentGateProps) {
  const { address, isConnected } = useAccount()
  const [hasAccess, setHasAccess] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [resolvedAgentId, setResolvedAgentId] = useState<number>(agentId)
  
  // Check if admin
  const isAdmin = address?.toLowerCase() === ADMIN_WALLET
  
  // For named worlds (agentId=0), try to find the on-chain agent by name
  useEffect(() => {
    const resolveAgentId = async () => {
      if (agentId === 0 && worldName) {
        try {
          const res = await fetch('/api/agents')
          const data = await res.json()
          if (data.success && data.agents) {
            const agent = data.agents.find((a: any) => 
              a.name.toLowerCase() === worldName.toLowerCase()
            )
            if (agent) {
              setResolvedAgentId(agent.id)
            }
          }
        } catch (e) {
          console.error('Failed to resolve agent ID:', e)
        }
      }
    }
    resolveAgentId()
  }, [agentId, worldName])
  
  // Check access on contract
  const { data: accessData, refetch: refetchAccess } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasAccess',
    args: address ? [BigInt(resolvedAgentId), address] : undefined,
    query: {
      enabled: !!address && resolvedAgentId > 0,
    }
  })
  
  // Pay entry fee
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract()
  
  // Wait for transaction
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })
  
  // Update access state
  useEffect(() => {
    setIsChecking(true)
    
    if (isAdmin) {
      setHasAccess(true)
      setIsChecking(false)
      return
    }
    
    if (accessData !== undefined) {
      setHasAccess(accessData as boolean)
      setIsChecking(false)
    } else if (!isConnected) {
      setHasAccess(false)
      setIsChecking(false)
    }
  }, [accessData, isAdmin, isConnected])
  
  // Refetch access after successful payment
  useEffect(() => {
    if (isTxSuccess) {
      setTimeout(() => {
        refetchAccess()
      }, 2000)
    }
  }, [isTxSuccess, refetchAccess])
  
  // Handle payment
  const handlePay = () => {
    if (resolvedAgentId <= 0) {
      console.error('Cannot pay for agent ID 0 or negative')
      return
    }
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'payEntryFee',
      args: [BigInt(resolvedAgentId)],
      value: parseEther(entryFee),
    })
  }
  
  // Admin bypass - show world directly
  if (isAdmin && isConnected) {
    return (
      <div>
        <div style={{
          position: 'fixed',
          top: 70,
          right: 20,
          background: 'rgba(255,215,0,0.2)',
          border: '1px solid gold',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          fontFamily: 'monospace',
          color: 'gold',
          zIndex: 100,
        }}>
          👑 ADMIN MODE - 0xscarf.eth
        </div>
        {children}
      </div>
    )
  }
  
  // Preview worlds not on-chain yet (no resolved agent ID) - show free
  if (resolvedAgentId === 0 && agentId === 0) {
    return (
      <div>
        <div style={{
          position: 'fixed',
          top: 70,
          right: 20,
          background: 'rgba(0,255,136,0.2)',
          border: '1px solid #00ff88',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          fontFamily: 'monospace',
          color: '#00ff88',
          zIndex: 100,
        }}>
          🎮 PREVIEW MODE - Not on-chain yet
        </div>
        {children}
      </div>
    )
  }
  
  // Has access - show world
  if (hasAccess && isConnected) {
    return <>{children}</>
  }
  
  // Payment gate UI
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a12 0%, #1a0a2e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: 'monospace',
    }}>
      {/* World preview (blurred) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        filter: 'blur(20px) brightness(0.3)',
        overflow: 'hidden',
      }}>
        {children}
      </div>
      
      {/* Payment modal */}
      <div style={{
        position: 'relative',
        background: 'rgba(0,0,0,0.95)',
        border: '2px solid #ff69b4',
        borderRadius: 16,
        padding: '40px 50px',
        textAlign: 'center',
        maxWidth: 400,
        boxShadow: '0 0 60px rgba(255,105,180,0.3)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        
        <h1 style={{ 
          color: '#ff69b4', 
          fontSize: 24, 
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}>
          {worldName}&apos;s World
        </h1>
        
        <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>
          Este mundo requiere pago para acceder
        </p>
        
        <div style={{
          background: 'rgba(255,105,180,0.1)',
          border: '1px solid rgba(255,105,180,0.3)',
          borderRadius: 8,
          padding: '16px',
          marginBottom: 24,
        }}>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>
            ENTRY FEE
          </div>
          <div style={{ 
            color: '#00ff88', 
            fontSize: 28, 
            fontWeight: 'bold',
          }}>
            {entryFee} MON
          </div>
        </div>
        
        {!isConnected ? (
          <div>
            <p style={{ color: '#666', fontSize: 12, marginBottom: 16 }}>
              Conecta tu wallet para continuar
            </p>
            <ConnectKitButton.Custom>
              {({ show }) => (
                <button
                  onClick={show}
                  style={{
                    background: 'linear-gradient(90deg, #ff69b4, #ff1493)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '14px 32px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  🔗 Connect Wallet
                </button>
              )}
            </ConnectKitButton.Custom>
          </div>
        ) : isChecking ? (
          <div style={{ color: '#888' }}>
            ⏳ Verificando acceso...
          </div>
        ) : (
          <div>
            <button
              onClick={handlePay}
              disabled={isWritePending || isTxLoading}
              style={{
                background: isWritePending || isTxLoading 
                  ? '#444' 
                  : 'linear-gradient(90deg, #00ff88, #00cc66)',
                color: isWritePending || isTxLoading ? '#888' : '#000',
                border: 'none',
                borderRadius: 8,
                padding: '14px 32px',
                fontSize: 16,
                fontWeight: 'bold',
                cursor: isWritePending || isTxLoading ? 'wait' : 'pointer',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: 1,
                width: '100%',
              }}
            >
              {isWritePending ? '⏳ Confirmando...' : 
               isTxLoading ? '⏳ Procesando...' :
               isTxSuccess ? '✅ ¡Pagado!' :
               `💰 Pagar ${entryFee} MON`}
            </button>
            
            {isTxSuccess && (
              <p style={{ color: '#00ff88', fontSize: 12, marginTop: 12 }}>
                ✅ Pago exitoso! Cargando mundo...
              </p>
            )}
            
            <p style={{ 
              color: '#555', 
              fontSize: 10, 
              marginTop: 16,
              lineHeight: 1.5,
            }}>
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
