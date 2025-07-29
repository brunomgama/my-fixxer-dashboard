import {
    FileClock, Layout, GraduationCap, MessageSquareText, LucideIcon,
    UsersRound,
    TicketsPlane,
    Group} from "lucide-react";
  
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
      icon: Group,
    },
    {
      label: "Audience",
      href: "/emails/audience",
      icon: UsersRound,
    },
    {
      label: "Sender",
      href: "/emails/sender",
      icon: TicketsPlane,
    },
    { divider: true },
    {
      label: "Workflows",
      href: "/workflows",
      icon: Layout,
      badge: "BETA",
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
  