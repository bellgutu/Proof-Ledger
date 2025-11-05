"use client";
import React, { useState } from 'react';
import { useRealEstate } from '@/contexts/real-estate-context';
import { useWallet } from '@/contexts/wallet-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, Upload, AlertCircle, Loader2 } from 'lucide-react';

export const PropertyListingCard = () => {
  const { actions } = useRealEstate();
  const { walletState } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    value: '',
    tokenSupply: '',
    propertyType: 'residential',
    images: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await actions.createPropertyListing({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        value: formData.value,
        tokenSupply: formData.tokenSupply,
        tokensIssued: '0',
        propertyType: formData.propertyType as any,
        images: [], // Would handle image upload separately
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        value: '',
        tokenSupply: '',
        propertyType: 'residential',
        images: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          List Property for Tokenization
        </CardTitle>
        <CardDescription>
          Tokenize your real estate asset and make it available for fractional ownership
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!walletState.isConnected ? (
             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                Please connect your wallet to list a property.
                </AlertDescription>
            </Alert>
        ): (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Property Title
            </label>
            <Input
              id="title"
              placeholder="e.g., Luxury Villa - Milan"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Describe the property features, location advantages, etc."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <Input
                id="location"
                placeholder="e.g., Milan, Italy"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="propertyType" className="text-sm font-medium">
                Property Type
              </label>
              <Select value={formData.propertyType} onValueChange={(value) => handleChange('propertyType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="value" className="text-sm font-medium">
                Property Value (USD)
              </label>
              <Input
                id="value"
                type="number"
                placeholder="e.g., 2500000"
                value={formData.value}
                onChange={(e) => handleChange('value', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="tokenSupply" className="text-sm font-medium">
                Token Supply
              </label>
              <Input
                id="tokenSupply"
                type="number"
                placeholder="e.g., 1000000"
                value={formData.tokenSupply}
                onChange={(e) => handleChange('tokenSupply', e.target.value)}
                required
              />
            </div>
          </div>

          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-300">
              Your property will be submitted for verification by trusted oracles. 
              You'll need at least 3 verifications to be fully verified.
            </AlertDescription>
          </Alert>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {isLoading ? 'Listing Property...' : 'List Property for Tokenization'}
          </Button>
        </form>
        )}
      </CardContent>
    </Card>
  );
};
