import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { toast } from 'sonner';
import { ACTIVE_CHAIN_ID, CHAIN_LABEL, KAIROS_API_URL } from '@/lib/chain';
import { ethers } from 'ethers';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string;
  connect: () => void;
  disconnect: () => void;
  refreshBalance: () => void;
  chainOk: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0.0000");
  const [chainOk, setChainOk] = useState<boolean>(true);
  const providerRef = useRef<ethers.BrowserProvider | null>(null);

  // Load address from localStorage on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem('kairos_address');
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, []);

  // Fetch balance from backend
  const failCountRef = useRef(0);
  const refreshBalance = useCallback(async () => {
    if (!address) return;
    try {
      const response = await fetch(`${KAIROS_API_URL}/api/chain/balance/${address}`);
      const data = await response.json();
      if (typeof data?.balance === 'string') setBalance(data.balance);
      failCountRef.current = 0; // Reset on success
    } catch (error) {
      failCountRef.current++;
      if (failCountRef.current <= 2) {
        console.warn('[Kairos] Backend unreachable — balance polling paused');
      }
      // Silently fail after first 2 logs to avoid console spam
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      refreshBalance();
      // Poll every 30s instead of 10s to reduce console noise
      const interval = setInterval(refreshBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [address, refreshBalance]);

  const connect = useCallback(async () => {
    try {
      const eth = (window as any).ethereum;
      if (!eth) {
        toast.error('No EVM wallet detected. Please install MetaMask (or a compatible wallet).');
        return;
      }
      providerRef.current = new ethers.BrowserProvider(eth);

      // Request accounts
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
      const userAddress = accounts?.[0];
      if (!userAddress) throw new Error('No account selected');

      // Ensure wallet is on the active chain
      const hexChainId = await eth.request({ method: 'eth_chainId' });
      const current = Number.parseInt(String(hexChainId), 16);
      if (current !== ACTIVE_CHAIN_ID) {
        setChainOk(false);
        try {
          await eth.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${ACTIVE_CHAIN_ID.toString(16)}` }],
          });
          setChainOk(true);
        } catch {
          toast.error(`Please switch your wallet network to ${CHAIN_LABEL} (chainId ${ACTIVE_CHAIN_ID}).`);
        }
      } else {
        setChainOk(true);
      }

      setAddress(userAddress);
      localStorage.setItem('kairos_address', userAddress);
      toast.success('Wallet connected!');
      refreshBalance();
    } catch (error: any) {
      console.error('Connection failed:', error);
      toast.error('Failed to connect wallet');
    }
  }, [refreshBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance("0.0000");
    localStorage.removeItem('kairos_address');
    toast.info('Wallet disconnected');
  }, []);

  return (
    <WalletContext.Provider value={{
      isConnected: !!address,
      address,
      balance,
      connect,
      disconnect,
      refreshBalance,
      chainOk
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
