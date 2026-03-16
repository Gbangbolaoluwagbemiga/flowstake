"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Terminal } from "lucide-react";
import { useWatchContractEvent } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/contracts/addresses';
import FlowStakeHookABI from '@/contracts/FlowStakeHook.json';
import { formatEther } from 'viem';

export function EventFeed() {
    const [events, setEvents] = useState<any[]>([]);

    useWatchContractEvent({
        address: CONTRACT_ADDRESSES.UNICHAIN_SEPOLIA.FLOW_STAKE_HOOK,
        abi: FlowStakeHookABI as any,
        eventName: 'IntentSubmitted',
        onLogs(logs) {
            const newEvents = logs.map(log => ({
                id: (log as any).args.intentId,
                user: (log as any).args.user,
                amount: formatEther((log as any).args.amount || BigInt(0)),
                timestamp: new Date().toLocaleTimeString(),
                type: 'IntentSubmitted'
            }));
            setEvents(prev => [...newEvents, ...prev].slice(0, 5));
        },
    });

    return (
        <Card className="glass border-white/5 w-full max-w-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Activity size={16} className="text-blue-400" />
                    Live Hook Feed
                </CardTitle>
                <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">Reactive Listening</Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {events.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm font-medium italic">Waiting for on-chain events...</div>
                ) : (
                    events.map((ev, i) => (
                        <div key={i} className="flex items-start gap-4 p-3 bg-white/5 rounded-lg border border-white/5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-blue-500/20 p-2 rounded-md"><Terminal size={14} className="text-blue-400" /></div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-center"><span className="text-xs font-black uppercase text-blue-400">{ev.type}</span><span className="text-[10px] text-slate-500">{ev.timestamp}</span></div>
                                <p className="text-xs text-slate-300 break-all font-mono">User {(ev.user || "").slice(0, 6)}... submitted {ev.amount} wstETH</p>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
