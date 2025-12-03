"use client";

import Link from "next/link";
import { Search, Upload, User, LogOut, Moon, Sun, Monitor, Menu, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export function Navbar() {
    const router = useRouter();
    const [userId, setUserId] = useState<Id<"users"> | null>(null);
    const { setTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch user details if logged in
    const user = useQuery(api.users.getUser, userId ? { userId } : "skip");

    useEffect(() => {
        const storedUser = localStorage.getItem("userId");
        if (storedUser) {
            setUserId(storedUser as Id<"users">);
        }
    }, []);

    const handleSignOut = () => {
        localStorage.removeItem("userId");
        window.location.href = "/";
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <nav className="flex items-center justify-between px-4 py-3 bg-background border-b sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-1">
                    <div className="bg-red-600 text-white p-1 rounded-lg">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-play"
                        >
                            <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight hidden sm:inline">LuxeVault</span>
                </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
                <form onSubmit={handleSearch} className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search"
                        className="w-full pl-8 bg-muted/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </div>

            <div className="flex items-center gap-2">
                <div className="md:hidden">
                    <Button variant="ghost" size="icon">
                        <Search className="h-5 w-5" />
                    </Button>
                </div>

                {userId ? (
                    <>
                        <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
                            <Link href={user?.isChannel ? `/channel/${user.username}` : "/channel/create"}>
                                <Upload className="h-5 w-5" />
                            </Link>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.image} />
                                        <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {user?.isChannel ? (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/channel/${user.username}`}>
                                                <User className="mr-2 h-4 w-4" />
                                                Your Channel
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/${user.username}`}>
                                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                                Studio
                                            </Link>
                                        </DropdownMenuItem>
                                    </>
                                ) : (
                                    <DropdownMenuItem asChild>
                                        <Link href="/channel/create">
                                            <User className="mr-2 h-4 w-4" />
                                            Create Channel
                                        </Link>
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <Monitor className="mr-2 h-4 w-4" />
                                        Theme
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={() => setTheme("light")}>
                                            <Sun className="mr-2 h-4 w-4" />
                                            Light
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                                            <Moon className="mr-2 h-4 w-4" />
                                            Dark
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme("system")}>
                                            <Monitor className="mr-2 h-4 w-4" />
                                            System
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <Button variant="outline" className="gap-2" asChild>
                        <Link href="/login">
                            <User className="h-4 w-4" />
                            Sign In
                        </Link>
                    </Button>
                )}
            </div>
        </nav>
    );
}
