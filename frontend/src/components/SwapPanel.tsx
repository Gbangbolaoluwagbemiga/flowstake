"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDown, Coins, Zap, Trophy, Loader2 } from "lucide-react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CONTRACT_ADDRESSES } from '@/contracts/addresses';
import FlowStakeHookABI from '@/contracts/FlowStakeHook.json';
import MockWstETHABI from '@/contracts/MockWstETH.json';

export function SwapPanel() {
    const { isConnected, address, chainId } = useAccount();
    const { switchChain } = useSwitchChain();
    const [amount, setAmount] = useState("");
    const [isApproving, setIsApproving] = useState(false);
    const [demoMode, setDemoMode] = useState(false);

    const { writeContract: approveToken } = useWriteContract();
    const { writeContract: submitIntent } = useWriteContract();

    const { data: balanceData } = useReadContract({
        address: CONTRACT_ADDRESSES.UNICHAIN_SEPOLIA.MOCK_WSTETH,
        abi: MockWstETHABI as any,
        functionName: 'balanceOf',
        args: [address],
        chainId: 1301,
        query: { enabled: !!address }
    });

    const balance = balanceData ? formatEther(balanceData as bigint) : '0';

    const handleApprove = async () => {
        if (!amount) return;
        if (chainId !== 1301) {
            switchChain({ chainId: 1301 });
            return;
        }
        setIsApproving(true);
        try {
            approveToken({
                address: CONTRACT_ADDRESSES.UNICHAIN_SEPOLIA.MOCK_WSTETH,
                abi: MockWstETHABI as any,
                functionName: 'approve',
                args: [CONTRACT_ADDRESSES.UNICHAIN_SEPOLIA.FLOW_STAKE_HOOK, parseEther(amount)],
                chainId: 1301,
            });
        } catch (error) { console.error(error); }
    };

    const handleSubmit = async () => {
        if (!amount) return;
        if (demoMode) {
            toast.success("Simulation Started: Reactive Network Callback Pending...");
            setTimeout(() => toast.success("Demo Mode: Cross-Chain Settlement Successful!"), 3000);
            return;
        }
        if (chainId !== 1301) {
            switchChain({ chainId: 1301 });
            return;
        }
        try {
            submitIntent({
                address: CONTRACT_ADDRESSES.UNICHAIN_SEPOLIA.FLOW_STAKE_HOOK,
                abi: FlowStakeHookABI as any,
                functionName: 'submitIntent',
                args: [
                    CONTRACT_ADDRESSES.UNICHAIN_SEPOLIA.MOCK_WSTETH,
                    "0x0000000000000000000000000000000000000000",
                    parseEther(amount),
                    86400
                ],
                chainId: 1301,
            });
        } catch (error) { console.error(error); }
    };

    return (
        <Card className="glass glow-blue border-white/10 max-w-md w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
                        Yield Swap
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Demo</span>
                        <Switch checked={demoMode} onCheckedChange={setDemoMode} />
                    </div>
                </div>
                <CardDescription className="text-slate-400">Preserve your staking yield during settlement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                            <Coins size={14} /> Sell LST
                        </label>
                        {isConnected && (
                            <span onClick={() => setAmount(balance)} className="text-xs text-blue-400/70 font-medium cursor-pointer hover:text-blue-400 transition-colors">
                                Balance: {Number(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} wstETH
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Input type="number" placeholder="0.0" className="bg-transparent border-none text-2xl font-bold focus-visible:ring-0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                        <Button variant="ghost" className="bg-blue-500/10 text-blue-400 font-bold hover:bg-blue-500/20">wstETH</Button>
                    </div>
                </div>
                <div className="flex justify-center -my-2 relative z-10">
                    <div className="bg-slate-900 border border-white/10 p-2 rounded-full cursor-pointer hover:bg-slate-800 transition-colors">
                        <ArrowDown size={18} className="text-blue-400" />
                    </div>
                </div>
                <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Settlement Target</label>
                    <div className="flex gap-2">
                        <Input type="number" placeholder="0.0" readOnly className="bg-transparent border-none text-2xl font-bold focus-visible:ring-0 cursor-default" />
                        <Button variant="ghost" className="bg-slate-500/10 text-slate-400 font-bold">USDC</Button>
                    </div>
                </div>
                <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10 space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Estimated Preserved Yield</span>
                        <span className="text-green-400 font-bold flex items-center gap-1"><Trophy size={10} /> +0.0042 ETH</span>
                    </div>
                    <div className="flex justify-between text-xs"><span className="text-slate-400 font-medium">Network Efficiency</span><span className="text-white font-bold">99.9%</span></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleApprove} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-6 rounded-xl border border-white/5 cursor-pointer">1. Approve</Button>
                    <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 rounded-xl glow-blue cursor-pointer">2. Swap & Stake</Button>
                </div>
            </CardContent>
        </Card>
    );
}
