
"use client";
import React, { useState } from 'react';
import { useGemstones } from '@/contexts/gemstones-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gem, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';

export const GemstoneRegistration = () => {
  const { actions } = useGemstones();
  const { walletState } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    origin: '',
    carat: '',
    color: '',
    clarity: '',
    cut: '',
    certification: '',
    certificationNumber: '',
    price: '',
    imageHash: '',
  });

  const gemstoneTypes = ['diamond', 'ruby', 'sapphire', 'emerald', 'tanzanite', 'opal', 'other'];
  const certificationTypes = ['GIA', 'IGI', 'AGS', 'EGL', 'None'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await actions.registerGemstone({
        ...formData,
        carat: parseFloat(formData.carat),
        type: formData.type as any,
      });

      // Reset form
      setFormData({
        type: '', origin: '', carat: '', color: '', clarity: '',
        cut: '', certification: '', certificationNumber: '', price: '', imageHash: ''
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  if (!walletState.isConnected) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gem className="h-5 w-5" />
                    Register Gemstone
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                    Please connect your wallet to register a gemstone.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gem className="h-5 w-5" />
          Register Gemstone
        </CardTitle>
        <CardDescription>
          Create a verifiable digital twin of your precious stone on the blockchain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Gemstone Type</label>
              <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {gemstoneTypes.map(type => <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Origin/Mine</label>
              <Input placeholder="e.g., Merelani Hills, TZ" value={formData.origin} onChange={(e) => handleChange('origin', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Carat</label>
              <Input type="number" step="0.01" placeholder="e.g., 5.2" value={formData.carat} onChange={(e) => handleChange('carat', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <Input placeholder="e.g., Blue-Violet" value={formData.color} onChange={(e) => handleChange('color', e.target.value)} required />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-medium">Clarity</label>
              <Input placeholder="e.g., VVS" value={formData.clarity} onChange={(e) => handleChange('clarity', e.target.value)} required />
            </div>
          </div>
          
           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cut</label>
              <Input placeholder="e.g., Oval" value={formData.cut} onChange={(e) => handleChange('cut', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price ($)</label>
              <Input type="number" step="0.01" placeholder="e.g., 12500" value={formData.price} onChange={(e) => handleChange('price', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <label className="text-sm font-medium">Certification Body</label>
              <Select value={formData.certification} onValueChange={(value) => handleChange('certification', value)}>
                <SelectTrigger><SelectValue placeholder="e.g., GIA" /></SelectTrigger>
                <SelectContent>
                  {certificationTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Certification ID</label>
              <Input placeholder="e.g., GIA123456" value={formData.certificationNumber} onChange={(e) => handleChange('certificationNumber', e.target.value)} />
            </div>
          </div>
          
           <div className="space-y-2">
              <label className="text-sm font-medium">Image Hash (IPFS)</label>
              <Input placeholder="e.g., Qm..." value={formData.imageHash} onChange={(e) => handleChange('imageHash', e.target.value)} required/>
            </div>

          <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-500/20">
            <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <AlertDescription className="text-purple-800 dark:text-purple-300">
              <strong>Immutable Provenance:</strong> Each gemstone's journey from mine to market is tracked, preventing fraud and ensuring ethical sourcing.
            </AlertDescription>
          </Alert>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4 mr-2" />}
            {isLoading ? 'Registering Gemstone...' : 'Register Gemstone'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
