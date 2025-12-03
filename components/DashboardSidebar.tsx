"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Settings,
    Video,
    MessageSquare,
    BarChart3,
    DollarSign,
    Menu,
    X
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface DashboardSidebarProps {
    username: string;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const navItems = [
    { name: "Overview", id: "overview", icon: LayoutDashboard },
    { name: "Channel Settings", id: "settings", icon: Settings },
    { name: "Videos", id: "videos", icon: Video },
    { name: "Comments", id: "comments", icon: MessageSquare },
    { name: "Analytics", id: "analytics", icon: BarChart3 },
    { name: "Revenue", id: "revenue", icon: DollarSign },
];

export function DashboardSidebar({ username, activeTab, onTabChange }: DashboardSidebarProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile menu button */}
            <Button
                variant="outline"
                size="icon"
                className="lg:hidden fixed top-20 left-4 z-50"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-background border-r transition-transform duration-200 z-40",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="p-4 space-y-2">
                    <h2 className="text-lg font-semibold mb-4 px-3">Studio Dashboard</h2>
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onTabChange(item.id);
                                        setIsMobileOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{item.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
}
