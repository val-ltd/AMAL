
'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User as UserIcon, Landmark } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import { getUser } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";

export default function ProfilePage() {
    const { user: authUser, logout } = useAuth();
    const [profileData, setProfileData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const fetchProfileData = async () => {
        if (authUser) {
            setLoading(true);
            const data = await getUser(authUser.uid);
            setProfileData(data);
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProfileData();
    }, [authUser]);

    const handleProfileUpdate = () => {
        // Refetch the profile data after it's been updated in the dialog
        fetchProfileData();
    };

    if (loading) {
        return <ProfileSkeleton />
    }

    if (!profileData) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>Tidak dapat memuat data profil.</p>
            </div>
        );
    }
    
    const roles = Array.isArray(profileData.roles) ? profileData.roles : [profileData.roles].filter(Boolean);

    return (
      <div className="flex justify-center items-start pt-8">
        <Card className="w-full max-w-2xl">
            <CardHeader className="items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={profileData.avatarUrl ?? ''} alt={profileData.name ?? ''} data-ai-hint="person" />
                    <AvatarFallback>{profileData.name?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{profileData.name}</CardTitle>
                <CardDescription>{profileData.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 rounded-lg border text-sm">
                    <h3 className="font-semibold text-lg text-center mb-4">Informasi Pengguna</h3>
                     <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Posisi</p>
                            <p className="font-medium text-right">{profileData.position || 'N/A'}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Jenis Kelamin</p>
                            <p className="font-medium text-right">{profileData.gender || 'N/A'}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Lembaga</p>
                            <p className="font-medium text-right">{profileData.institution || 'N/A'}</p>
                        </div>
                         <div className="flex justify-between">
                            <p className="text-muted-foreground">Telepon</p>
                            <p className="font-medium text-right">{profileData.phoneNumber || 'N/A'}</p>
                        </div>
                        <div className="flex justify-between md:col-span-2">
                            <p className="text-muted-foreground">Divisi</p>
                            <p className="font-medium text-right">{profileData.division || 'N/A'}</p>
                        </div>
                        <div className="flex justify-between md:col-span-2">
                            <p className="text-muted-foreground">Alamat</p>
                            <p className="font-medium text-right">{profileData.address || 'N/A'}</p>
                        </div>
                        <div className="flex justify-between items-center md:col-span-2">
                            <p className="text-muted-foreground">Peran</p>
                            <div className="flex flex-wrap gap-1 justify-end">
                                {roles.map(role => (
                                    <Badge key={role} variant="secondary">{role}</Badge>
                                )) || <p className="font-medium">N/A</p>}
                            </div>
                        </div>
                     </div>
                </div>

                <div className="space-y-4 p-4 rounded-lg border text-sm">
                     <h3 className="font-semibold text-lg text-center mb-4">Rekening Bank</h3>
                     {profileData.bankAccounts && profileData.bankAccounts.length > 0 ? (
                        <div className="space-y-4">
                            {profileData.bankAccounts.map((acc, index) => (
                                <div key={index}>
                                    <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
                                        <div className="flex items-center gap-2">
                                            <Landmark className="w-4 h-4 text-muted-foreground" />
                                            <p><span className="text-muted-foreground">Bank:</span> {acc.bankName}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="w-4 h-4 text-muted-foreground" />
                                            <p><span className="text-muted-foreground">A/N:</span> {acc.accountHolderName}</p>
                                        </div>
                                         <div className="flex items-center gap-2 md:col-span-2">
                                            <p className="text-muted-foreground">No. Rek:</p>
                                            <p className="font-mono">{acc.accountNumber}</p>
                                        </div>
                                    </div>
                                    {index < profileData.bankAccounts!.length - 1 && <Separator className="my-4"/>}
                                </div>
                            ))}
                        </div>
                     ) : (
                        <p className="text-muted-foreground text-center">Tidak ada rekening bank yang tersimpan.</p>
                     )}
                </div>
                
                <EditProfileDialog 
                    user={profileData} 
                    onProfileUpdate={handleProfileUpdate}
                />

                <Button variant="destructive" className="w-full justify-start" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                </Button>
            </CardContent>
        </Card>
      </div>
    )
}

function ProfileSkeleton() {
    return (
      <div className="flex justify-center items-start pt-8">
        <Card className="w-full max-w-lg">
            <CardHeader className="items-center text-center">
                <Skeleton className="h-24 w-24 rounded-full mb-4" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 rounded-lg border">
                    <Skeleton className="h-6 w-1/3 mx-auto mb-4" />
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-5 w-1/2" />
                        </div>
                    ))}
                </div>
                 <div className="space-y-4 p-4 rounded-lg border">
                     <Skeleton className="h-6 w-1/3 mx-auto mb-4" />
                     <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex flex-col space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
      </div>
    )
}
