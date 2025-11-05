"use client";
import React, { useState } from 'react';
import { useRealEstate } from '@/contexts/real-estate-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Shield, FileText, MapPin, DollarSign, Home, Scale, Loader2 } from 'lucide-react';
import { useTrustLayer } from '@/contexts/trust-layer-context';
import { useToast } from '@/hooks/use-toast';

export const VerificationSubmissionPanel = () => {
  const { state: realEstateState, actions: realEstateActions } = useRealEstate();
  const { state: trustLayerState } = useTrustLayer();
  const { toast } = useToast();

  const [selectedProperty, setSelectedProperty] = useState('');
  const [verificationType, setVerificationType] = useState('');
  const [evidence, setEvidence] = useState('');
  const [source, setSource] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pendingProperties = realEstateState.properties.filter(p => p.verificationStatus === 'pending');

  const verificationTypes = [
    { value: 'title', label: 'Title Verification', icon: FileText, description: 'Confirm property ownership records' },
    { value: 'valuation', label: 'Valuation Confirmation', icon: DollarSign, description: 'Verify property value assessment' },
    { value: 'physical', label: 'Physical Inspection', icon: Home, description: 'Confirm property existence and condition' },
    { value: 'legal', label: 'Legal Clearance', icon: Scale, description: 'Verify no liens or encumbrances' },
    { value: 'location', label: 'Location Verification', icon: MapPin, description: 'Confirm geographic location' },
  ];

  const handleSubmitVerification = async () => {
    if (!selectedProperty || !verificationType || !evidence) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill all required fields.' });
      return;
    }

    setIsLoading(true);
    try {
      // This is a simulation. In a real app, this would upload evidence to IPFS
      // and then call a smart contract function with the IPFS hash.
      await realEstateActions.verifyProperty(selectedProperty);
      
      toast({
          title: "Verification Submitted",
          description: "Your attestation has been recorded on-chain (simulated)."
      });

      // Reset form
      setSelectedProperty('');
      setVerificationType('');
      setEvidence('');
      setSource('');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!trustLayerState.userOracleStatus.isProvider) {
    return (
      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Submit Property Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
              <AlertDescription>
                You must be a registered and active TrustOracle provider to submit verifications.
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
          <Shield className="h-5 w-5" />
          Submit Property Verification
        </CardTitle>
        <CardDescription>
          As a trusted oracle, verify property information using reliable sources.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Property to Verify</label>
          <Select value={selectedProperty} onValueChange={setSelectedProperty} disabled={pendingProperties.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={pendingProperties.length > 0 ? "Choose a property" : "No properties pending"} />
            </SelectTrigger>
            <SelectContent>
              {pendingProperties.map(property => (
                <SelectItem key={property.id} value={property.id}>
                  {property.title} - {property.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Verification Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Verification Type</label>
          <Select value={verificationType} onValueChange={setVerificationType}>
            <SelectTrigger>
              <SelectValue placeholder="Select verification type" />
            </SelectTrigger>
            <SelectContent>
              {verificationTypes.map(type => {
                const IconComponent = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <div>
                        <div>{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Evidence Source */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Evidence Source</label>
          <Input
            placeholder="e.g., Milan Land Registry, Certified Appraiser LLC"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>

        {/* Evidence Details */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Evidence Details & Findings (IPFS Hash)</label>
          <Textarea
            placeholder="Describe your verification findings and include the IPFS hash of your evidence documents..."
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Include document numbers, appraisal values, inspection dates, and the off-chain evidence hash.
          </p>
        </div>

        {/* Evidence Requirements */}
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            <strong>Required Evidence:</strong> All submissions must include a hash (e.g., IPFS) linking to the off-chain evidence document(s). This ensures data integrity and auditability.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleSubmitVerification}
          disabled={isLoading || !selectedProperty || !verificationType || !evidence}
          className="w-full"
        >
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {isLoading ? 'Submitting Verification...' : 'Submit Verification'}
        </Button>
      </CardContent>
    </Card>
  );
};
