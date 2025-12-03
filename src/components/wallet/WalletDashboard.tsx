'use client';

import { useState } from 'react';
import { useWallet, useWalletBalances } from '@/components/wallet-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  QrCode, 
  Copy, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  ExternalLink,
  Coins,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatUnits, parseUnits } from 'ethers';
import { useSendTransaction, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getUSDCAddress } from '@/contracts';
import { AssetMinter } from '@/components/contracts/AssetMinter';
import { ContractTester } from '@/components/contracts/ContractTester';

export function WalletDashboard() {
  const { account, isConnected, chainId } = useWallet();
  const { balances, isLoading: balanceLoading, refreshBalances } = useWalletBalances();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendToken, setSendToken] = useState('ETH');
  const [usdcAmount, setUsdcAmount] = useState('');

  // ETH Send transaction
  const { data: ethTxHash, sendTransaction, isPending: isSendingEth } = useSendTransaction();
  const { isLoading: isConfirmingEth } = useWaitForTransactionReceipt({ hash: ethTxHash });

  // USDC Send transaction
  const { data: usdcTxHash, writeContractAsync: sendUSDC, isPending: isSendingUSDC } = useWriteContract();
  const { isLoading: isConfirmingUSDC } = useWaitForTransactionReceipt({ hash: usdcTxHash });


  const handleCopyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const handleSendETH = async () => {
    if (!sendAddress || !sendAmount || !sendTransaction) return;

    try {
      const amountInWei = parseUnits(sendAmount, 18);
      
      await sendTransaction({
        to: sendAddress as `0x${string}`,
        value: amountInWei,
      });

      toast({
        title: "ETH Sent",
        description: `${sendAmount} ETH sent to ${sendAddress.slice(0, 8)}...`,
      });

      setSendAmount('');
      setSendAddress('');
      refreshBalances();
    } catch (error: any) {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send ETH",
        variant: "destructive",
      });
    }
  };

  const handleSendUSDC = async () => {
    if (!sendAddress || !usdcAmount || !sendUSDC || !chainId) return;

    try {
      const amountWithDecimals = parseUnits(usdcAmount, 6); // USDC has 6 decimals
      const usdcAddress = getUSDCAddress(chainId);

      if(!usdcAddress) {
        throw new Error("USDC not supported on this network.");
      }

      await sendUSDC({
        address: usdcAddress,
        abi: [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ],
        functionName: 'transfer',
        args: [sendAddress as `0x${string}`, amountWithDecimals],
      });

      toast({
        title: "USDC Sent",
        description: `${usdcAmount} USDC sent to ${sendAddress.slice(0, 8)}...`,
      });

      setUsdcAmount('');
      setSendAddress('');
      refreshBalances();
    } catch (error: any) {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send USDC",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Dashboard
          </CardTitle>
          <CardDescription>Connect your wallet to get started</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Balance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Overview
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={refreshBalances}
              disabled={balanceLoading}
            >
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ETH Balance */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">ETH Balance</p>
                    <p className="text-2xl font-bold mt-1">{balances.eth}</p>
                  </div>
                  <Coins className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {/* USDC Balance */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-300 font-medium">USDC Balance</p>
                    <p className="text-2xl font-bold mt-1">{balances.usdc}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Total Value */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-300 font-medium">Total Value</p>
                    <p className="text-2xl font-bold mt-1">{balances.totalUSD}</p>
                  </div>
                  <Wallet className="h-10 w-10 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Address Display */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Your Wallet Address</p>
                <p className="font-mono text-sm mt-1">{account}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyAddress}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    window.open(`https://sepolia.etherscan.io/address/${account}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Explorer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send/Receive Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="receive">Receive</TabsTrigger>
          <TabsTrigger value="assets">My Assets</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AssetMinter />
            <ContractTester />
          </div>
        </TabsContent>

        {/* Send Tab */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" />
                Send Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recipient Address */}
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                />
              </div>

              {/* Token Selection */}
              <div className="space-y-2">
                <Label>Select Token</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={sendToken === 'ETH' ? 'default' : 'outline'}
                    onClick={() => setSendToken('ETH')}
                    className="flex-1"
                  >
                    ETH
                  </Button>
                  <Button
                    type="button"
                    variant={sendToken === 'USDC' ? 'default' : 'outline'}
                    onClick={() => setSendToken('USDC')}
                    className="flex-1"
                  >
                    USDC
                  </Button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.0001"
                  placeholder={sendToken === 'ETH' ? '0.01' : '10.00'}
                  value={sendToken === 'ETH' ? sendAmount : usdcAmount}
                  onChange={(e) => {
                    if (sendToken === 'ETH') {
                      setSendAmount(e.target.value);
                    } else {
                      setUsdcAmount(e.target.value);
                    }
                  }}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Available: {sendToken === 'ETH' ? balances.eth : balances.usdc}</span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => {
                      const available = sendToken === 'ETH' 
                        ? parseFloat(balances.eth.replace(' ETH', ''))
                        : parseFloat(balances.usdc.replace('$', '').replace(' USDC', ''));
                      
                      if (sendToken === 'ETH') {
                        setSendAmount((available * 0.95).toFixed(4)); // Leave some for gas
                      } else {
                        setUsdcAmount(available.toFixed(2));
                      }
                    }}
                  >
                    Max
                  </Button>
                </div>
              </div>

              {/* Send Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={sendToken === 'ETH' ? handleSendETH : handleSendUSDC}
                disabled={
                  !sendAddress || 
                  (sendToken === 'ETH' ? !sendAmount : !usdcAmount) ||
                  (sendToken === 'ETH' ? isSendingEth : isSendingUSDC) ||
                  (sendToken === 'ETH' ? isConfirmingEth : isConfirmingUSDC)
                }
              >
                <Send className="h-4 w-4 mr-2" />
                {sendToken === 'ETH' 
                  ? (isSendingEth || isConfirmingEth ? 'Sending...' : `Send ${sendAmount || '0'} ETH`)
                  : (isSendingUSDC || isConfirmingUSDC ? 'Sending...' : `Send ${usdcAmount || '0'} USDC`)
                }
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receive Tab */}
        <TabsContent value="receive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownLeft className="h-5 w-5" />
                Receive Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code (Placeholder) */}
              <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/50">
                <div className="w-48 h-48 bg-background border rounded-lg flex items-center justify-center mb-4">
                  <QrCode className="h-32 w-32 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan QR code to receive tokens
                </p>
              </div>

              {/* Address Display */}
              <div className="space-y-2">
                <Label>Your Wallet Address</Label>
                <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all">
                  {account}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyAddress}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Address
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      window.open(`https://sepolia.etherscan.io/address/${account}`, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Explorer
                  </Button>
                </div>
              </div>

              {/* Supported Tokens */}
              <div className="space-y-2">
                <Label>Supported Tokens</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 border rounded-lg flex items-center gap-2">
                    <Coins className="h-5 w-5 text-blue-500" />
                    <span>ETH</span>
                  </div>
                  <div className="p-3 border rounded-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <span>USDC</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>My Digital Assets</CardTitle>
              <CardDescription>
                Digital Twins minted on ProofLedgerCore
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserAssetsList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for user assets
function UserAssetsList() {
  const { contractData } = useWallet();
  const { toast } = useToast();

  if (contractData?.assetsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!contractData?.userAssets || contractData.userAssets.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No assets found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Mint your first digital asset using the Overview tab
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contractData.userAssets.map((asset, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-4xl">
              {asset.assetType === 1 ? '🏠' : 
               asset.assetType === 2 ? '💎' : '🌾'}
            </div>
            <div className="p-4">
              <h4 className="font-semibold">
                {asset.assetType === 1 ? 'Real Estate' :
                 asset.assetType === 2 ? 'Luxury Good' : 'Commodity'}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Token ID: {asset.tokenId.toString()}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${asset.verified ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                  {asset.verified ? '✓ Verified' : 'Pending'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(asset.tokenId.toString());
                    toast({
                      title: "Copied",
                      description: "Token ID copied to clipboard",
                    });
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
