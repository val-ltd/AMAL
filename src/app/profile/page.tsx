'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User as UserIcon, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import { getUserWithHierarchy } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
    const { user: authUser, logout } = useAuth();
    const [profileData, setProfileData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (authUser) {
                setLoading(true);
                const data = await getUserWithHierarchy(authUser.uid);
                setProfileData(data);
                setLoading(false);
            }
        }
        fetchProfileData();
    }, [authUser]);

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
                <div className="space-y-4 p-4 rounded-lg border">
                    <h3 className="font-semibold text-lg text-center mb-4">Data Pengurus</h3>
                    <ProfileRow label="Nama Pemohon" value={profileData.name} required />
                    <ProfileRow label="Jabatan Pemohon" value={profileData.position} required />
                    <Separator />
                    <ProfileRow label="Nama Atasan" value={profileData.supervisor?.name} />
                    <ProfileRow label="Jabatan Atasan" value={profileData.supervisor?.position} />
                     <Separator />
                    <ProfileRow label="Nama Pemutus" value={profileData.decider?.name} isDecider/>
                    <ProfileRow label="Jabatan Pemutus" value={profileData.decider?.position} isDecider/>
                    <Separator />
                    <ProfileRow label="Unit Kerja/Bagian" value={profileData.division} />
                    <ProfileRow label="Divisi" value={`${profileData.institution}-${profileData.division}`} />
                    <ProfileRow label="Lembaga" value={profileData.institution} isInstitution />
                </div>
                <div className="flex flex-col space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Ubah Profil</span>
                    </Button>
                    <Button variant="destructive" className="w-full justify-start" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Keluar</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    )
}

interface ProfileRowProps {
    label: string;
    value?: string | null;
    required?: boolean;
    isDecider?: boolean;
    isInstitution?: boolean;
}

function ProfileRow({ label, value, required, isDecider, isInstitution }: ProfileRowProps) {
    const valueClass = isDecider 
        ? "text-red-600" 
        : isInstitution 
        ? "text-green-600" 
        : "text-blue-600";

    return (
        <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground">{label}{required && <span className="text-red-500">*</span>}</p>
            <p className={`font-semibold ${value ? valueClass : 'text-muted-foreground'}`}>
                {value || 'N/A'}
            </p>
        </div>
    )
}

function ProfileSkeleton() {
    return (
      <div className="flex justify-center items-start pt-8">
        <Card className="w-full max-w-2xl">
            <CardHeader className="items-center text-center">
                <Skeleton className="h-24 w-24 rounded-full mb-4" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 rounded-lg border">
                    <Skeleton className="h-6 w-1/3 mx-auto mb-4" />
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-5 w-1/2" />
                        </div>
                    ))}
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
