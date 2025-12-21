"use client";

import { useState, useEffect } from "react";

import NavBar from "@/components/shared/nav-bar";
import HamburgerMenu from "@/components/shared/hamburguer-menu";

export default function NavWrapper() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Function to check window size and update state
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    // Set initial value based on current window size
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Render the appropriate component based on screen size
  return isDesktop ? <NavBar></NavBar> : <HamburgerMenu></HamburgerMenu>;
}
