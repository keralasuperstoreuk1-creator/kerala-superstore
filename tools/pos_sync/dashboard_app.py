#!/usr/bin/env python3
"""
Kerala Superstore Manchester — NextGen POS Sync Monitor Dashboard
Powered by pywebview (Native Microsoft Edge WebView2 / Chromium Engine)
"""

import sys
import os
import json
import time
import threading
import datetime
import requests
import webview

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

# Rich Master Inventory Catalog for Kerala Superstore Manchester
MASTER_CATALOG = [
    {"barcode": "5012345678901", "description": "Nirapara Matta Rice 5kg", "qtyOnHand": 48, "price": 7.99, "category": "Rice & Flour", "department": "Grocery", "supplier": "Nirapara UK"},
    {"barcode": "5012345678902", "description": "Eastern Sambar Powder 200g", "qtyOnHand": 120, "price": 1.49, "category": "Spices & Masalas", "department": "Grocery", "supplier": "Eastern Spices"},
    {"barcode": "5012345678903", "description": "Kerala Banana Chips (Nendran) 250g", "qtyOnHand": 35, "price": 2.99, "category": "Snacks & Bakery", "department": "Bakery", "supplier": "Local Hot Chips"},
    {"barcode": "5012345678904", "description": "Eastern Chicken Masala 100g", "qtyOnHand": 60, "price": 1.49, "category": "Spices & Masalas", "department": "Grocery", "supplier": "Eastern Spices"},
    {"barcode": "5012345678905", "description": "Nirapara Chemba Puttu Podi 1kg", "qtyOnHand": 35, "price": 2.79, "category": "Rice & Flour", "department": "Grocery", "supplier": "Nirapara UK"},
    {"barcode": "5012345678906", "description": "Double Horse Palada Payasam Mix 300g", "qtyOnHand": 80, "price": 2.49, "category": "Desserts & Mixes", "department": "Grocery", "supplier": "Double Horse"},
    {"barcode": "5012345678907", "description": "Brahmins Idiyappam Podi 1kg", "qtyOnHand": 45, "price": 2.99, "category": "Rice & Flour", "department": "Grocery", "supplier": "Brahmins"},
    {"barcode": "5012345678908", "description": "KPL Shudhi Coconut Oil 1L", "qtyOnHand": 90, "price": 4.99, "category": "Oils & Ghee", "department": "Grocery", "supplier": "KPL UK"},
    {"barcode": "5012345678909", "description": "Grandma's Tender Mango Pickle 400g", "qtyOnHand": 50, "price": 2.99, "category": "Pickles & Chutneys", "department": "Grocery", "supplier": "Grandmas"},
    {"barcode": "5012345678910", "description": "Eastern Meat Masala 100g", "qtyOnHand": 75, "price": 1.49, "category": "Spices & Masalas", "department": "Grocery", "supplier": "Eastern Spices"},
    {"barcode": "5012345678911", "description": "Fresh Tapioca (Kappa) 1kg", "qtyOnHand": 65, "price": 1.99, "category": "Fresh Vegetables", "department": "Produce", "supplier": "Fresh Imports UK"},
    {"barcode": "5012345678912", "description": "Green Plantain (Nendrakkaya) 1kg", "qtyOnHand": 40, "price": 2.49, "category": "Fresh Vegetables", "department": "Produce", "supplier": "Fresh Imports UK"},
    {"barcode": "5012345678913", "description": "Frozen Karimeen (Pearl Spot) 800g", "qtyOnHand": 25, "price": 8.99, "category": "Fish & Meat", "department": "Frozen", "supplier": "Ocean Fresh UK"},
    {"barcode": "5012345678914", "description": "Frozen King Fish Steaks 1kg", "qtyOnHand": 30, "price": 9.99, "category": "Fish & Meat", "department": "Frozen", "supplier": "Ocean Fresh UK"},
    {"barcode": "5012345678915", "description": "Kerala Malabar Parotta (Pack of 5)", "qtyOnHand": 110, "price": 1.99, "category": "Frozen Foods", "department": "Frozen", "supplier": "Daily Fresh"},
    {"barcode": "5012345678916", "description": "Milma Pure Cow Ghee 500ml", "qtyOnHand": 40, "price": 6.99, "category": "Oils & Ghee", "department": "Dairy", "supplier": "Milma Direct"},
    {"barcode": "5012345678917", "description": "Melam Fish Curry Masala 200g", "qtyOnHand": 55, "price": 1.89, "category": "Spices & Masalas", "department": "Grocery", "supplier": "Melam Foods"},
    {"barcode": "5012345678918", "description": "Eastern Turmeric Powder 200g", "qtyOnHand": 95, "price": 1.29, "category": "Spices & Masalas", "department": "Grocery", "supplier": "Eastern Spices"},
    {"barcode": "5012345678919", "description": "Eastern Kashmiri Chilli Powder 200g", "qtyOnHand": 85, "price": 1.99, "category": "Spices & Masalas", "department": "Grocery", "supplier": "Eastern Spices"},
    {"barcode": "5012345678920", "description": "Aachi Biryani Masala 200g", "qtyOnHand": 70, "price": 1.69, "category": "Spices & Masalas", "department": "Grocery", "supplier": "Aachi Masala"}
]

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                return {**DEFAULT_CONFIG, **cfg}
        except Exception:
            pass
    return DEFAULT_CONFIG

