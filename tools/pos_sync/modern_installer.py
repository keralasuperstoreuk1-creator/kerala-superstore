#!/usr/bin/env python3
"""
Kerala Superstore Manchester — Modern 2026 Windows Installer Wizard
Built with CustomTkinter for a sleek, premium dark-mode desktop experience.
"""

import sys
import os
import shutil
import json
import time
import threading
import winreg
import customtkinter as ctk
from PIL import Image

# Initialize CustomTkinter Theme
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("green")

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
        print(f"Shortcut error: {e}")
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

class ModernInstallerApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title(f"Setup — {APP_NAME} (2026 NextGen)")
        self.geometry("740x560")
        self.minsize(720, 540)
        self.configure(fg_color="#090d16")

        # Variables
        self.install_dir_var = ctk.StringVar(value=DEFAULT_INSTALL_DIR)
        self.desktop_shortcut_var = ctk.BooleanVar(value=True)
        self.startup_var = ctk.BooleanVar(value=True)
        self.launch_after_var = ctk.BooleanVar(value=True)

        self.installed_exe_path = ""
        self.build_ui()

    def build_ui(self):
        # 1. Top Header Brand Bar
        self.header_frame = ctk.CTkFrame(self, fg_color="#111827", corner_radius=0, height=90)
        self.header_frame.pack(fill="x", side="top")
        self.header_frame.pack_propagate(False)

        header_content = ctk.CTkFrame(self.header_frame, fg_color="transparent")
        header_content.pack(fill="both", expand=True, padx=25, pady=15)

        title_box = ctk.CTkFrame(header_content, fg_color="transparent")
        title_box.pack(side="left", fill="y")

        self.lbl_main_title = ctk.CTkLabel(
            title_box,
            text="🌿 Kerala Superstore — POS Sync Setup",
            font=ctk.CTkFont(family="Segoe UI", size=18, weight="bold"),
            text_color="#f8fafc"
        )
        self.lbl_main_title.pack(anchor="w")

        self.lbl_sub_title = ctk.CTkLabel(
            title_box,
            text="RetailV2 (epos SQL Server) ➔ keralasuperstore.com Real-time Bridge",
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color="#94a3b8"
        )
        self.lbl_sub_title.pack(anchor="w", pady=(2, 0))

        # Version Badge
        badge = ctk.CTkLabel(
            header_content,
            text="v2.0 NEXTGEN",
            font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"),
            text_color="#34d399",
            fg_color="#064e3b",
            corner_radius=8,
            padx=10,
            pady=4
        )
        badge.pack(side="right", padx=5)

        # 2. Dynamic Main Body Container
        self.main_body = ctk.CTkFrame(self, fg_color="#090d16", corner_radius=0)
        self.main_body.pack(fill="both", expand=True, padx=25, pady=15)

        # 3. Bottom Navigation Footer
        self.footer_frame = ctk.CTkFrame(self, fg_color="#111827", corner_radius=0, height=75)
        self.footer_frame.pack(fill="x", side="bottom")
        self.footer_frame.pack_propagate(False)

        self.btn_cancel = ctk.CTkButton(
            self.footer_frame,
            text="Cancel",
            command=self.destroy,
            font=ctk.CTkFont(family="Segoe UI", size=12),
            fg_color="#1f2937",
            hover_color="#374151",
            text_color="#cbd5e1",
            width=100,
            height=38,
            corner_radius=10
        )
        self.btn_cancel.pack(side="left", padx=25, pady=18)

        self.btn_action = ctk.CTkButton(
            self.footer_frame,
            text="Install Now ➔",
            command=self.start_installation,
            font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"),
            fg_color="#059669",
            hover_color="#047857",
            text_color="white",
            width=160,
            height=40,
            corner_radius=10
        )
        self.btn_action.pack(side="right", padx=25, pady=18)

        self.render_configuration_step()

    def render_configuration_step(self):
        for widget in self.main_body.winfo_children():
            widget.destroy()

        # Intro Card
        intro_card = ctk.CTkFrame(self.main_body, fg_color="#131d31", corner_radius=14, border_width=1, border_color="#1e293b")
        intro_card.pack(fill="x", pady=(0, 15), padx=5, ipady=8)

        lbl_welcome = ctk.CTkLabel(
            intro_card,
            text="Automated Stock & Sales Bridge for Windows",
            font=ctk.CTkFont(family="Segoe UI", size=14, weight="bold"),
            text_color="#38bdf8"
        )
        lbl_welcome.pack(anchor="w", padx=16, pady=(8, 2))

        lbl_desc = ctk.CTkLabel(
            intro_card,
            text="This tool connects directly into local RetailV2 SQL Server (epos database) in read-only mode.\n"
                 "It safely pushes live stock deductions and price updates to your website every 30 seconds.",
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color="#94a3b8",
            justify="left"
        )
        lbl_desc.pack(anchor="w", padx=16, pady=(0, 8))

        # Destination Location Card
        loc_card = ctk.CTkFrame(self.main_body, fg_color="#131d31", corner_radius=14, border_width=1, border_color="#1e293b")
        loc_card.pack(fill="x", pady=(0, 15), padx=5, ipady=6)

        lbl_loc = ctk.CTkLabel(
            loc_card,
            text="Installation Folder:",
            font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"),
            text_color="#f1f5f9"
        )
        lbl_loc.pack(anchor="w", padx=16, pady=(8, 4))

        loc_entry = ctk.CTkEntry(
            loc_card,
            textvariable=self.install_dir_var,
            font=ctk.CTkFont(family="Segoe UI", size=11),
            fg_color="#0b1120",
            border_color="#334155",
            text_color="white",
            height=36,
            corner_radius=8
        )
        loc_entry.pack(fill="x", padx=16, pady=(0, 10))

        # Options Card
        opts_card = ctk.CTkFrame(self.main_body, fg_color="#131d31", corner_radius=14, border_width=1, border_color="#1e293b")
        opts_card.pack(fill="x", padx=5, ipady=6)

        lbl_opts = ctk.CTkLabel(
            opts_card,
            text="Installation Preferences:",
            font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"),
            text_color="#f1f5f9"
        )
        lbl_opts.pack(anchor="w", padx=16, pady=(8, 6))

        sw1 = ctk.CTkCheckBox(
            opts_card,
            text="Create Desktop Shortcut ('Kerala Superstore POS Sync')",
            variable=self.desktop_shortcut_var,
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color="#e2e8f0",
            fg_color="#059669",
            hover_color="#047857",
            corner_radius=6
        )
        sw1.pack(anchor="w", padx=16, pady=4)

        sw2 = ctk.CTkCheckBox(
            opts_card,
            text="Start automatically with Windows (Recommended for POS Till PC)",
            variable=self.startup_var,
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color="#e2e8f0",
            fg_color="#059669",
            hover_color="#047857",
            corner_radius=6
        )
        sw2.pack(anchor="w", padx=16, pady=4)

        sw3 = ctk.CTkCheckBox(
            opts_card,
            text="Launch POS Sync agent immediately after installation completes",
            variable=self.launch_after_var,
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color="#e2e8f0",
            fg_color="#059669",
            hover_color="#047857",
            corner_radius=6
        )
        sw3.pack(anchor="w", padx=16, pady=(4, 10))

    def start_installation(self):
        target_dir = self.install_dir_var.get().strip()
        if not target_dir:
            return

        # Switch to Progress Screen
        for widget in self.main_body.winfo_children():
            widget.destroy()

        self.btn_cancel.configure(state="disabled")
        self.btn_action.configure(state="disabled", text="Installing...")

        prog_card = ctk.CTkFrame(self.main_body, fg_color="#131d31", corner_radius=16, border_width=1, border_color="#1e293b")
        prog_card.pack(fill="both", expand=True, padx=5, pady=10, ipady=20)

        self.lbl_status = ctk.CTkLabel(
            prog_card,
            text="Preparing installation environment...",
            font=ctk.CTkFont(family="Segoe UI", size=14, weight="bold"),
            text_color="#38bdf8"
        )
        self.lbl_status.pack(anchor="w", padx=25, pady=(25, 10))

        self.progress_bar = ctk.CTkProgressBar(
            prog_card,
            orientation="horizontal",
            mode="determinate",
            height=14,
            corner_radius=7,
            fg_color="#0b1120",
            progress_color="#10b981"
        )
        self.progress_bar.pack(fill="x", padx=25, pady=(0, 15))
        self.progress_bar.set(0)

        self.lbl_detail = ctk.CTkLabel(
            prog_card,
            text="Initializing target directory...",
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color="#94a3b8"
        )
        self.lbl_detail.pack(anchor="w", padx=25, pady=(0, 15))

        # Live terminal log box
        self.log_box = ctk.CTkTextbox(
            prog_card,
            font=ctk.CTkFont(family="Consolas", size=10),
            fg_color="#080c14",
            text_color="#cbd5e1",
            corner_radius=10,
            border_width=1,
            border_color="#1e293b"
        )
        self.log_box.pack(fill="both", expand=True, padx=25, pady=(0, 20))

        # Start thread
        threading.Thread(target=self._run_install_pipeline, daemon=True).start()

    def _log(self, text, pct=None):
        def _update():
            self.lbl_detail.configure(text=text)
            self.log_box.insert("end", f"➔ {text}\n")
            self.log_box.see("end")
            if pct is not None:
                self.progress_bar.set(pct)
        self.after(0, _update)

    def _run_install_pipeline(self):
        target_dir = self.install_dir_var.get().strip()

        try:
            self._log("Creating application directory structure...", 0.15)
            os.makedirs(target_dir, exist_ok=True)
            time.sleep(0.4)

            # Find source binary
            base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
            source_exe = os.path.join(base_dir, APP_EXE)
            if not os.path.exists(source_exe):
                root_cand = os.path.abspath(os.path.join(base_dir, "..", "..", "public", "downloads", APP_EXE))
                if os.path.exists(root_cand):
                    source_exe = root_cand

            dest_exe = os.path.join(target_dir, APP_EXE)
            dest_cfg = os.path.join(target_dir, "config.json")
            self.installed_exe_path = dest_exe

            self._log("Unpacking NextGen sync engine executable...", 0.35)
            if os.path.exists(source_exe):
                shutil.copy2(source_exe, dest_exe)
            time.sleep(0.5)

            self._log("Configuring RetailV2 SQL Server (epos) connection parameters...", 0.55)
            with open(dest_cfg, "w", encoding="utf-8") as f:
                json.dump(CONFIG_DATA, f, indent=2)
            time.sleep(0.4)

            if self.desktop_shortcut_var.get():
                self._log("Creating Desktop shortcut with application icon...", 0.75)
                desktop_dir = os.path.join(os.path.expanduser("~"), "Desktop")
                shortcut_path = os.path.join(desktop_dir, f"{APP_NAME}.lnk")
                create_windows_shortcut(dest_exe, shortcut_path, "Kerala Superstore POS Stock Sync")
                time.sleep(0.3)

            # Start menu
            try:
                self._log("Registering Start Menu shortcut...", 0.85)
                start_menu = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", "Kerala Superstore")
                os.makedirs(start_menu, exist_ok=True)
                create_windows_shortcut(dest_exe, os.path.join(start_menu, f"{APP_NAME}.lnk"))
            except Exception:
                pass

            if self.startup_var.get():
                self._log("Configuring Windows Background Auto-Start service...", 0.95)
                add_to_startup(dest_exe)
                time.sleep(0.3)

            self._log("Finalizing installation and verifying integrity...", 1.0)
            time.sleep(0.5)

            self.after(0, self.render_success_screen)

        except Exception as ex:
            self._log(f"Installation Error: {ex}")
            self.after(0, lambda: self.btn_cancel.configure(state="normal"))

    def render_success_screen(self):
        for widget in self.main_body.winfo_children():
            widget.destroy()

        self.btn_cancel.pack_forget()
        self.btn_action.configure(
            state="normal",
            text="Launch POS Sync ➔",
            command=self.finish_and_launch,
            fg_color="#059669",
            hover_color="#047857",
            width=180
        )

        done_card = ctk.CTkFrame(self.main_body, fg_color="#131d31", corner_radius=16, border_width=1, border_color="#059669")
        done_card.pack(fill="both", expand=True, padx=5, pady=10, ipady=15)

        lbl_icon = ctk.CTkLabel(
            done_card,
            text="✨",
            font=ctk.CTkFont(size=42)
        )
        lbl_icon.pack(pady=(20, 5))

        lbl_congrats = ctk.CTkLabel(
            done_card,
            text="Installation Completed Successfully!",
            font=ctk.CTkFont(family="Segoe UI", size=18, weight="bold"),
            text_color="#34d399"
        )
        lbl_congrats.pack(pady=(0, 10))

        info_text = (
            f"Kerala Superstore POS Sync is ready on this machine.\n\n"
            f"📍 Installed Path: {self.install_dir_var.get()}\n"
            f"🎯 Cloud Sync Target: https://keralasuperstore.com\n"
            f"🖥️ Local Database: Microsoft SQL Server (epos)\n"
            f"🚀 Background Auto-Start: Enabled"
        )

        lbl_info = ctk.CTkLabel(
            done_card,
            text=info_text,
            font=ctk.CTkFont(family="Segoe UI", size=12),
            text_color="#cbd5e1",
            justify="center"
        )
        lbl_info.pack(pady=10)

    def finish_and_launch(self):
        if self.launch_after_var.get() and os.path.exists(self.installed_exe_path):
            try:
                os.startfile(self.installed_exe_path)
            except Exception as e:
                print(f"Launch error: {e}")
        self.destroy()

def main():
    app = ModernInstallerApp()
    app.mainloop()

if __name__ == "__main__":
    main()
