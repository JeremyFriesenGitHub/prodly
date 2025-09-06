
"use client";
import { useState } from "react";
import { LuX } from "react-icons/lu";
import { VscGithubAlt, VscThreeBars } from "react-icons/vsc";
import { CiLinkedin } from "react-icons/ci";
import { MdOutlineContactPage } from "react-icons/md";
import Link from "next/link";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-10 bg-black/40 backdrop-blur-lg p-4 text-white rounded-md">
      <div className="flex items-center justify-between">
        
        <a href="#" className={`hover:text-gray-500 md:block ${isOpen ? "hidden" : "block"}`}>
          Home
        </a>

        <div className="hidden md:flex space-x-6 absolute left-1/2 transform -translate-x-1/2">
          <a href="#about" className="hover:text-gray-500">About</a>
          <a href="#experience" className="hover:text-gray-500">Experience</a>
          <a href="#projects" className="hover:text-gray-500">Projects</a>
          <a href="#skills" className="hover:text-gray-500">Skills</a>
        </div>
    </nav>
  );  
}
