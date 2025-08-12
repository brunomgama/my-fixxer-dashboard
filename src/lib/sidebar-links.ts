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
    Shredder,
    Settings,
    Waypoints} from "lucide-react";
  
  type SidebarLinkItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: string;
    badgeColor?: "default" | "red" | "orange" | "blue" | "green" | "purple";
    block?: string;
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
      badge: "PROD ONLY",
      badgeColor: "red",
      block: "local,development,staging",
    },
    { divider: true },
    {
      label: "navigation.settings",
      href: "/emails/settings",
      icon: Settings,
    },
    { divider: true },
    {
      label: "navigation.workflows.events",
      href: "/workflows",
      icon: Layout,
      badge: "BETA",
    },
    {
      label: "navigation.workflows.actions",
      href: "/workflow",
      icon: Waypoints,
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
