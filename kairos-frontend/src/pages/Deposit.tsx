import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ArrowRight, Copy, ExternalLink, Wallet, Zap } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ACTIVE_CHAIN_ID, ACTIVE_NATIVE_SYMBOL, CHAIN_LABEL, addressUrl, KAIROS_API_URL } from '@/lib/chain';

export default function Deposit() {
  const { isConnected, address, balance, refreshBalance, chainOk } = useWallet();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address || '');
    toast.success('Wallet address copied to clipboard');
  };

  const handleFaucetRequest = async () => {
    if (!address) return;

    // Rate limiting check
    const lastRequest = localStorage.getItem(`faucet_${address}`);
    if (lastRequest && Date.now() - parseInt(lastRequest) < 24 * 60 * 60 * 1000) {
      toast.error('Daily limit reached. Try again in 24h.');
      return;
    }

    setIsRequesting(true);
    try {
      toast.info(`Requesting funds from ${CHAIN_LABEL} faucet...`);
      const res = await fetch(`${KAIROS_API_URL}/api/chain/faucet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, amount: "0.01" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Funds requested! Balance will update shortly.');
        localStorage.setItem(`faucet_${address}`, Date.now().toString());
        refreshBalance();
      } else {
        if (res.status === 429 || data.error?.includes('429')) {
          toast.error('Daily limit reached. Try again in 24h.');
          localStorage.setItem(`faucet_${address}`, Date.now().toString());
          return;
        }
        toast.error('Faucet failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      toast.error('Network error: Is the backend running?');
    } finally {
      setIsRequesting(false);
    }
  };

  const faucetCooldown = (() => {
    if (!address) return false;
    const lastRequest = localStorage.getItem(`faucet_${address}`);
    if (lastRequest) {
      return Date.now() - parseInt(lastRequest) < 24 * 60 * 60 * 1000;
    }
    return false;
  })();

  return (
    <Layout>
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="pb-3">
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Fund Your Wallet</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Fund your EVM wallet with {ACTIVE_NATIVE_SYMBOL} to start querying agents
            </p>
          </div>

          {!isConnected ? (
            <div className="glass-card p-8 text-center">
              <Wallet className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Connect your EVM wallet (MetaMask) to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {!chainOk && (
                <div className="glass-card p-4 border border-rose-500/20 bg-rose-500/5 text-sm text-rose-200">
                  Your wallet is not on {CHAIN_LABEL}. Switch to chainId {ACTIVE_CHAIN_ID} to see correct balances and receipts.
                </div>
              )}
              {/* Current Balance */}
              <div className="glass-card glass-shimmer p-6">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Your Balance</p>
              <p className="text-4xl font-display font-semibold">
                  <span className="kairos-gradient">{parseFloat(balance).toFixed(4)}</span>
                  <span className="text-lg text-muted-foreground ml-2">HSK</span>
                </p>
                <div className="flex items-center gap-1.5 mt-3">
                  <span className="status-dot" />
                  <span className="text-xs text-muted-foreground">{CHAIN_LABEL}</span>
                </div>
              </div>

              {/* Deposit Address */}
              <div className="glass-card glass-shimmer p-6">
                <h2 className="text-lg font-medium text-foreground mb-4">Your Wallet Address</h2>
                <div className="bg-secondary rounded-lg p-4 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-2">
                    Send {ACTIVE_NATIVE_SYMBOL} on {CHAIN_LABEL} to this address
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono text-foreground/80 break-all">
                      {address}
                    </code>
                    <button
                      onClick={handleCopyAddress}
                      className="p-2 hover:bg-secondary/80 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <a
                  href={addressUrl(address || '')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View on Explorer
                </a>
              </div>

              {/* Testnet Faucet */}
              <div className="glass-card glass-shimmer p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-lg font-medium text-foreground">Testnet Faucet</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Request a small amount of {ACTIVE_NATIVE_SYMBOL} on {CHAIN_LABEL} to try Kairos agents. Limited to one request per 24 hours.
                </p>
                <button
                  onClick={handleFaucetRequest}
                  disabled={isRequesting || faucetCooldown}
                  className={cn(
                    'w-full py-3 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-all',
                    isRequesting || faucetCooldown
                      ? 'bg-secondary/50 text-muted-foreground cursor-not-allowed border border-border/10'
                      : 'glass-primary text-primary-foreground hover:opacity-90'
                  )}
                >
                  {isRequesting ? (
                    <>Requesting...</>
                  ) : faucetCooldown ? (
                    <>Faucet Limit Reached (24h)</>
                  ) : (
                    <>
                      Request Testnet Funds
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
