#!/usr/bin/env python3
"""
Kerala Superstore Manchester — RetailV2 POS Stock & Price Sync Agent
Standalone Windows tool to sync local SQL Server (epos database) with https://keralasuperstore.com
"""

import sys
import os
import json
import time
import threading
import datetime
import requests
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext

CONFIG_FILE = "config.json"
DEFAULT_CONFIG = {
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

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                return {**DEFAULT_CONFIG, **cfg}
        except Exception as e:
            print(f"Error loading config: {e}")
    save_config(DEFAULT_CONFIG)
    return DEFAULT_CONFIG

def save_config(cfg):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except Exception as e:
        print(f"Error saving config: {e}")

class PosSyncEngine:
    def __init__(self, config, logger_callback=None):
        self.config = config
        self.logger = logger_callback or (lambda msg, level='info': print(f"[{level.upper()}] {msg}"))
        self.running = False
        self.thread = None
        self.last_sync_time = None
        self.total_synced = 0
        self.is_syncing = False

    def get_db_connection(self):
        try:
            import pyodbc
        except ImportError:
            self.logger("pyodbc not installed. Running in mock/simulation mode.", "warning")
            return None

        server = self.config.get("db_server", ".")
        database = self.config.get("db_name", "epos")
        use_win_auth = self.config.get("use_windows_auth", True)
        user = self.config.get("db_user", "sa")
        pwd = self.config.get("db_password", "London2012$")

        drivers = [
            "ODBC Driver 18 for SQL Server",
            "ODBC Driver 17 for SQL Server",
            "SQL Server Native Client 11.0",
            "SQL Server"
        ]

        installed_drivers = pyodbc.drivers()
        self.logger(f"Detected ODBC Drivers: {', '.join(installed_drivers) if installed_drivers else 'None'}", "info")

        for drv in drivers:
            if drv in installed_drivers or not installed_drivers:
                try:
                    if use_win_auth:
                        conn_str = f"DRIVER={{{drv}}};SERVER={server};DATABASE={database};Integrated Security=True;TrustServerCertificate=yes;"
                    else:
                        conn_str = f"DRIVER={{{drv}}};SERVER={server};DATABASE={database};UID={user};PWD={pwd};TrustServerCertificate=yes;"
                    
                    conn = pyodbc.connect(conn_str, timeout=5)
                    self.logger(f"Connected to SQL Server [{database}] using '{drv}'", "success")
                    return conn
                except Exception as ex:
                    continue

        # Fallback direct
        try:
            if use_win_auth:
                conn_str = f"DRIVER={{SQL Server}};SERVER={server};DATABASE={database};Integrated Security=True;"
            else:
                conn_str = f"DRIVER={{SQL Server}};SERVER={server};DATABASE={database};UID={user};PWD={pwd};"
            return pyodbc.connect(conn_str, timeout=5)
        except Exception as ex:
            self.logger(f"SQL Server connection failed: {ex}", "error")
            return None

    def test_connection(self):
        conn = self.get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM Inventory WHERE Is_Deleted = 0")
                count = cursor.fetchone()[0]
                conn.close()
                return True, f"Connected to RetailV2 Database! Found {count:,} active products in Inventory."
            except Exception as e:
                return False, f"Connected, but query failed: {str(e)}"
        return False, "Could not connect to local SQL Server. Ensure RetailV2/epos database is running."

    def fetch_inventory_from_db(self):
        conn = self.get_db_connection()
        if not conn:
            # Fallback mock for demonstration/testing if SQL Server not on this dev PC
            self.logger("Using local fallback data (SQL Server not reachable on this machine)", "warning")
            return [
                {
                    "sku": 1001,
                    "barcode": "5012345678901",
                    "description": "Nirapara Matta Rice 5kg",
                    "quantity": 48,
                    "price": 7.99,
                    "webPrice": 7.49,
                    "active": True
                },
                {
                    "sku": 1002,
                    "barcode": "5012345678902",
                    "description": "Eastern Sambar Powder 200g",
                    "quantity": 120,
                    "price": 1.49,
                    "webPrice": 1.39,
                    "active": True
                },
                {
                    "sku": 1003,
                    "barcode": "5012345678903",
                    "description": "Kerala Banana Chips (Nendran) 250g",
                    "quantity": 15,
                    "price": 2.99,
                    "webPrice": 2.99,
                    "active": True
                }
            ]

        try:
            cursor = conn.cursor()
            query = """
            SELECT SKU, Barcode, Description, Quantity, Price, Web_Price, Active, Is_Deleted, Last_Modified
            FROM Inventory
            WHERE Is_Deleted = 0
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            
            items = []
            for row in rows:
                barcode = str(row[1]).strip() if row[1] else None
                if not barcode:
                    continue
                
                sku = row[0]
                desc = str(row[2]).strip() if row[2] else "Item"
                qty = float(row[3]) if row[3] is not None else 0.0
                price = float(row[4]) if row[4] is not None else 0.0
                web_price = float(row[5]) if row[5] is not None else price
                active = bool(row[6]) if row[6] is not None else True
                last_mod = str(row[8]) if row[8] is not None else None

                items.append({
                    "sku": sku,
                    "barcode": barcode,
                    "description": desc,
                    "quantity": qty,
                    "price": price,
                    "webPrice": web_price,
                    "active": active,
                    "lastModified": last_mod
                })
            
            conn.close()
            return items
        except Exception as e:
            self.logger(f"Error reading Inventory table: {e}", "error")
            return []

    def push_to_website(self, items):
        if not items:
            self.logger("No items to push.", "info")
            return False, "No items"

        base_url = self.config.get("website_url", "https://keralasuperstore.com").rstrip("/")
        sync_url = f"{base_url}/api/pos/sync"
        api_key = self.config.get("api_key", "kss_pos_sync_key_2026_live")
        batch_size = self.config.get("batch_size", 500)

        headers = {
            "Content-Type": "application/json",
            "X-POS-SYNC-KEY": api_key
        }

        total_batches = (len(items) + batch_size - 1) // batch_size
        self.logger(f"Pushing {len(items)} items to {sync_url} in {total_batches} batch(es)...", "info")

        success_count = 0
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            payload = {
                "source": "RetailV2-POS (Manchester)",
                "batchIndex": (i // batch_size) + 1,
                "totalBatches": total_batches,
                "items": batch
            }
            try:
                resp = requests.post(sync_url, json=payload, headers=headers, timeout=20)
                if resp.status_code == 200:
                    data = resp.json()
                    success_count += len(batch)
                    self.logger(f"Batch {(i // batch_size) + 1}/{total_batches} synced OK ({len(batch)} items).", "success")
                else:
                    self.logger(f"Sync failed HTTP {resp.status_code}: {resp.text}", "error")
                    return False, f"HTTP {resp.status_code}"
            except Exception as e:
                self.logger(f"Network error connecting to website: {e}", "error")
                return False, str(e)

        self.last_sync_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.total_synced = success_count
        return True, f"Successfully pushed {success_count} items."

    def perform_sync(self):
        if self.is_syncing:
            self.logger("Sync is already running. Skipping overlapping cycle.", "warning")
            return
        
        self.is_syncing = True
        try:
            self.logger("--- Starting Inventory Stock & Price Sync ---", "info")
            items = self.fetch_inventory_from_db()
            self.logger(f"Retrieved {len(items)} products from RetailV2 Inventory.", "info")
            success, msg = self.push_to_website(items)
            if success:
                self.logger(f"✅ Sync Complete: {msg}", "success")
            else:
                self.logger(f"❌ Sync Warning: {msg}", "warning")
        except Exception as ex:
            self.logger(f"Unhandled sync error: {ex}", "error")
        finally:
            self.is_syncing = False

    def start_auto_sync(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()
        self.logger("Auto-Sync service started.", "success")

    def stop_auto_sync(self):
        self.running = False
        self.logger("Auto-Sync service stopped.", "warning")

    def _loop(self):
        interval = max(5, int(self.config.get("sync_interval_seconds", 30)))
        while self.running:
            self.perform_sync()
            for _ in range(interval):
                if not self.running:
                    break
                time.sleep(1)


class PosSyncGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Kerala Superstore — RetailV2 POS Sync Bridge (2026)")
        self.root.geometry("860x650")
        self.root.minsize(780, 560)
        self.root.configure(bg="#0f172a")

        self.config = load_config()
        self.engine = PosSyncEngine(self.config, logger_callback=self.log_message)

        self.build_ui()

        # Auto start if configured
        if self.config.get("auto_start_sync", True):
            self.root.after(1000, self.toggle_auto_sync)

    def build_ui(self):
        # Header Banner
        header = tk.Frame(self.root, bg="#1e293b", padx=20, pady=16)
        header.pack(fill="x", side="top")

        title_lbl = tk.Label(
            header,
            text="🌿 Kerala Superstore — POS Inventory Sync",
            font=("Segoe UI", 16, "bold"),
            fg="#f8fafc",
            bg="#1e293b"
        )
        title_lbl.pack(anchor="w")

        sub_lbl = tk.Label(
            header,
            text=f"RetailV2 (epos SQL Server) ➔ {self.config.get('website_url')} — Auto Real-time Stock Sync",
            font=("Segoe UI", 9),
            fg="#94a3b8",
            bg="#1e293b"
        )
        sub_lbl.pack(anchor="w", pady=(2, 0))

        # Status Cards Container
        cards_frame = tk.Frame(self.root, bg="#0f172a", padx=20, pady=12)
        cards_frame.pack(fill="x")

        # Card 1: Status
        self.card_status = self.create_metric_card(cards_frame, "Sync Status", "IDLE / READY", "#3b82f6", 0)
        # Card 2: Last Sync
        self.card_time = self.create_metric_card(cards_frame, "Last Synchronized", "Never", "#10b981", 1)
        # Card 3: Total Synced
        self.card_items = self.create_metric_card(cards_frame, "Items Synced", "0", "#f59e0b", 2)
        # Card 4: Interval
        self.card_interval = self.create_metric_card(
            cards_frame, 
            "Sync Interval", 
            f"{self.config.get('sync_interval_seconds', 30)}s", 
            "#8b5cf6", 
            3
        )

        cards_frame.columnconfigure(0, weight=1)
        cards_frame.columnconfigure(1, weight=1)
        cards_frame.columnconfigure(2, weight=1)
        cards_frame.columnconfigure(3, weight=1)

        # Action Buttons Toolbar
        btn_bar = tk.Frame(self.root, bg="#0f172a", padx=20, pady=6)
        btn_bar.pack(fill="x")

        self.btn_toggle_auto = tk.Button(
            btn_bar,
            text="▶ Start Auto-Sync",
            command=self.toggle_auto_sync,
            font=("Segoe UI", 10, "bold"),
            bg="#10b981",
            fg="white",
            activebackground="#059669",
            activeforeground="white",
            relief="flat",
            padx=16,
            pady=8,
            cursor="hand2"
        )
        self.btn_toggle_auto.pack(side="left", padx=(0, 10))

        self.btn_sync_now = tk.Button(
            btn_bar,
            text="⚡ Sync Now (1-Click)",
            command=self.manual_sync,
            font=("Segoe UI", 10, "bold"),
            bg="#3b82f6",
            fg="white",
            activebackground="#2563eb",
            activeforeground="white",
            relief="flat",
            padx=16,
            pady=8,
            cursor="hand2"
        )
        self.btn_sync_now.pack(side="left", padx=(0, 10))

        self.btn_test_db = tk.Button(
            btn_bar,
            text="🔍 Test POS DB Connection",
            command=self.test_pos_connection,
            font=("Segoe UI", 10),
            bg="#334155",
            fg="#f1f5f9",
            activebackground="#475569",
            activeforeground="white",
            relief="flat",
            padx=14,
            pady=8,
            cursor="hand2"
        )
        self.btn_test_db.pack(side="left", padx=(0, 10))

        self.btn_settings = tk.Button(
            btn_bar,
            text="⚙️ Settings",
            command=self.open_settings,
            font=("Segoe UI", 10),
            bg="#334155",
            fg="#f1f5f9",
            activebackground="#475569",
            activeforeground="white",
            relief="flat",
            padx=14,
            pady=8,
            cursor="hand2"
        )
        self.btn_settings.pack(side="right")

        # Terminal / Log Box
        log_frame = tk.Frame(self.root, bg="#0f172a", padx=20, pady=10)
        log_frame.pack(fill="both", expand=True)

        log_lbl = tk.Label(
            log_frame,
            text="Live Synchronization Logs & POS Events:",
            font=("Segoe UI", 10, "bold"),
            fg="#cbd5e1",
            bg="#0f172a"
        )
        log_lbl.pack(anchor="w", pady=(0, 6))

        self.log_text = scrolledtext.ScrolledText(
            log_frame,
            wrap="word",
            font=("Consolas", 10),
            bg="#030712",
            fg="#e2e8f0",
            insertbackground="white",
            relief="flat",
            padx=10,
            pady=10
        )
        self.log_text.pack(fill="both", expand=True)

        # Configure color tags in log
        self.log_text.tag_config("info", foreground="#94a3b8")
        self.log_text.tag_config("success", foreground="#4ade80")
        self.log_text.tag_config("warning", foreground="#fbbf24")
        self.log_text.tag_config("error", foreground="#f87171")
        self.log_text.tag_config("timestamp", foreground="#64748b")

        # Footer
        footer = tk.Frame(self.root, bg="#0f172a", padx=20, pady=8)
        footer.pack(fill="x", side="bottom")

        ft_lbl = tk.Label(
            footer,
            text="RetailV2 Integration Bridge v2.0 · Kerala Superstore Manchester Ltd · Unit 2, 73 Old Market St, M9 8DX",
            font=("Segoe UI", 8),
            fg="#64748b",
            bg="#0f172a"
        )
        ft_lbl.pack(side="left")

    def create_metric_card(self, parent, title, value, color, col):
        card = tk.Frame(parent, bg="#1e293b", padx=14, pady=12, relief="flat", highlightthickness=1, highlightbackground="#334155")
        card.grid(row=0, column=col, sticky="nsew", padx=4)

        lbl_title = tk.Label(card, text=title.upper(), font=("Segoe UI", 8, "bold"), fg="#94a3b8", bg="#1e293b")
        lbl_title.pack(anchor="w")

        lbl_val = tk.Label(card, text=value, font=("Segoe UI", 13, "bold"), fg=color, bg="#1e293b")
        lbl_val.pack(anchor="w", pady=(4, 0))

        return lbl_val

    def log_message(self, message, level="info"):
        def _append():
            ts = datetime.datetime.now().strftime("%H:%M:%S")
            self.log_text.insert(tk.END, f"[{ts}] ", "timestamp")
            self.log_text.insert(tk.END, f"{message}\n", level)
            self.log_text.see(tk.END)

            # Update metrics
            if self.engine.last_sync_time:
                self.card_time.config(text=self.engine.last_sync_time.split(" ")[-1])
            if self.engine.total_synced:
                self.card_items.config(text=f"{self.engine.total_synced:,}")

        self.root.after(0, _append)

    def toggle_auto_sync(self):
        if self.engine.running:
            self.engine.stop_auto_sync()
            self.btn_toggle_auto.config(text="▶ Start Auto-Sync", bg="#10b981", activebackground="#059669")
            self.card_status.config(text="PAUSED", fg="#f59e0b")
        else:
            self.engine.start_auto_sync()
            self.btn_toggle_auto.config(text="⏸ Pause Auto-Sync", bg="#e11d48", activebackground="#be123c")
            self.card_status.config(text="🟢 AUTO-SYNC LIVE", fg="#10b981")

    def manual_sync(self):
        threading.Thread(target=self.engine.perform_sync, daemon=True).start()

    def test_pos_connection(self):
        def _run_test():
            self.log_message("Testing connection to RetailV2 local database...", "info")
            ok, msg = self.engine.test_connection()
            if ok:
                self.log_message(f"✅ DB Test Passed: {msg}", "success")
                messagebox.showinfo("Database Connection Successful", msg)
            else:
                self.log_message(f"❌ DB Test Failed: {msg}", "error")
                messagebox.showerror("Database Connection Error", msg)

        threading.Thread(target=_run_test, daemon=True).start()

    def open_settings(self):
        win = tk.Toplevel(self.root)
        win.title("POS Sync Bridge Settings")
        win.geometry("540x480")
        win.configure(bg="#0f172a")
        win.transient(self.root)
        win.grab_set()

        content = tk.Frame(win, bg="#0f172a", padx=20, pady=20)
        content.pack(fill="both", expand=True)

        fields = [
            ("Website API URL", "website_url", self.config.get("website_url")),
            ("POS Secret Key (X-POS-SYNC-KEY)", "api_key", self.config.get("api_key")),
            ("Sync Interval (Seconds)", "sync_interval_seconds", str(self.config.get("sync_interval_seconds"))),
            ("SQL Server Name / Host", "db_server", self.config.get("db_server")),
            ("Database Catalog Name", "db_name", self.config.get("db_name")),
            ("SQL Username (if SQL Auth)", "db_user", self.config.get("db_user")),
            ("SQL Password (if SQL Auth)", "db_password", self.config.get("db_password")),
        ]

        entries = {}
        for idx, (label, key, val) in enumerate(fields):
            lbl = tk.Label(content, text=label, font=("Segoe UI", 9, "bold"), fg="#e2e8f0", bg="#0f172a")
            lbl.pack(anchor="w", pady=(8, 2))

            ent = tk.Entry(content, font=("Segoe UI", 10), bg="#1e293b", fg="white", insertbackground="white", relief="flat")
            ent.insert(0, str(val))
            ent.pack(fill="x", ipady=4)
            entries[key] = ent

        def save_and_close():
            for key, ent in entries.items():
                val = ent.get().strip()
                if key == "sync_interval_seconds":
                    try:
                        self.config[key] = int(val)
                    except:
                        pass
                else:
                    self.config[key] = val

            save_config(self.config)
            self.engine.config = self.config
            self.card_interval.config(text=f"{self.config.get('sync_interval_seconds', 30)}s")
            self.log_message("Settings updated successfully.", "success")
            win.destroy()

        btn_save = tk.Button(
            content,
            text="Save Settings",
            command=save_and_close,
            font=("Segoe UI", 10, "bold"),
            bg="#10b981",
            fg="white",
            relief="flat",
            padx=20,
            pady=8,
            cursor="hand2"
        )
        btn_save.pack(pady=(20, 0))


def main():
    if "--headless" in sys.argv or "--service" in sys.argv:
        print("Starting Kerala Superstore POS Sync Agent in HEADLESS mode...")
        cfg = load_config()
        engine = PosSyncEngine(cfg)
        engine.start_auto_sync()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            engine.stop_auto_sync()
            print("Sync agent terminated.")
    else:
        root = tk.Tk()
        app = PosSyncGUI(root)
        root.mainloop()

if __name__ == "__main__":
    main()
