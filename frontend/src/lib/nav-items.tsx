import {
  BriefcaseIcon,
  CalendarIcon,
  LayoutDashboardIcon,
  MicIcon,
  UsersIcon,
} from "lucide-react";

export const navItems = [
  {
    icon: <LayoutDashboardIcon className="h-4 w-4" />,
    label: "Dashboard",
    href: "/",
  },
  {
    icon: <BriefcaseIcon className="h-4 w-4" />,
    label: "Jobs",
    href: "/jobs",
  },
  {
    icon: <UsersIcon className="h-4 w-4" />,
    label: "Candidates",
    href: "/candidates",
  },
  {
    icon: <CalendarIcon className="h-4 w-4" />,
    label: "Appointments",
    href: "/appointments",
  },
  {
    icon: <MicIcon className="h-4 w-4" />,
    label: "Voice Agent",
    href: "/voice-agent",
  },
];
