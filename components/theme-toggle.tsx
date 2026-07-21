"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
export function ThemeToggle() { const [dark, setDark] = useState(false); useEffect(() => setDark(document.documentElement.classList.contains("dark")), []); const toggle = () => { document.documentElement.classList.toggle("dark"); setDark(!dark); }; return <button onClick={toggle} aria-label="切換主題" className="rounded-lg border p-2 text-muted">{dark ? <Sun size={17} /> : <Moon size={17} />}</button>; }
