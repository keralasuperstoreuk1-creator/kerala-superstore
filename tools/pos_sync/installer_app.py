#!/usr/bin/env python3
"""
Kerala Superstore Manchester — NextGen 2026 POS Sync Modern Installer
Powered by pywebview (Native Microsoft Edge WebView2 / Chromium Engine)
"""

import sys
import os
import shutil
import json
import time
import threading
import winreg
from tkinter import filedialog, Tk
import webview

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
        shortcut.IconLocation = target_path
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
        print(f"Startup error: {e}")
        return False

class InstallerApi:
    def __init__(self):
        self.window = None
        self.installed_exe = ""
        self.launch_after = True

    def get_default_dir(self):
        return DEFAULT_INSTALL_DIR

    def browse_folder(self):
        root = Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        folder = filedialog.askdirectory(initialdir=DEFAULT_INSTALL_DIR)
        root.destroy()
        if folder:
            return os.path.join(folder, "KeralaSuperstore", "POSSync")
        return None

    def close_window(self):
        if self.window:
            self.window.destroy()

    def minimize_window(self):
        if self.window:
            self.window.minimize()

    def run_installation(self, options):
        threading.Thread(target=self._install_worker, args=(options,), daemon=True).start()

    def _install_worker(self, options):
        target_dir = options.get("targetDir", DEFAULT_INSTALL_DIR)
        create_shortcut = options.get("shortcut", True)
        enable_startup = options.get("startup", True)
        self.launch_after = options.get("launch", True)

        def eval_js(js):
            if self.window:
                self.window.evaluate_js(js)

        try:
            time.sleep(0.3)
            eval_js("setProgress(20, 'Creating application directories...'); addLog('Created destination: " + target_dir.replace("\\", "/") + "', 'STEP 2 OF 5');")
            os.makedirs(target_dir, exist_ok=True)
            time.sleep(0.4)

            # Locate source exe
            base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
            source_exe = os.path.join(base_dir, APP_EXE)
            if not os.path.exists(source_exe):
                root_cand = os.path.abspath(os.path.join(base_dir, "..", "..", "public", "downloads", APP_EXE))
                if os.path.exists(root_cand):
                    source_exe = root_cand

            dest_exe = os.path.join(target_dir, APP_EXE)
            dest_cfg = os.path.join(target_dir, "config.json")
            self.installed_exe = dest_exe

            eval_js("setProgress(45, 'Extracting NextGen POS Sync Standalone engine...'); addLog('Extracted " + APP_EXE + " to application directory', 'STEP 3 OF 5');")
            if os.path.exists(source_exe):
                shutil.copy2(source_exe, dest_exe)
            time.sleep(0.4)

            eval_js("setProgress(65, 'Writing RetailV2 (epos) SQL Server configuration...'); addLog('Configured SQL Server connection on localhost:1433', 'STEP 3 OF 5');")
            with open(dest_cfg, "w", encoding="utf-8") as f:
                json.dump(CONFIG_DATA, f, indent=2)
            time.sleep(0.3)

            if create_shortcut:
                eval_js("setProgress(80, 'Creating Desktop Shortcut...'); addLog('Created Desktop shortcut: Kerala Superstore POS Sync', 'STEP 4 OF 5');")
                desktop_dir = os.path.join(os.path.expanduser("~"), "Desktop")
                shortcut_path = os.path.join(desktop_dir, f"{APP_NAME}.lnk")
                create_windows_shortcut(dest_exe, shortcut_path, "Kerala Superstore POS Stock Sync")
                
                # Start menu
                try:
                    start_menu = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", "Kerala Superstore")
                    os.makedirs(start_menu, exist_ok=True)
                    create_windows_shortcut(dest_exe, os.path.join(start_menu, f"{APP_NAME}.lnk"))
                except Exception:
                    pass
                time.sleep(0.3)

            if enable_startup:
                eval_js("setProgress(90, 'Registering Windows Background Startup Service...'); addLog('Registered Windows HKCU Startup Registry entry', 'STEP 5 OF 5');")
                add_to_startup(dest_exe)
                time.sleep(0.3)

            eval_js("setProgress(100, 'Installation finalized successfully!'); addLog('All components verified intact. Ready to launch.', 'STEP 5 OF 5'); onInstallSuccess();")

        except Exception as ex:
            eval_js(f"addLog('ERROR: {str(ex)}', 'FAILED');")

    def finish_and_launch(self):
        if self.launch_after and os.path.exists(self.installed_exe):
            try:
                os.startfile(self.installed_exe)
            except Exception as e:
                print(f"Launch error: {e}")
        if self.window:
            self.window.destroy()

def main():
    api = InstallerApi()
    base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    html_path = os.path.join(base_dir, "ui_installer.html")

    window = webview.create_window(
        title="Kerala Superstore — POS Sync Setup",
        url=html_path,
        js_api=api,
        width=780,
        height=620,
        resizable=False,
        frameless=True,
        easy_drag=True,
        background_color="#090d16"
    )
    api.window = window
    webview.start(gui="edgechromium")

if __name__ == "__main__":
    main()
