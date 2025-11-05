
"use client";
import React, { useState } from 'react';
import { useAgriculture } from '@/contexts/agriculture-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sprout, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';

export const AgricultureRegistration = () => {
  const { actions } = useAgriculture();
  const { walletState } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    productType: '',
    origin: '',
    farmer: '',
    harvestDate: '',
    quantity: '',
    qualityScore: '',
    certifications: [] as string[],
    price: '',
  });

  const productTypes = [
    'coffee', 'cocoa', 'tea', 'fruits', 'grains', 'vegetables', 'spices',
  ];

  const certificationOptions = [
    'Organic', 'FairTrade', 'Rainforest Alliance', 'UTZ Certified'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await actions.registerProduct({
        ...formData,
        qualityScore: parseInt(formData.qualityScore),
        certifications: formData.certifications,
        productType: formData.productType as any, // Cast for submission
      });

      // Reset form
      setFormData({
        productType: '',
        origin: '',
        farmer: '',
        harvestDate: '',
        quantity: '',
        qualityScore: '',
        certifications: [],
        price: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  if (!walletState.isConnected) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5" />
                    Register Agricultural Product
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                    Please connect your wallet to register a product.
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
          <Sprout className="h-5 w-5" />
          Register Agricultural Product
        </CardTitle>
        <CardDescription>
          Track your farm products through the supply chain with verified quality data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Type</label>
              <Select value={formData.productType} onValueChange={(value) => handleChange('productType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Origin/Farm Location</label>
              <Input
                placeholder="e.g., Sidama, Ethiopia"
                value={formData.origin}
                onChange={(e) => handleChange('origin', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Farmer/Cooperative</label>
              <Input
                placeholder="e.g., Smallholder Coffee Coop"
                value={formData.farmer}
                onChange={(e) => handleChange('farmer', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Harvest Date</label>
              <Input
                type="date"
                value={formData.harvestDate}
                onChange={(e) => handleChange('harvestDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                placeholder="e.g., 5000 kg"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quality Score</label>
              <Input
                type="number"
                min="1" max="100"
                placeholder="1-100"
                value={formData.qualityScore}
                onChange={(e) => handleChange('qualityScore', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Price/Unit ($)</label>
              <Input
                type="number" step="0.01"
                placeholder="e.g., 8.50"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Certifications</label>
            <div className="flex flex-wrap gap-2">
              {certificationOptions.map(cert => (
                <Badge
                  key={cert}
                  variant={formData.certifications.includes(cert) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCertification(cert)}
                >
                  {cert}
                </Badge>
              ))}
            </div>
          </div>

          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-500/20">
            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-300">
              <strong>Benefits for Farmers:</strong> Get better prices with verified data, access global markets, reduce losses, and earn premiums for sustainability.
            </AlertDescription>
          </Alert>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4 mr-2" />}
            {isLoading ? 'Registering Product...' : 'Register Product'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
