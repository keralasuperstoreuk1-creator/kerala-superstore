#!/usr/bin/env python3
"""
Build script for Modern Webview2 Chromium Windows EXE Suite
"""
import os
import sys
import shutil
import subprocess

def build():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(base_dir, "dist_webview")
    build_dir = os.path.join(base_dir, "build_webview")
    public_downloads = os.path.abspath(os.path.join(base_dir, "..", "..", "public", "downloads"))
    os.makedirs(public_downloads, exist_ok=True)
    os.makedirs(dist_dir, exist_ok=True)

    icon_path = os.path.join(base_dir, "app_icon.ico")
    ui_installer = os.path.join(base_dir, "ui_installer.html")
    ui_dashboard = os.path.join(base_dir, "ui_dashboard.html")

    # 1. Build Standalone Agent (KSS-POS-Sync.exe)
    print("=== 1. Building Webview2 Standalone POS Sync Dashboard ===")
    cmd_agent = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onefile",
        "--windowed",
        "--name", "KSS-POS-Sync",
        f"--add-data={ui_dashboard};.",
        f"--add-data={icon_path};.",
        f"--icon={icon_path}",
        "--distpath", dist_dir,
        "--workpath", build_dir,
        os.path.join(base_dir, "dashboard_app.py")
    ]
    subprocess.run(cmd_agent, check=True)
    
    agent_exe = os.path.join(dist_dir, "KSS-POS-Sync.exe")
    shutil.copy2(agent_exe, os.path.join(public_downloads, "KSS-POS-Sync.exe"))
    print(f"Copied {agent_exe} to {public_downloads}")

    # 2. Build Installer Wizard (KSS-POS-Sync-Setup.exe)
    print("=== 2. Building Webview2 Setup Installer Wizard ===")
    cmd_installer = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onefile",
        "--windowed",
        "--name", "KSS-POS-Sync-Setup",
        f"--add-data={ui_installer};.",
        f"--add-data={agent_exe};.",
        f"--add-data={icon_path};.",
        f"--icon={icon_path}",
        "--distpath", dist_dir,
        "--workpath", build_dir,
        os.path.join(base_dir, "installer_app.py")
    ]
    subprocess.run(cmd_installer, check=True)

    installer_exe = os.path.join(dist_dir, "KSS-POS-Sync-Setup.exe")
    shutil.copy2(installer_exe, os.path.join(public_downloads, "KSS-POS-Sync-Setup.exe"))
    print(f"Copied {installer_exe} to {public_downloads}")

    print("=== NextGen Webview2 EXE Suite Built Successfully! ===")

if __name__ == "__main__":
    build()
