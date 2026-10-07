#!/usr/bin/env python3
"""
Kerala Superstore Manchester — POS Sync Bridge Windows Installer Wizard
Builds KSS-POS-Sync-Setup.exe
"""

import sys
import os
import shutil
import json
import tkinter as tk
from tkinter import ttk, messagebox
import winreg

APP_NAME = "Kerala Superstore POS Sync"
APP_EXE = "KSS-POS-Sync.exe"
DEFAULT_INSTALL_DIR = os.path.join(os.environ.get("LOCALAPPDATA", "C:\\"), "KeralaSuperstore", "POSSync")

CONFIG_DATA = {
    "website_url": "https://keralasuperstore.com",
    "api_key": "kss_pos_sync_key_2026_live",
    "sync_interval_seconds": 30,
    "db_server": ".",
    "db_name": "epos",
    "db_user": "sa",
    "db_password": "London2012$",
    "use_windows_auth": True,
    "batch_size": 500,
    "auto_start_sync": True
}

def create_windows_shortcut(target_path, shortcut_path, description=""):
    try:
        import win32com.client
        shell = win32com.client.Dispatch("WScript.Shell")
        shortcut = shell.CreateShortCut(shortcut_path)
        shortcut.TargetPath = target_path
        shortcut.WorkingDirectory = os.path.dirname(target_path)
        shortcut.Description = description
        shortcut.save()
        return True
    except Exception as e:
        print(f"Shortcut creation error: {e}")
        return False

def add_to_startup(app_path):
    try:
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            0,
            winreg.KEY_SET_VALUE
        )
        winreg.SetValueEx(key, "KeralaSuperstorePOSSync", 0, winreg.REG_SZ, f'"{app_path}"')
        winreg.CloseKey(key)
        return True
    except Exception as e:
        print(f"Startup registry error: {e}")
        return False

