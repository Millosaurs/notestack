"use client";
import Link from "next/link";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
    const links = [{ to: "/", label: "Home" }] as const;

    return (
        <div className="flex justify-end p-4">
            <ModeToggle />
        </div>
    );
}
