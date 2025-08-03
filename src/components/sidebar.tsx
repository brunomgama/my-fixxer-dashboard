"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,

} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, Globe, LogOut, UserCircle } from "lucide-react";
import { useEnvironment } from "@/lib/context/environment";
import { sidebarLinks } from "@/lib/sidebar-links";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslation } from "@/lib/context/translation";

const sidebarVariants = {
  open: { width: "15rem" },
  closed: { width: "3.05rem" },
};

const environments = [
  { key: "local", label: "environment.local" },
  { key: "development", label: "environment.development" },
  { key: "staging", label: "environment.staging" },
  { key: "production", label: "environment.production" }
] as const;

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: { x: { stiffness: 1000, velocity: -100 } },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: { x: { stiffness: 100 } },
  },
};

const staggerVariants = {
  open: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
};

export function SessionNavBar() {
  const {t} = useTranslation()
  const { env, setEnv } = useEnvironment();
  
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();

  return (
    <motion.div
      className="sidebar relative h-full shrink-0 border-r"
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className="relative z-40 flex h-full flex-col shrink-0 bg-white text-muted-foreground dark:bg-black transition-all"
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            {/* ENVIRONMENT SELECTOR */}
            <div className="flex h-[54px] w-full shrink-0 border-b p-2">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex w-full items-center justify-between gap-2 px-2"
                  >
                    <Avatar className="rounded size-4">
                      <AvatarFallback>{env[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <motion.div variants={variants}>
                      {!isCollapsed && (
                        <motion.div
                          variants={variants}
                          className="flex items-center justify-between w-full"
                        >
                          <p className="text-sm font-medium capitalize mr-2">{env}</p>
                          <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                        </motion.div>
                      )}
                    </motion.div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100%-1rem)] ml-2">
                  {environments.map((env) => (
                    <DropdownMenuItem key={env.key} onClick={() => setEnv(env.key)}>
                      {t(env.label)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* NAVIGATION */}
            <div className="flex h-full w-full flex-col">
              <ScrollArea className="h-16 grow p-2">
                <div className="flex w-full flex-col gap-1">
                    
                {sidebarLinks.map((item, i) => {
                  if ("divider" in item) {
                    return <Separator key={`sep-${i}`} className="w-full" />;
                  }

                  const fullHref = `/${env}${item.href}`;
                  const isActive = pathname === fullHref
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={fullHref}
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                        isActive && "bg-muted text-blue-600"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <div className="ml-2 flex items-center gap-2">
                            <p className="text-sm font-medium">{t(item.label)}</p>
                            {item.badge && (
                              <Badge
                                variant="outline"
                                className="border-none bg-blue-50 px-1.5 text-blue-600 dark:bg-blue-700 dark:text-blue-300"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        )}
                      </motion.li>
                    </Link>
                  );
                })}
                </div>
              </ScrollArea>

              {/* FOOTER */}
              <div className="flex flex-col p-2 mt-auto gap-2">


                <div className="flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary">
                  <Globe className="h-4 w-4 shrink-0" />
                  <motion.li variants={variants}>
                    <LanguageSwitcher isCollapsed={isCollapsed} />
                  </motion.li>
                </div>


                <Link
                  href="/settings/profile"
                  className="flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary"
                >
                  <UserCircle className="h-4 w-4 shrink-0" />
                  <motion.li variants={variants}>
                    {!isCollapsed && (
                      <p className="ml-2 text-sm font-medium">Profile</p>
                    )}
                  </motion.li>
                </Link>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full">
                    <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary">
                      <Avatar className="size-4">
                        <AvatarFallback>A</AvatarFallback>
                      </Avatar>
                      <motion.li variants={variants} className="flex w-full items-center gap-2">
                        {!isCollapsed && (
                          <>
                            <p className="text-sm font-medium">Account</p>
                            <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/50" />
                          </>
                        )}
                      </motion.li>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent sideOffset={5}>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}
