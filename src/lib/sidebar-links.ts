import {
    LayoutDashboard, FileClock, MessagesSquare, Layout, UserCircle,
    UserSearch, GraduationCap, MessageSquareText, LucideIcon} from "lucide-react";
  
  type SidebarLinkItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: string;
  };
  
  type SidebarLinkDivider = {
    divider: true;
  };
  
  export type SidebarLink = SidebarLinkItem | SidebarLinkDivider;
  
  export const sidebarLinks: SidebarLink[] = [
    {
      label: "Audience Type",
      href: "/emails/audience-type",
      icon: LayoutDashboard,
    },
    {
      label: "Audience",
      href: "/emails/audience",
      icon: FileClock,
    },
    {
      label: "Sender",
      href: "/emails/sender",
      icon: MessagesSquare,
      badge: "BETA",
    },
    { divider: true },
    {
      label: "Workflows",
      href: "/workflows",
      icon: Layout,
    },
    {
      label: "Accounts",
      href: "/accounts",
      icon: UserCircle,
    },
    {
      label: "Competitors",
      href: "/competitors",
      icon: UserSearch,
    },
    { divider: true },
    {
      label: "Knowledge Base",
      href: "/library/knowledge",
      icon: GraduationCap,
    },
    {
      label: "Feedback",
      href: "/feedback",
      icon: MessageSquareText,
    },
    {
      label: "Document Review",
      href: "/review",
      icon: FileClock,
    },
  ];
  