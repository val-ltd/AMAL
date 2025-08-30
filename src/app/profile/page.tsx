
'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User } from "lucide-react";

export default function ProfilePage() {
    return (
      <div className="flex justify-center items-start pt-8">
        <Card className="w-full max-w-md">
            <CardHeader className="items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src="https://i.pravatar.cc/150?u=alice" alt="Alice Johnson" data-ai-hint="person" />
                    <AvatarFallback>AJ</AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">Alice Johnson</CardTitle>
                <CardDescription>alice.j@example.com</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                    <User className="mr-2 h-4 w-4" />
                    <span>Ubah Profil</span>
                </Button>
                <Button variant="destructive" className="w-full justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                </Button>
            </CardContent>
        </Card>
      </div>
    )
}
