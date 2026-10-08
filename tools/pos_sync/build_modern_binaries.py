#!/usr/bin/env python3
"""
Build Script for Kerala Superstore NextGen POS Sync Standalone and Installer binaries.
"""
import os
import sys
import shutil
import subprocess
import customtkinter

def build():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(base_dir, "dist")
    build_dir = os.path.join(base_dir, "build")
    public_downloads = os.path.abspath(os.path.join(base_dir, "..", "..", "public", "downloads"))
    os.makedirs(public_downloads, exist_ok=True)

    ctk_path = os.path.dirname(customtkinter.__file__)
    icon_path = os.path.join(base_dir, "app_icon.ico")

    # 1. Build Standalone Agent (KSS-POS-Sync.exe)
    print("=== 1. Building Standalone POS Sync Dashboard ===")
    cmd_agent = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onedir", # Build onedir or onefile
        "--onefile",
        "--windowed",
        "--name", "KSS-POS-Sync",
        f"--add-data={ctk_path};customtkinter/",
        f"--add-data={icon_path};.",
        f"--icon={icon_path}",
        "--distpath", dist_dir,
        "--workpath", build_dir,
        os.path.join(base_dir, "modern_sync_agent.py")
    ]
    subprocess.run(cmd_agent, check=True)
    
    agent_exe = os.path.join(dist_dir, "KSS-POS-Sync.exe")
    shutil.copy2(agent_exe, os.path.join(public_downloads, "KSS-POS-Sync.exe"))
    print(f"Copied {agent_exe} to {public_downloads}")

    # 2. Build Installer Wizard (KSS-POS-Sync-Setup.exe)
    print("=== 2. Building Setup Installer Wizard ===")
    cmd_installer = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onefile",
        "--windowed",
        "--name", "KSS-POS-Sync-Setup",
        f"--add-data={ctk_path};customtkinter/",
        f"--add-data={agent_exe};.",
        f"--add-data={icon_path};.",
        f"--icon={icon_path}",
        "--distpath", dist_dir,
        "--workpath", build_dir,
        os.path.join(base_dir, "modern_installer.py")
    ]
    subprocess.run(cmd_installer, check=True)

    installer_exe = os.path.join(dist_dir, "KSS-POS-Sync-Setup.exe")
    shutil.copy2(installer_exe, os.path.join(public_downloads, "KSS-POS-Sync-Setup.exe"))
    print(f"Copied {installer_exe} to {public_downloads}")

    print("=== Build Completed Successfully! ===")

if __name__ == "__main__":
    build()
