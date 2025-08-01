"use client";

import React, { useState } from 'react';
import { RefreshCcw, Handshake, Vote, CheckCircle, XCircle } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function ToolsPage() {
    const { walletState, walletActions } = useWallet();
    const { isConnected, ethBalance } = walletState;
    const { setEthBalance } = walletActions;
    const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
    const [lpTokens, setLpTokens] = useState(0);

    const [proposal, setProposal] = useState({
      title: 'Upgrade Protocol v2.0',
      description: 'This proposal suggests a major protocol upgrade to improve efficiency and reduce gas fees by 30%.',
      votesYes: 520,
      votesNo: 280,
      hasVoted: false,
    });

    const handleAddLiquidity = () => {
      const ethAmount = 0.5;
      if (ethBalance < ethAmount) {
        console.log("Not enough ETH for liquidity pool!");
        return;
      }
      setIsAddingLiquidity(true);
      setTimeout(() => {
        setEthBalance(prev => parseFloat((prev - ethAmount).toFixed(4)));
        setLpTokens(prev => prev + 100);
        setIsAddingLiquidity(false);
      }, 2000);
    };

    const handleVote = (voteType: 'yes' | 'no') => {
      if (!isConnected || proposal.hasVoted) return;
      setProposal(prev => ({
        ...prev,
        votesYes: voteType === 'yes' ? prev.votesYes + 1 : prev.votesYes,
        votesNo: voteType === 'no' ? prev.votesNo + 1 : prev.votesNo,
        hasVoted: true,
      }));
    };

    const totalVotes = proposal.votesYes + proposal.votesNo;
    const yesPercentage = totalVotes > 0 ? ((proposal.votesYes / totalVotes) * 100) : 0;

    return (
      <div className="container mx-auto p-0 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-bold text-primary"><Handshake size={24} className="mr-2"/> Liquidity Pool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Provide liquidity to earn trading fees and rewards.</p>
              <div className="p-4 bg-background rounded-md border">
                <p className="text-sm text-muted-foreground">Your LP Tokens:</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-lg font-bold text-foreground">{lpTokens} LP</span>
                  <span className="text-green-400 font-semibold">0.3% Trading Fees</span>
                </div>
              </div>
              <p className="text-sm text-foreground">
                Current Pool: <span className="font-semibold">ETH/USDC</span>
              </p>
              <Button
                onClick={handleAddLiquidity}
                disabled={!isConnected || isAddingLiquidity || ethBalance < 0.5}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isAddingLiquidity ? (
                  <span className="flex items-center">
                    <RefreshCcw size={16} className="mr-2 animate-spin" /> Adding...
                  </span>
                ) : (
                  'Add 0.5 ETH Liquidity'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-bold text-primary"><Vote size={24} className="mr-2"/> Decentralized Governance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Participate in the future of the protocol by voting on proposals.</p>
              <div className="p-4 bg-background rounded-md border space-y-4">
                <h3 className="text-xl font-bold text-foreground">{proposal.title}</h3>
                <p className="text-sm text-muted-foreground">{proposal.description}</p>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="flex items-center text-green-400 font-medium"><CheckCircle size={16} className="mr-2"/>Yes</span>
                            <span className="text-muted-foreground">{proposal.votesYes} ({yesPercentage.toFixed(1)}%)</span>
                        </div>
                         <Progress value={yesPercentage} className="h-2 [&>div]:bg-green-500" />
                    </div>
                    <div>
                         <div className="flex justify-between items-center text-sm mb-1">
                            <span className="flex items-center text-red-400 font-medium"><XCircle size={16} className="mr-2"/>No</span>
                            <span className="text-muted-foreground">{proposal.votesNo} ({(100-yesPercentage).toFixed(1)}%)</span>
                        </div>
                        <Progress value={100-yesPercentage} className="h-2 [&>div]:bg-red-500" />
                    </div>
                </div>
                {!proposal.hasVoted ? (
                    <div className="flex space-x-4 pt-2">
                        <Button onClick={() => handleVote('yes')} disabled={!isConnected} className="w-full bg-green-600 hover:bg-green-700 text-white">Vote Yes</Button>
                        <Button onClick={() => handleVote('no')} disabled={!isConnected} className="w-full bg-red-600 hover:bg-red-700 text-white">Vote No</Button>
                    </div>
                ) : (
                  <p className="text-center text-sm text-primary pt-2">Thank you for your vote!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
};
