"use client";
import React from "react";
import Link from "next/link";


import { useState } from "react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        backdropFilter: "blur(12px)",
        background: "rgba(255,255,255,0.25)",
        borderBottom: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      className="glassmorphic-navbar"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0.5rem 1rem",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "1.2rem" }}>Productivity Hub</span>
        <button
          className="md:hidden"
          aria-label="Toggle menu"
          style={{
            background: "none",
            border: "none",
            fontSize: "2rem",
            cursor: "pointer",
            display: "block",
          }}
          onClick={() => setOpen((o) => !o)}
        >
          &#9776;
        </button>
        <ul
          style={{
            display: open ? "flex" : "none",
            flexDirection: "column",
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            background: "rgba(255,255,255,0.85)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            margin: 0,
            padding: "1rem 0",
            listStyle: "none",
          }}
          className="mobile-menu md:flex md:flex-row md:static md:bg-transparent md:shadow-none md:p-0"
        >
          <li style={{ padding: "0.5rem 1rem" }}><Link href="/">Home</Link></li>
          <li style={{ padding: "0.5rem 1rem" }}><Link href="#apps">Productivity Apps</Link></li>
        </ul>
        <ul
          style={{
            display: "none",
            gap: "1rem",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
          className="md:flex md:flex-row md:gap-4 md:static md:bg-transparent md:shadow-none md:p-0"
        >
          <li><Link href="/">Home</Link></li>
          <li><Link href="#apps">Productivity Apps</Link></li>
        </ul>
      </div>
      <style jsx>{`
        .glassmorphic-navbar {
          backdrop-filter: blur(12px);
          background: rgba(255,255,255,0.25);
          border-bottom: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        @media (min-width: 768px) {
          .mobile-menu {
            display: none !important;
          }
          .md\:flex {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
