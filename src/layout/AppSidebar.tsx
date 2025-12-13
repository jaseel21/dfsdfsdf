"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";
import SidebarWidget from "./SidebarWidget";
import { useSession } from "next-auth/react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/admin/dashboard",
    subItems: [
      { name: "Over View", path: "/admin", pro: false },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Donation",
    path: "/admin/donations",
    subItems: [
      { name: "All Donations", path: "/admin/donations/all", pro: false },
      { name: "Create Donations", path: "/admin/donations/create", pro: false },
      { name: "Generate Receipts", path: "/admin/donations/receipts", pro: false },
      { name: "Donor Management", path: "/admin/donations/donor-management", pro: false },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Campaigns",
    path: "/admin/campaigns",
    subItems: [
      { name: "Ongoing Campaigns", path: "/admin/campaigns/ongoing", pro: false },
      { name: "All Campaigns", path: "/admin/campaigns/upcoming", pro: false },
      { name: "Create Campaign", path: "/admin/campaigns/create", pro: false },
      // { name: "Edit Campaign", path: "/admin/campaigns/edit", pro: false },
      // { name: "Delete Campaign", path: "/admin/campaigns/delete", pro: false },
      // { name: "Track Progress", path: "/admin/campaigns/track", pro: false },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Photo Framing",
    path: "/admin/photoframing",
    subItems: [
      { name: "View All Frames", path: "/admin/photoframing/all", pro: false },
      { name: "Create Frames", path: "/admin/photoframing/create", pro: false },
      { name: "Track Progress", path: "/admin/photoframing", pro: false },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Daily Status",
    path: "/admin/social-status",
    subItems: [
      { name: "View All Status", path: "/admin/social-status/all", pro: false },
      { name: "Create Status", path: "/admin/social-status/create", pro: false },
      { name: "Track Progress", path: "/admin/social-status", pro: false },
    ],
  },
  {
    icon: <ListIcon />,
    name: "Institutions",
    path: "/admin/institutions",
    subItems: [
      { name: "List Institutions", path: "/admin/institutions/list", pro: false },
      { name: "Add Institution", path: "/admin/institutions/add", pro: false },
      // { name: "View Allocations", path: "/admin/institutions/allocations", pro: false },
    ],
  },
  {
    icon: <TableIcon />,
    name: "Notification System",
    path: "/admin/notifications",
    subItems: [
      { name: "Manage Templates", path: "/admin/notifications/create-template", pro: false },
      { name: "Send Notifications", path: "/admin/notifications/send-notifications", pro: false },
      { name: "Track Delivery", path: "/admin/notifications/track-notifications", pro: false },
      // { name: "Notifications Settings", path: "/admin/notifications/settings", pro: false },
    ],
  },
  {
    icon: <PageIcon />,
    name: "Sponsorship",
    path: "/admin/sponsorships",
    subItems: [
      { name: "List Sponsors", path: "/admin/sponsorships/list", pro: false },
      { name: "Create Sponsors", path: "/admin/sponsorships/create", pro: false },
      { name: "Yatheem Sponsorships", path: "/admin/sponsorships/yatheem", pro: false },
      { name: "Hafiz Sponsorships", path: "/admin/sponsorships/hafiz", pro: false },
      { name: "Manage Yatheem", path: "/admin/sponsorships/yatheem-list", pro: false },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Subscriptions",
    path: "/subscriptions",
    subItems: [
      { name: "Overview", path: "/admin/subscriptions/overview", pro: false },
      { name: "List Subscriptions", path: "/admin/subscriptions/list", pro: false },
      { name: "Auto Subscriptions", path: "/admin/subscriptions/auto", pro: false },
      { name: "Manual Subscriptions", path: "/admin/subscriptions/manual", pro: false },
      { name: "Cancelled Subscriptions", path: "/admin/subscriptions/cancelled", pro: false },
      { name: "View Logs", path: "/admin/volunteers/logs", pro: false },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Volunteers",
    path: "/admin/volunteers",
    subItems: [
      { name: "List Volunteers", path: "/admin/volunteers/list", pro: false },
      { name: "add Volunteer", path: "/admin/volunteers/add", pro: false },
      // { name: "Track Performance", path: "/admin/volunteers/performance", pro: false },
      // { name: "View Logs", path: "/admin/volunteers/logs", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Box Holders",
    path: "/admin/boxholder",
    subItems: [
      { name: "All Boxs", path: "/admin/boxes/allbox", pro: false },
      { name: "Add Boxs", path: "/admin/boxes/addbox", pro: false },
      { name: "CSV import", path: "/admin/boxes/csvimport", pro: false },
      // { name: "Active Boxes", path: "/admin/boxes/activebox", pro: false },
      // { name: "Deactive Boxes", path: "/admin/boxes/deactivebox", pro: false },
      // { name: "Generate Reports", path: "/admin/boxes/allreports", pro: false },
    ],
  },
];

const othersItems: NavItem[] = [
  // {
  //   icon: <PieChartIcon />,
  //   name: "Payment Receipts & Records",
  //   path: "/admin/receipts",
  //   subItems: [
  //     { name: "List Receipts", path: "/admin/receipts/list", pro: false },
  //     { name: "Download Receipts", path: "/admin/receipts/download", pro: false },
  //     { name: "Print Receipts", path: "/admin/receipts/print", pro: false },
  //   ],
  // },
  
  // {
  //   icon: <BoxCubeIcon />,
  //   name: "Box Collection & Tracking",
  //   path: "/admin/boxes",
  //   subItems: [
  //     { name: "Box Overview", path: "/admin/boxes/overview", pro: false },
  //     { name: "Track Boxes", path: "/admin/boxes/track", pro: false },
  //     { name: "Generate Reports", path: "/admin/boxes/reports", pro: false },
  //   ],
  // },
  {
    icon: <PlugInIcon />,
    name: "BackUp & Restore",
    path: "/admin/backup",
    subItems: [
      { name: "BackUp and Restore", path: "/admin/backup", pro: false },
    ],
  },
  {
    icon: <TableIcon />,
    name: "Settings",
    path: "/admin/settings",
    subItems: [
      { name: "User Management", path: "/admin/settings/users", pro: false },
      // { name: "Role Permissions", path: "/admin/settings/roles", pro: false },
      // { name: "System Settings", path: "/admin/settings/system", pro: false },
    ],
  },
  // {
  //   icon: <PieChartIcon />,
  //   name: "Reports",
  //   path: "/admin/reports",
  //   subItems: [
  //     { name: "Generate Reports", path: "/admin/reports/generate", pro: false },
  //     { name: "Export Reports", path: "/admin/reports/export", pro: false },
  //   ],
  // },
];

const permissionMap: Record<string, string> = {
  // Dashboard
  "/admin": "dashboard_overview",
  // Donation
  "/admin/donations/all": "donation_all",
  "/admin/donations/create": "donation_create",
  "/admin/donations/receipts": "donation_receipts",
  "/admin/donations/donor-management": "donation_management",
  // Campaigns
  "/admin/campaigns/ongoing": "campaigns_ongoing",
  "/admin/campaigns/upcoming": "campaigns_all",
  "/admin/campaigns/create": "campaigns_create",
  // Photo Framing
  "/admin/photoframing/all": "photoframing_all",
  "/admin/photoframing/create": "photoframing_create",
  "/admin/photoframing": "photoframing_track",
  // Daily Status
  "/admin/social-status/all": "status_all",
  "/admin/social-status/create": "status_create",
  "/admin/social-status": "status_track",
  // Institutions
  "/admin/institutions/list": "institutions_list",
  "/admin/institutions/add": "institutions_add",
  // Notification System
  "/admin/notifications/create-template": "notifications_templates",
  "/admin/notifications/send-notifications": "notifications_send",
  "/admin/notifications/track-notifications": "notifications_track",
  // Sponsorship Programs
  "/admin/sponsorships/list": "sponsorships_list",
  "/admin/sponsorships/create": "sponsorships_create",
  "/admin/sponsorships/yatheem": "sponsorships_yatheem",
  "/admin/sponsorships/hafiz": "sponsorships_hafiz",
  "/admin/sponsorships/yatheem-list": "sponsorships_yatheem_list",
  "/admin/sponsorships/yatheem/": "sponsorships_yatheem_detail",
  // Subscriptions
  "/admin/subscriptions/overview": "subscriptions_overview",
  "/admin/subscriptions/list": "subscriptions_list",
  "/admin/subscriptions/auto": "subscriptions_auto",
  "/admin/subscriptions/manual": "subscriptions_manual",
  "/admin/volunteers/logs": "subscriptions_logs",
  // Volunteers
  "/admin/volunteers/list": "volunteers_list",
  "/admin/volunteers/add": "volunteers_add",
  // Box Holders
  "/admin/boxes/allbox": "boxholders_all",
  "/admin/boxes/addbox": "boxholders_add",
  "/admin/boxes/csvimport": "boxholders_csv",
  // Backup & Restore
  "/admin/backup": "backup_restore",
  // Settings
  "/admin/settings/users": "settings_users",
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { data: session } = useSession();
  console.log("Sidebar session:", session);
  const user = session?.user as { role?: string; permissions?: string[] } | undefined;
  const isSuperAdmin = user?.role === "Super Admin";
  const userPermissions = isSuperAdmin ? null : user?.permissions || [];

  // Helper to filter navItems/subItems by permissions
  function filterNavItems(items: NavItem[]): NavItem[] {
    if (isSuperAdmin) return items; // Super Admin: show all
    if (!userPermissions || userPermissions.length === 0) return []; // No permissions: show nothing
    return items
      .map((nav) => {
        if (!nav.subItems) return null;
        const filteredSub = nav.subItems.filter((sub) => {
          const permKey = permissionMap[sub.path];
          return userPermissions.includes(permKey);
        });
        if (filteredSub.length === 0) return null;
        return { ...nav, subItems: filteredSub };
      })
      .filter(Boolean) as NavItem[];
  }

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                  openSubmenu?.type === menuType &&
                  openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                }`}>
                  <ChevronDownIcon />
                </span>
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
          ? "w-[290px]"
          : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
      lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center space-x-3">
              <img 
                src="/aic-amal-logo.svg" 
                alt="AIC Amal Logo" 
                className="h-8 w-auto"
              />
              <div className="flex flex-col -space-y-1">
                <span className="text-lg font-semibold leading-tight text-gray-900 dark:text-white">
                  Amal App
                </span>
                <span className="text-xs leading-tight text-gray-600 dark:text-gray-300">
                  Akode Islamic Centre
                </span>
              </div>
            </div>
          ) : (
            <img 
              src="/aic-amal-logo.svg" 
              alt="AIC Amal Logo" 
              className="h-7 w-auto"
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(filterNavItems(navItems), "main")}
            </div>

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(filterNavItems(othersItems), "others")}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;