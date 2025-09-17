
"use client";
import React, { useState } from 'react';
import { useAmmDemo, type Prediction } from '@/contexts/amm-demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bot, BarChart3, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function AiOraclePanel() {
    const { state, actions } = useAmmDemo();
    const [selectedPool, setSelectedPool] = useState<string>('');
    const [fee, setFee] = useState<number>(0.3);
    const [confidence, setConfidence] = useState<number>(85);

    const handleSubmit = () => {
        if (!selectedPool) return;
        actions.submitFeePrediction(selectedPool as `0x${string}`, fee, confidence);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Bot /> AI Oracle Interface</CardTitle>
                    <CardDescription>Submit AI predictions to influence pool parameters like fees.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Pool</Label>
                        <Select onValueChange={setSelectedPool} value={selectedPool} disabled={state.pools.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder={state.pools.length === 0 ? "No pools available" : "Select a pool"} />
                            </SelectTrigger>
                            <SelectContent>
                                {state.pools.map(p => <SelectItem key={p.address} value={p.address}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Predicted Fee: {fee.toFixed(2)}%</Label>
                        <Slider value={[fee]} onValueChange={([val]) => setFee(val)} max={1} step={0.01} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>0.5%</span>
                            <span>1%</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Confidence: {confidence}%</Label>
                        <Slider value={[confidence]} onValueChange={([val]) => setConfidence(val)} max={100} step={1} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                    <Button onClick={handleSubmit} disabled={!selectedPool || !state.isConnected || state.isProcessing(`Prediction_${selectedPool}`)} className="w-full">
                        {state.isProcessing(`Prediction_${selectedPool}`) ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                        Submit Prediction
                    </Button>
                </CardContent>
            </Card>
            
            {state.predictions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><BarChart3 /> Prediction History</CardTitle>
                        <CardDescription>Historical AI predictions and their outcomes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Predicted Fee</TableHead>
                                    <TableHead>Confidence</TableHead>
                                    <TableHead>Actual Fee</TableHead>
                                    <TableHead>Accuracy</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {state.predictions.map((pred: Prediction, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell>{pred.predictedFee.toFixed(2)}%</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-blue-600 h-2 rounded-full" 
                                                        style={{ width: `${pred.confidence}%` }}
                                                    ></div>
                                                </div>
                                                <span>{pred.confidence}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{pred.actualFee?.toFixed(2) || 'N/A'}%</TableCell>
                                        <TableCell>
                                            {pred.accuracy !== undefined ? (
                                                <Badge variant={pred.accuracy > 90 ? "default" : "secondary"}>
                                                    {pred.accuracy.toFixed(1)}%
                                                </Badge>
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell>{formatDistanceToNow(pred.timestamp, { addSuffix: true })}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
