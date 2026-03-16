"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, CheckCircle2, Clock } from "lucide-react";

const intents = [
    { id: '0x3a...12', user: '0x3B...8E41', amount: '100.0', delta: '+0.0042', status: 'Active', time: '2m ago' },
    { id: '0x7b...ea', user: '0x9E...f291', amount: '50.0', delta: '+0.0021', status: 'Settled', time: '12m ago' },
];

export function IntentActivity() {
    return (
        <Card className="glass border-white/5 w-full max-w-xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <History size={16} className="text-white/60" />
                    Intent Registry
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-none">3 Active Sessions</Badge>
                </div>
                <div className="space-y-2">
                    {intents.map((intent, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                {intent.status === 'Settled' ? <CheckCircle2 size={16} className="text-green-400" /> : <Clock size={16} className="text-blue-400 animate-pulse" />}
                                <div className="space-y-1">
                                    <div className="text-xs font-bold text-white">{intent.amount} wstETH</div>
                                    <div className="text-[10px] text-slate-500 font-mono italic">ID: {intent.id}</div>
                                </div>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-[10px] font-black uppercase text-green-400">+{intent.delta} ETH Yield</div>
                                <div className="text-[10px] text-slate-500 uppercase font-medium">{intent.time}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