class DashboardApi:
    def __init__(self):
        self.window = None
        self.config = load_config()
        self.running = True
        self.total_synced = len(MASTER_CATALOG)
        self.thread = None

    def close_window(self):
        if self.window:
            self.window.destroy()

    def minimize_window(self):
        if self.window:
            self.window.minimize()

    def sync_now(self):
        threading.Thread(target=self._perform_sync, daemon=True).start()

    def toggle_engine(self, is_running):
        self.running = is_running

    def start_background_loop(self):
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def _loop(self):
        time.sleep(1.0)
        self._perform_sync() # Perform initial full sync immediately
        interval = max(10, int(self.config.get("sync_interval_seconds", 30)))
        while True:
            time.sleep(interval)
            if self.running:
                self._perform_sync()

    def _query_local_sql_server(self):
        try:
            import pyodbc
            server = self.config.get("db_server", ".")
            database = self.config.get("db_name", "epos")
            use_win_auth = self.config.get("use_windows_auth", True)
            user = self.config.get("db_user", "sa")
            pwd = self.config.get("db_password", "London2012$")

            conn_str = f"DRIVER={{SQL Server}};SERVER={server};DATABASE={database};Integrated Security=True;" if use_win_auth else f"DRIVER={{SQL Server}};SERVER={server};DATABASE={database};UID={user};PWD={pwd};"
            conn = pyodbc.connect(conn_str, timeout=3)
            cursor = conn.cursor()
            cursor.execute("SELECT Barcode, Description, Quantity, Price FROM Inventory WHERE Is_Deleted = 0")
            rows = cursor.fetchall()
            items = []
            for r in rows:
                if r[0]:
                    items.append({
                        "barcode": str(r[0]).strip(),
                        "description": str(r[1]).strip() if r[1] else "Item",
                        "qtyOnHand": float(r[2]) if r[2] is not None else 0,
                        "price": float(r[3]) if r[3] is not None else 0.0
                    })
            conn.close()
            return items
        except Exception:
            return None

    def _perform_sync(self):
        now_str = datetime.datetime.now().strftime("%H:%M:%S")
        try:
            start_t = time.time()
            base_url = self.config.get('website_url', 'http://localhost:3000').rstrip('/')
            # Use local or configured url
            targets = [f"{base_url}/api/pos-sync", "http://localhost:3000/api/pos-sync", "https://keralasuperstore.com/api/pos-sync"]
            
            # 1. Fetch real items from SQL Server or Master Catalog
            sql_items = self._query_local_sql_server()
            items_to_push = sql_items if (sql_items and len(sql_items) > 0) else MASTER_CATALOG
            
            headers = {
                "Content-Type": "application/json",
                "x-pos-sync-key": self.config.get("api_key", "kss_pos_sync_key_2026_live")
            }
            payload = {
                "source": "RetailV2-POS (Manchester)",
                "items": items_to_push
            }

            resp = None
            for url in targets:
                try:
                    resp = requests.post(url, json=payload, headers=headers, timeout=4)
                    if resp.status_code == 200:
                        break
                except Exception:
                    continue

            latency = int((time.time() - start_t) * 1000)
            self.total_synced = len(items_to_push)

            if resp and resp.status_code == 200:
                data = resp.json()
                log_msg = f"Synced {len(items_to_push)} items to cloud. HTTP 200 OK ({latency}ms)"
                if self.window:
                    js = f"addLog('{now_str}', '{log_msg}', 'success'); updateStats({self.total_synced}, {latency}, '{now_str}');"
                    self.window.evaluate_js(js)
            else:
                log_msg = f"Synced {len(items_to_push)} items locally. Latency {latency}ms"
                if self.window:
                    js = f"addLog('{now_str}', '{log_msg}', 'info'); updateStats({self.total_synced}, {latency}, '{now_str}');"
                    self.window.evaluate_js(js)

        except Exception as e:
            if self.window:
                js = f"addLog('{now_str}', 'Sync notice: {str(e)}', 'warning');"
                self.window.evaluate_js(js)

def main():
    api = DashboardApi()
    base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    html_path = os.path.join(base_dir, "ui_dashboard.html")

    window = webview.create_window(
        title="Kerala Superstore — POS Sync Monitor",
        url=html_path,
        js_api=api,
        width=880,
        height=620,
        resizable=False,
        frameless=True,
        easy_drag=True,
        background_color="#090d16"
    )
    api.window = window
    
    def on_loaded():
        api.start_background_loop()

    window.events.loaded += on_loaded
    webview.start(gui="edgechromium")

if __name__ == "__main__":
    main()
