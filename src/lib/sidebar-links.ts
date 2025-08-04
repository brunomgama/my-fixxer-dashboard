import {
    FileClock, Layout, GraduationCap, MessageSquareText, LucideIcon,
    UsersRound,
    TicketsPlane,
    Group,
    File,
    Home,
    Mail,
    Clock,
    UserMinus,
    Send,
    Shredder} from "lucide-react";
  
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
      label: "navigation.home",
      href: "/",
      icon: Home,
    },
    {
      label: "navigation.sendEmail",
      href: "/emails/send-process",
      icon: Send,
    },
    { divider: true },
    {
      label: "navigation.audienceTypes",
      href: "/emails/audience-type",
      icon: Group,
    },
    {
      label: "navigation.audience",
      href: "/emails/audience",
      icon: UsersRound,
    },
    {
      label: "navigation.senders",
      href: "/emails/sender",
      icon: TicketsPlane,
    },
    {
      label: "navigation.templates",
      href: "/emails/template",
      icon: File,
    },
    {
      label: "navigation.campaigns",
      href: "/emails/campaign",
      icon: Mail,
    },
    {
      label: "navigation.schedules",
      href: "/emails/schedule",
      icon: Clock,
    },
    {
      label: "navigation.unsubscribe",
      href: "/emails/unsubscribe",
      icon: UserMinus,
    },
    {
      label: "navigation.events_emails",
      href: "/emails/events",
      icon: Shredder,
    },
    { divider: true },
    {
      label: "navigation.workflows",
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