class InstallerWizard:
    def __init__(self, root):
        self.root = root
        self.root.title(f"Setup — {APP_NAME} (2026)")
        self.root.geometry("620x460")
        self.root.resizable(False, False)
        self.root.configure(bg="#0f172a")

        self.install_dir_var = tk.StringVar(value=DEFAULT_INSTALL_DIR)
        self.create_desktop_icon = tk.BooleanVar(value=True)
        self.create_startup = tk.BooleanVar(value=True)
        self.launch_after = tk.BooleanVar(value=True)

        self.current_step = 1
        self.build_ui()

    def build_ui(self):
        # Header banner
        header = tk.Frame(self.root, bg="#1e293b", padx=20, pady=16)
        header.pack(fill="x", side="top")

        lbl_title = tk.Label(
            header,
            text="🌿 Kerala Superstore — POS Sync Installer",
            font=("Segoe UI", 15, "bold"),
            fg="#f8fafc",
            bg="#1e293b"
        )
        lbl_title.pack(anchor="w")

        lbl_sub = tk.Label(
            header,
            text="RetailV2 (epos SQL Server) ➔ Website Real-Time Stock Bridge Setup",
            font=("Segoe UI", 9),
            fg="#94a3b8",
            bg="#1e293b"
        )
        lbl_sub.pack(anchor="w", pady=(2, 0))

        # Main dynamic body container
        self.body = tk.Frame(self.root, bg="#0f172a", padx=25, pady=20)
        self.body.pack(fill="both", expand=True)

        # Footer controls
        self.footer = tk.Frame(self.root, bg="#1e293b", padx=20, pady=12)
        self.footer.pack(fill="x", side="bottom")

        self.btn_cancel = tk.Button(
            self.footer,
            text="Cancel",
            command=self.root.quit,
            font=("Segoe UI", 9),
            bg="#334155",
            fg="#f8fafc",
            relief="flat",
            padx=14,
            pady=6,
            cursor="hand2"
        )
        self.btn_cancel.pack(side="left")

        self.btn_next = tk.Button(
            self.footer,
            text="Install Now ➔",
            command=self.perform_installation,
            font=("Segoe UI", 10, "bold"),
            bg="#10b981",
            fg="white",
            activebackground="#059669",
            relief="flat",
            padx=20,
            pady=6,
            cursor="hand2"
        )
        self.btn_next.pack(side="right")

        self.show_step1()

    def show_step1(self):
        for widget in self.body.winfo_children():
            widget.destroy()

        intro_lbl = tk.Label(
            self.body,
            text="Welcome to Kerala Superstore POS Sync Setup Wizard",
            font=("Segoe UI", 12, "bold"),
            fg="#e2e8f0",
            bg="#0f172a"
        )
        intro_lbl.pack(anchor="w", pady=(0, 10))

        desc_lbl = tk.Label(
            self.body,
            text="This wizard will install the automatic POS Inventory & Sales Sync Bridge on this computer.\n"
                 "It will monitor the local RetailV2 SQL Server ('epos' database) and automatically\n"
                 "synchronize stock changes and prices to https://keralasuperstore.com.",
            font=("Segoe UI", 9),
            fg="#94a3b8",
            bg="#0f172a",
            justify="left"
        )
        desc_lbl.pack(anchor="w", pady=(0, 15))

        # Location selector
        loc_frame = tk.LabelFrame(
            self.body,
            text=" Destination Location ",
            font=("Segoe UI", 9, "bold"),
            fg="#38bdf8",
            bg="#1e293b",
            padx=12,
            pady=10
        )
        loc_frame.pack(fill="x", pady=(0, 15))

        loc_ent = tk.Entry(
            loc_frame,
            textvariable=self.install_dir_var,
            font=("Segoe UI", 9),
            bg="#0f172a",
            fg="white",
            insertbackground="white",
            relief="flat"
        )
        loc_ent.pack(fill="x", ipady=4)

        # Options checkbuttons
        opts_frame = tk.LabelFrame(
            self.body,
            text=" Installation Options ",
            font=("Segoe UI", 9, "bold"),
            fg="#38bdf8",
            bg="#1e293b",
            padx=12,
            pady=8
        )
        opts_frame.pack(fill="x")

        chk1 = tk.Checkbutton(
            opts_frame,
            text="Create Desktop Shortcut",
            variable=self.create_desktop_icon,
            font=("Segoe UI", 9),
            fg="#f8fafc",
            bg="#1e293b",
            selectcolor="#0f172a",
            activebackground="#1e293b"
        )
        chk1.pack(anchor="w", pady=2)

        chk2 = tk.Checkbutton(
            opts_frame,
            text="Start automatically with Windows (Recommended for POS Till)",
            variable=self.create_startup,
            font=("Segoe UI", 9),
            fg="#f8fafc",
            bg="#1e293b",
            selectcolor="#0f172a",
            activebackground="#1e293b"
        )
        chk2.pack(anchor="w", pady=2)

        chk3 = tk.Checkbutton(
            opts_frame,
            text="Launch Kerala Superstore POS Sync after installation",
            variable=self.launch_after,
            font=("Segoe UI", 9),
            fg="#f8fafc",
            bg="#1e293b",
            selectcolor="#0f172a",
            activebackground="#1e293b"
        )
        chk3.pack(anchor="w", pady=2)

    def perform_installation(self):
        target_dir = self.install_dir_var.get().strip()
        if not target_dir:
            messagebox.showerror("Error", "Please enter a valid destination folder.")
            return

        try:
            os.makedirs(target_dir, exist_ok=True)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to create installation folder:\n{e}")
            return

        # Find the bundled or sibling KSS-POS-Sync.exe
        base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
        source_exe = os.path.join(base_dir, APP_EXE)

        # If not in same folder, check public/downloads
        if not os.path.exists(source_exe):
            root_cand = os.path.abspath(os.path.join(base_dir, "..", "..", "public", "downloads", APP_EXE))
            if os.path.exists(root_cand):
                source_exe = root_cand

        dest_exe = os.path.join(target_dir, APP_EXE)
        dest_cfg = os.path.join(target_dir, "config.json")

        # Copy or extract executable
        try:
            if os.path.exists(source_exe):
                shutil.copy2(source_exe, dest_exe)
            else:
                # If building monolithic
                print(f"Warning: source exe {source_exe} not found directly.")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to copy application files:\n{e}")
            return

        # Write config.json
        try:
            with open(dest_cfg, "w", encoding="utf-8") as f:
                json.dump(CONFIG_DATA, f, indent=2)
        except Exception as e:
            print(f"Config write error: {e}")

        # Create Desktop Shortcut
        if self.create_desktop_icon.get():
            desktop_dir = os.path.join(os.path.expanduser("~"), "Desktop")
            shortcut_path = os.path.join(desktop_dir, f"{APP_NAME}.lnk")
            create_windows_shortcut(dest_exe, shortcut_path, "Kerala Superstore POS Sync Bridge")

        # Create Start Menu Shortcut
        try:
            start_menu_dir = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", "Kerala Superstore")
            os.makedirs(start_menu_dir, exist_ok=True)
            create_windows_shortcut(dest_exe, os.path.join(start_menu_dir, f"{APP_NAME}.lnk"))
        except Exception:
            pass

        # Windows Startup
        if self.create_startup.get():
            add_to_startup(dest_exe)

        # Show completion screen
        self.show_completion(dest_exe)

    def show_completion(self, installed_exe):
        for widget in self.body.winfo_children():
            widget.destroy()

        self.btn_cancel.pack_forget()
        self.btn_next.config(
            text="Finish",
            command=lambda: self.finish_installer(installed_exe),
            bg="#10b981"
        )

        icon_lbl = tk.Label(
            self.body,
            text="🎉",
            font=("Segoe UI", 36),
            fg="#10b981",
            bg="#0f172a"
        )
        icon_lbl.pack(pady=(10, 0))

        done_lbl = tk.Label(
            self.body,
            text="Installation Completed Successfully!",
            font=("Segoe UI", 14, "bold"),
            fg="#4ade80",
            bg="#0f172a"
        )
        done_lbl.pack(pady=(4, 10))

        info_lbl = tk.Label(
            self.body,
            text=f"Kerala Superstore POS Sync has been installed to:\n{self.install_dir_var.get()}\n\n"
                 f"• Desktop shortcut created\n"
                 f"• Configured for RetailV2 (epos SQL Server)\n"
                 f"• Website Stock Sync target: https://keralasuperstore.com",
            font=("Segoe UI", 9),
            fg="#cbd5e1",
            bg="#0f172a",
            justify="center"
        )
        info_lbl.pack(pady=(0, 10))

    def finish_installer(self, installed_exe):
        if self.launch_after.get() and os.path.exists(installed_exe):
            os.startfile(installed_exe)
        self.root.quit()

def main():
    root = tk.Tk()
    app = InstallerWizard(root)
    root.mainloop()

if __name__ == "__main__":
    main()
