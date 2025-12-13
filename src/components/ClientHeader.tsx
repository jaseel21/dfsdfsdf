"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/users-section/home/Header";

export default function ClientHeader() {
  const pathname = usePathname();

  // Do not render Header on the /app-about page
  if (pathname === "/app-about") {
    return null;
  }
  if (pathname === "/mobile-donation") {
    return null;
  }
  if (pathname === "/mobile-receipts") {
    return null;
  }
  if (pathname === "/mobile-subscription") {
    return null;
  }

  // Check if it's a login page
  const isLoginPage = pathname.includes("/auth/") || pathname.includes("/sign-in");

  return <Header isLoginPage={isLoginPage} />;
}