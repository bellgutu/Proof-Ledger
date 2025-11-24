
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreVertical, Download, Shield, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";


type Partner = {
  id: string;
  userName: string;
  displayName: string;
  active: boolean;
  name: {
    givenName: string;
    familyName: string;
  };
  emails: {
    value: string;
    type: string;
    primary: boolean;
  }[];
};

const formSchema = z.object({
  givenName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  familyName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
});

// Mock data, since the API route was removed.
const MOCK_PARTNERS: Partner[] = [
    {
        id: '1',
        userName: 'john.doe@globalsbipping.co',
        displayName: 'John Doe',
        active: true,
        name: { givenName: 'John', familyName: 'Doe' },
        emails: [{ value: 'john.doe@globalsbipping.co', type: 'work', primary: true }],
    },
    {
        id: '2',
        userName: 'jane.smith@preciousgems.com',
        displayName: 'Jane Smith',
        active: true,
        name: { givenName: 'Jane', familyName: 'Smith' },
        emails: [{ value: 'jane.smith@preciousgems.com', type: 'work', primary: true }],
    },
    {
        id: '3',
        userName: 'sam.wilson@agrisource.io',
        displayName: 'Sam Wilson',
        active: false,
        name: { givenName: 'Sam', familyName: 'Wilson' },
        emails: [{ value: 'sam.wilson@agrisource.io', type: 'work', primary: true }],
    }
];

export default function CompliancePage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      givenName: "",
      familyName: "",
      email: "",
    },
  });

  useEffect(() => {
    setIsLoading(true);
    // Simulate fetching data
    setTimeout(() => {
        setPartners(MOCK_PARTNERS);
        setIsLoading(false);
    }, 500);
  }, []);

  const filteredPartners = useMemo(() => {
    if (!searchTerm) return partners;
    return partners.filter(p => 
        p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.emails[0].value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [partners, searchTerm]);


  const getStatus = (active: boolean) => {
    return active ? "Verified" : "Inactive";
  }
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Simulate API call and update state
    const newUser: Partner = {
        id: `new_${new Date().getTime()}`,
        userName: values.email,
        displayName: `${values.givenName} ${values.familyName}`,
        active: true, // New users are active by default
        name: {
            givenName: values.givenName,
            familyName: values.familyName,
        },
        emails: [{
            value: values.email,
            type: "work",
            primary: true,
        }]
    };

    setPartners(prev => [newUser, ...prev]);
    setIsDialogOpen(false); // Close the dialog
    form.reset(); // Reset form fields
    toast({
        title: "Partner Added",
        description: `${newUser.displayName} has been successfully added.`,
    });
}

  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Compliance & Governance Hub
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Manage actor identities, provide irrefutable proof of compliance, and control user access across the platform.
        </p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>KYC/AML Partner Onboarding</CardTitle>
                    <CardDescription>Manage and verify the compliance status of all business partners.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                        <Input 
                          placeholder="Filter by name or email..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                               <Button size="icon"><PlusCircle className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Partner</DialogTitle>
                                    <DialogDescription>
                                        Create a new user in the directory.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                  <form onSubmit={form.handleSubmit(onSubmit)} id="add-partner-form" className="space-y-4 py-4">
                                    <FormField
                                      control={form.control}
                                      name="givenName"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>First Name</FormLabel>
                                          <FormControl>
                                            <Input placeholder="Jane" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                     <FormField
                                      control={form.control}
                                      name="familyName"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Last Name</FormLabel>
                                          <FormControl>
                                            <Input placeholder="Doe" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                     <FormField
                                      control={form.control}
                                      name="email"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Email</FormLabel>
                                          <FormControl>
                                            <Input placeholder="jane.doe@example.com" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </form>
                                </Form>
                                <DialogFooter>
                                    <Button type="submit" form="add-partner-form">Create Partner</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-md">{error}</div>}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Partner</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-[80px] inline-block" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                filteredPartners.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.displayName}</TableCell>
                                        <TableCell className="text-muted-foreground">{p.emails[0].value}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge 
                                                variant={p.active ? 'default' : 'secondary'}
                                                className={cn(
                                                    p.active && 'bg-green-600/20 text-green-300 border-green-500/30'
                                                )}
                                            >
                                                 <div className={cn(
                                                    "w-2 h-2 rounded-full mr-2",
                                                    p.active && 'bg-green-400',
                                                    !p.active && 'bg-yellow-400',
                                                )}></div>
                                                {getStatus(p.active)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Role-Based Access Control (RBAC)</CardTitle>
                    <CardDescription>Manage granular user permissions for platform actions.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Logistics Agent</TableCell>
                                <TableCell className="text-xs text-muted-foreground">Mint Asset, Verify FOB/CIF</TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Finance Manager</TableCell>
                                <TableCell className="text-xs text-muted-foreground">Bind Policy, Approve Claim</TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Executive</TableCell>
                                <TableCell className="text-xs text-muted-foreground">Read-only</TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
            <Card>
                 <CardHeader>
                    <CardTitle>Regulatory Audit Trail Generator</CardTitle>
                    <CardDescription>Generate time-stamped compliance reports.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <label htmlFor="reportType" className="text-sm font-medium">Report Type</label>
                        <select id="reportType" className="w-full p-2 border rounded-md bg-transparent text-sm">
                            <option>Full Compliance Report</option>
                            <option>Customs Declaration</option>
                            <option>Tax Reporting</option>
                        </select>
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="dateRange" className="text-sm font-medium">Date Range</label>
                        <Input type="date" id="dateRange" />
                    </div>
                    <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" /> Generate Report
                    </Button>
                </CardContent>
            </Card>
             <Card>
                 <CardHeader>
                    <CardTitle>System Health & Oracle Status</CardTitle>
                    <CardDescription>Live monitor of the platform's core dependencies.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-primary" />
                            <span className="font-medium">Smart Contract Gas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">2.5 ETH</span>
                            <Badge className="bg-green-600/20 text-green-300">Healthy</Badge>
                        </div>
                    </div>
                     <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-primary" />
                            <span className="font-medium">Oracle Data Feed</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="font-mono text-sm">21ms Latency</span>
                            <Badge className="bg-green-600/20 text-green-300">Online</Badge>
                        </div>
                    </div>
                    <div className="pt-2">
                        <h4 className="text-sm font-medium mb-2">Oracle Attestation Log</h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p className="font-mono">✅ Attested batch #8871 (3.1s ago)</p>
                            <p className="font-mono">✅ Attested batch #8870 (1m ago)</p>
                            <p className="font-mono">✅ Attested batch #8869 (2m ago)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
