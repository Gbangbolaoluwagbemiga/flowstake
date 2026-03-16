"use client"

import { Hero } from "@/components/Hero";
import { SwapPanel } from "@/components/SwapPanel";
import { EventFeed } from "@/components/EventFeed";
import { IntentActivity } from "@/components/IntentActivity";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <main className="min-h-screen px-4 pb-20 max-w-7xl mx-auto">
      <nav className="flex justify-between items-center py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black italic">F</div>
          <span className="text-xl font-black tracking-tighter">FlowStake</span>
        </div>
        <ConnectButton />
      </nav>

      <Hero />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
        <div className="flex flex-col items-center lg:items-end gap-8">
          <SwapPanel />
        </div>
        <div className="flex flex-col gap-8">
          <EventFeed />
          <IntentActivity />
        </div>
      </div>
    </main>
  );
}
