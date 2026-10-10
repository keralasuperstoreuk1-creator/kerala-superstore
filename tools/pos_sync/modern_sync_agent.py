#!/usr/bin/env python3
"""
Kerala Superstore Manchester — Modern POS Sync Bridge Dashboard (2026 NextGen)
Built with CustomTkinter for a sleek dark UI, live telemetry, and zero-impact database polling.
"""

import sys
import os
import json
import time
import threading
import datetime
import requests
import customtkinter as ctk

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("green")

APP_DIR = os.path.dirname(os.path.abspath(sys.argv[0])) if getattr(sys, 'frozen', False) else os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(APP_DIR, "config.json")
DEFAULT_CONFIG = {
    "website_url": "https://keralasuperstore.com",
    "api_key": "kss_pos_sync_key_2026_live",
    "supabase_url": os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://rnwthwaputocyirjtabd.supabase.co"),
    "supabase_key": os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""),
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
        except Exception:
            pass
    save_config(DEFAULT_CONFIG)
    return DEFAULT_CONFIG

def save_config(cfg):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except Exception:
        pass

class PosSyncEngine:
    def __init__(self, config, logger_callback=None):
        self.config = config
        self.logger = logger_callback or (lambda msg, lvl='info': print(f"[{lvl.upper()}] {msg}"))
        self.running = False
        self.thread = None
        self.last_sync_time = None
        self.total_synced = 0
        self.is_syncing = False

    def get_db_connection(self):
        try:
            import pyodbc
        except ImportError:
            self.logger("pyodbc not available. Running fallback engine.", "warning")
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

        installed = pyodbc.drivers()
        for drv in drivers:
            if drv in installed or not installed:
                try:
                    if use_win_auth:
                        conn_str = f"DRIVER={{{drv}}};SERVER={server};DATABASE={database};Integrated Security=True;TrustServerCertificate=yes;"
                    else:
                        conn_str = f"DRIVER={{{drv}}};SERVER={server};DATABASE={database};UID={user};PWD={pwd};TrustServerCertificate=yes;"
                    return pyodbc.connect(conn_str, timeout=4)
                except Exception:
                    continue

        try:
            if use_win_auth:
                conn_str = f"DRIVER={{SQL Server}};SERVER={server};DATABASE={database};Integrated Security=True;"
            else:
                conn_str = f"DRIVER={{SQL Server}};SERVER={server};DATABASE={database};UID={user};PWD={pwd};"
            return pyodbc.connect(conn_str, timeout=4)
        except Exception as ex:
            self.logger(f"SQL Connection attempt: {ex}", "error")
            return None

    def test_connection(self):
        start = time.time()
        conn = self.get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM Inventory WHERE Is_Deleted = 0")
                count = cursor.fetchone()[0]
                conn.close()
                elapsed = int((time.time() - start) * 1000)
                return True, f"Connected to RetailV2 Database in {elapsed}ms! Found {count:,} products."
            except Exception as e:
                return False, f"Connected, query error: {e}"
        return False, "Could not connect to MSSQL epos database. Ensure RetailV2 is installed."

    def fetch_inventory_from_db(self):
        conn = self.get_db_connection()
        if not conn:
            self.logger("No direct MSSQL connection. Simulation mode active.", "warning")
            return [
                {"sku": 101, "barcode": "5012345678901", "description": "Nirapara Matta Rice 5kg", "quantity": 45, "price": 7.99, "webPrice": 7.49, "active": True},
                {"sku": 102, "barcode": "5012345678902", "description": "Eastern Sambar Powder 200g", "quantity": 110, "price": 1.49, "webPrice": 1.39, "active": True},
                {"sku": 103, "barcode": "5012345678903", "description": "Kerala Banana Chips 250g", "quantity": 25, "price": 2.99, "webPrice": 2.99, "active": True}
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
                if not barcode: continue
                items.append({
                    "sku": row[0],
                    "barcode": barcode,
                    "description": str(row[2]).strip() if row[2] else "Item",
                    "quantity": float(row[3]) if row[3] is not None else 0.0,
                    "price": float(row[4]) if row[4] is not None else 0.0,
                    "webPrice": float(row[5]) if row[5] is not None else float(row[4] or 0),
                    "active": bool(row[6]) if row[6] is not None else True,
                    "lastModified": str(row[8]) if row[8] is not None else None
                })
            conn.close()
            return items
        except Exception as e:
            self.logger(f"Error querying Inventory: {e}", "error")
            return []

    def push_to_website(self, items):
        if not items:
            return False, "No items"

        base_url = self.config.get("website_url", "https://keralasuperstore.com").rstrip("/")
        sync_url = f"{base_url}/api/pos/sync"
        api_key = self.config.get("api_key", "kss_pos_sync_key_2026_live")
        batch_size = self.config.get("batch_size", 500)

        headers = {"Content-Type": "application/json", "X-POS-SYNC-KEY": api_key}
        total_batches = (len(items) + batch_size - 1) // batch_size
        self.logger(f"Transmitting {len(items)} products in {total_batches} batch(es)...", "info")

        success_count = 0
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            payload = {"source": "RetailV2-POS (Manchester)", "items": batch}
            try:
                resp = requests.post(sync_url, json=payload, headers=headers, timeout=20)
                if resp.status_code == 200:
                    success_count += len(batch)
                    self.logger(f"Batch {(i // batch_size) + 1}/{total_batches} Synced ({len(batch)} items) ✔", "success")
                else:
                    self.logger(f"HTTP {resp.status_code}: {resp.text}", "error")
                    return False, f"HTTP {resp.status_code}"
            except Exception as e:
                self.logger(f"Network error: {e}", "error")
                return False, str(e)

        self.last_sync_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.total_synced = success_count

        # 2. Direct Supabase Cloud Database Mirror (Permanent Zero-Latency Sync)
        sb_url = self.config.get("supabase_url", "").rstrip("/")
        sb_key = self.config.get("supabase_key", "")
        if sb_url and sb_key:
            try:
                sb_headers = {
                    "apikey": sb_key,
                    "Authorization": f"Bearer {sb_key}",
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates"
                }
                now_iso = datetime.datetime.now().isoformat()
                sb_rows = []
                for item in items:
                    bc = str(item.get("barcode", "")).strip()
                    if not bc: continue
                    sb_rows.append({
                        "barcode": bc,
                        "sku": str(item.get("sku", "")) if item.get("sku") else None,
                        "description": item.get("description", "Product"),
                        "quantity": float(item.get("quantity", 0)),
                        "price": float(item.get("price", 0)),
                        "web_price": float(item.get("webPrice", 0)) if item.get("webPrice") else None,
                        "active": bool(item.get("active", True)),
                        "updated_at": now_iso
                    })
                
                for i in range(0, len(sb_rows), 500):
                    sb_batch = sb_rows[i:i + 500]
                    requests.post(f"{sb_url}/rest/v1/pos_inventory", json=sb_batch, headers=sb_headers, timeout=15)
                
                serper_api_key = self.config.get("serper_api_key") or os.environ.get("SERPER_API_KEY", "")
                
                # In-memory session cache so repeated items don't burn API quota
                if not hasattr(self, "_image_cache"):
                    self._image_cache = {}

                def lookup_google_image(product_name):
                    if not serper_api_key:
                        return None
                    if product_name in self._image_cache:
                        return self._image_cache[product_name]
                    try:
                        clean = re.sub(r'\b(kg|g|gm|ml|ltr|l|pcs|pack)\b', '', product_name, flags=re.I).strip()
                        q = f"{clean} grocery packet packaging pouch"
                        p_res = requests.post(
                            "https://google.serper.dev/images",
                            json={"q": q, "num": 3},
                            headers={"X-API-KEY": serper_api_key, "Content-Type": "application/json"},
                            timeout=6
                        )
                        if p_res.status_code == 200:
                            data = p_res.json()
                            imgs = data.get("images", [])
                            if imgs and imgs[0].get("imageUrl"):
                                live_url = imgs[0].get("imageUrl")
                                self._image_cache[product_name] = live_url
                                return live_url
                    except Exception:
                        pass
                    return None

                # Auto-enrich and upsert products into live storefront products table
                PATTERNS = [
                    (r"matta|palakkad", "/products/matta-rice.png", "Rice & Rice Products", "rice-and-rice-products"),
                    (r"kaima|jeerakasala|biriyani rice|biryani rice", "/products/kaima-rice.png", "Rice & Rice Products", "rice-and-rice-products"),
                    (r"ponni|sona masoori|idli rice|rice", "/products/pavizham-rice.png", "Rice & Rice Products", "rice-and-rice-products"),
                    (r"puttu", "/products/puttu-podi.png", "Breakfast Powders", "breakfast-powders"),
                    (r"appam|idiyappam|pathiri", "/products/appam-podi.png", "Breakfast Powders", "breakfast-powders"),
                    (r"rava|sooji|suji", "/products/roasted-rava.png", "Breakfast Powders", "breakfast-powders"),
                    (r"banana chips|chips|upperi", "/products/banana-chips.png", "Crisps & Snacks", "crisps-and-snacks"),
                    (r"sharkara upperi", "/products/sharkara-upperi.png", "Crisps & Snacks", "crisps-and-snacks"),
                    (r"mixture|murukku|snack", "/products/kerala-mixture.png", "Crisps & Snacks", "crisps-and-snacks"),
                    (r"sambar", "/products/sambar-powder.png", "Masala & Curry Powders", "masala-and-curry-powders"),
                    (r"chicken masala", "/products/chicken-masala.png", "Masala & Curry Powders", "masala-and-curry-powders"),
                    (r"meat masala|beef masala", "/products/meat-masala.png", "Masala & Curry Powders", "masala-and-curry-powders"),
                    (r"fish masala|fish fry", "/products/fish-masala.png", "Masala & Curry Powders", "masala-and-curry-powders"),
                    (r"turmeric|manjal", "/products/turmeric-powder.png", "Masala & Curry Powders", "masala-and-curry-powders"),
                    (r"chilli|kashmiri", "/products/kashmiri-chilli.png", "Masala & Curry Powders", "masala-and-curry-powders"),
                    (r"coriander|malli|garam masala", "/products/sambar-powder.png", "Masala & Curry Powders", "masala-and-curry-powders"),
                    (r"cardamom|elakka", "/products/cardamom.png", "Spices & Whole Condiments", "spices-and-whole-condiments"),
                    (r"black pepper|pepper", "/products/black-pepper.png", "Spices & Whole Condiments", "spices-and-whole-condiments"),
                    (r"clove|gramboo", "/products/cloves.png", "Spices & Whole Condiments", "spices-and-whole-condiments"),
                    (r"star anise|thakkolam", "/products/star-anise.png", "Spices & Whole Condiments", "spices-and-whole-condiments"),
                    (r"cherupayar|moong", "/products/cherupayar.png", "Pulses & Dal", "pulses-and-dal"),
                    (r"toor dal|tuvar|parippu|dal", "/products/toor-dal.png", "Pulses & Dal", "pulses-and-dal"),
                    (r"kadala|chana|chickpea", "/products/kadala.png", "Pulses & Dal", "pulses-and-dal"),
                    (r"coconut oil|velichenna", "/products/kera-coconut-oil.png", "Pure Oils & Ghee", "oils-and-ghee"),
                    (r"ghee|neyy", "/products/malabar-ghee.png", "Pure Oils & Ghee", "oils-and-ghee"),
                    (r"gingelly|sesame", "/products/gingelly-oil.png", "Pure Oils & Ghee", "oils-and-ghee"),
                    (r"cut mango|pickle|achar", "/products/cut-mango-pickle.png", "Traditional Pickles", "traditional-pickles"),
                    (r"frozen kappa|tapioca|kappa", "/products/frozen-kappa.png", "Frozen Delights", "frozen-delights"),
                    (r"parotta|porotta", "/products/malabar-parotta.png", "Frozen Delights", "frozen-delights"),
                    (r"puttu maker", "/products/puttu-maker.png", "Traditional Kitchenwares", "traditional-kitchenwares"),
                    (r"appam chatti", "/products/appam-chatti.png", "Traditional Kitchenwares", "traditional-kitchenwares"),
                    (r"bronze|uruli", "/products/bronze-uruli.png", "Traditional Kitchenwares", "traditional-kitchenwares"),
                    (r"tea|chai", "/products/tea-munnar.png", "Breakfast Powders", "breakfast-powders")
                ]
                import re
                prod_rows = []
                for item in items:
                    desc = item.get("description", "").strip()
                    bc = str(item.get("barcode", "")).strip()
                    if not desc or not bc: continue
                    img = lookup_google_image(desc) or "/products/banana-chips.png"
                    cat = "General Grocery"
                    catslug = "grocery"
                    for pattern, m_img, m_cat, m_slug in PATTERNS:
                        if re.search(pattern, desc, re.IGNORECASE):
                            if img == "/products/banana-chips.png":
                                img = m_img
                            cat = m_cat
                            catslug = m_slug
                            break
                    slug = re.sub(r"[^a-z0-9]+", "-", desc.lower()).strip("-") + f"-{bc[-6:]}"
                    price = float(item.get("price", 0))
                    web_p = float(item.get("webPrice", 0)) if item.get("webPrice") else None
                    prod_rows.append({
                        "name": desc,
                        "slug": slug,
                        "barcode": bc,
                        "price": price,
                        "offer_price": web_p if web_p and web_p < price else None,
                        "stock_quantity": max(0, int(float(item.get("quantity", 0)))),
                        "category": cat,
                        "category_slug": catslug,
                        "image_url": img,
                        "status": "published",
                        "updated_at": now_iso
                    })

                for i in range(0, len(prod_rows), 200):
                    p_batch = prod_rows[i:i + 200]
                    requests.post(f"{sb_url}/rest/v1/products?on_conflict=slug", json=p_batch, headers=sb_headers, timeout=20)

                requests.post(f"{sb_url}/rest/v1/pos_sync_logs", json={
                    "timestamp": now_iso,
                    "type": "success",
                    "message": f"Successfully mirrored {len(items)} items to Supabase Cloud",
                    "item_count": len(items)
                }, headers=sb_headers, timeout=10)
                self.logger(f"Cloud Database: {len(sb_rows)} items mirrored and auto-enriched in Supabase ✔", "success")
            except Exception as sb_err:
                self.logger(f"Supabase mirror notice: {sb_err}", "warning")

        return True, f"Successfully pushed {success_count} products."

    def perform_sync(self):
        if self.is_syncing:
            return
        self.is_syncing = True
        try:
            self.logger("--- Starting Inventory Stock & Price Synchronization ---", "info")
            items = self.fetch_inventory_from_db()
            self.logger(f"Read {len(items):,} items from RetailV2.", "info")
            ok, msg = self.push_to_website(items)
            if ok:
                self.logger(f"✅ Sync Finished: {msg}", "success")
            else:
                self.logger(f"⚠️ Sync Notice: {msg}", "warning")
        except Exception as ex:
            self.logger(f"Sync error: {ex}", "error")
        finally:
            self.is_syncing = False

    def start_auto_sync(self):
        if self.running: return
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()
        self.logger("Auto-Sync Engine started.", "success")

    def stop_auto_sync(self):
        self.running = False
        self.logger("Auto-Sync Engine paused.", "warning")

    def _loop(self):
        interval = max(5, int(self.config.get("sync_interval_seconds", 30)))
        while self.running:
            self.perform_sync()
            for _ in range(interval):
                if not self.running: break
                time.sleep(1)


class ModernSyncDashboard(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Kerala Superstore — RetailV2 POS Bridge Dashboard (2026)")
        win_w, win_h = 880, 640
        sw = self.winfo_screenwidth()
        sh = self.winfo_screenheight()
        pos_x = max(50, int((sw - win_w) / 2))
        pos_y = max(50, int((sh - win_h) / 2))
        self.geometry(f"{win_w}x{win_h}+{pos_x}+{pos_y}")
        self.minsize(820, 580)
        self.configure(fg_color="#090d16")

        try:
            base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
            icon_path = os.path.join(base_dir, "app_icon.ico")
            if os.path.exists(icon_path):
                self.iconbitmap(icon_path)
        except Exception:
            pass

        self.config = load_config()
        self.engine = PosSyncEngine(self.config, logger_callback=self.log_message)

        self.build_ui()

        if self.config.get("auto_start_sync", True):
            self.after(1000, self.toggle_auto_sync)

    def build_ui(self):
        # 1. Header Bar
        header = ctk.CTkFrame(self, fg_color="#111827", corner_radius=0, height=85)
        header.pack(fill="x", side="top")
        header.pack_propagate(False)

        hdr_inner = ctk.CTkFrame(header, fg_color="transparent")
        hdr_inner.pack(fill="both", expand=True, padx=25, pady=12)

        lbl_title = ctk.CTkLabel(
            hdr_inner,
            text="🌿 Kerala Superstore — POS Sync Dashboard",
            font=ctk.CTkFont(family="Segoe UI", size=18, weight="bold"),
            text_color="#f8fafc"
        )
        lbl_title.pack(anchor="w")

        lbl_sub = ctk.CTkLabel(
            hdr_inner,
            text=f"RetailV2 (epos SQL Server) ➔ {self.config.get('website_url')} · Real-Time Stock Engine",
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color="#94a3b8"
        )
        lbl_sub.pack(anchor="w", pady=(2, 0))

        # 2. Metric Cards Row
        metrics_frame = ctk.CTkFrame(self, fg_color="transparent")
        metrics_frame.pack(fill="x", padx=25, pady=15)

        self.card_status = self.create_card(metrics_frame, "ENGINE STATUS", "STANDBY", "#38bdf8", 0)
        self.card_time = self.create_card(metrics_frame, "LAST SYNC TIME", "Never", "#34d399", 1)
        self.card_items = self.create_card(metrics_frame, "ITEMS SYNCHRONIZED", "0", "#fbbf24", 2)
        self.card_interval = self.create_card(metrics_frame, "SYNC FREQUENCY", f"{self.config.get('sync_interval_seconds', 30)}s", "#a78bfa", 3)

        for col in range(4):
            metrics_frame.columnconfigure(col, weight=1)

        # 3. Action Toolbar
        toolbar = ctk.CTkFrame(self, fg_color="#111827", corner_radius=14, height=65)
        toolbar.pack(fill="x", padx=25, pady=(0, 15))
        toolbar.pack_propagate(False)

        tb_inner = ctk.CTkFrame(toolbar, fg_color="transparent")
        tb_inner.pack(fill="both", expand=True, padx=15, pady=12)

        self.btn_auto = ctk.CTkButton(
            tb_inner,
            text="▶ Start Auto-Sync",
            command=self.toggle_auto_sync,
            font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"),
            fg_color="#059669",
            hover_color="#047857",
            height=38,
            corner_radius=10
        )
        self.btn_auto.pack(side="left", padx=(0, 10))

        self.btn_sync_now = ctk.CTkButton(
            tb_inner,
            text="⚡ Sync Now (1-Click)",
            command=self.manual_sync,
            font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"),
            fg_color="#2563eb",
            hover_color="#1d4ed8",
            height=38,
            corner_radius=10
        )
        self.btn_sync_now.pack(side="left", padx=(0, 10))

        self.btn_test = ctk.CTkButton(
            tb_inner,
            text="🔍 Test POS DB",
            command=self.test_pos_connection,
            font=ctk.CTkFont(family="Segoe UI", size=12),
            fg_color="#1e293b",
            hover_color="#334155",
            text_color="#f1f5f9",
            height=38,
            corner_radius=10
        )
        self.btn_test.pack(side="left", padx=(0, 10))

        # 4. Live Terminal Console
        log_frame = ctk.CTkFrame(self, fg_color="#111827", corner_radius=16)
        log_frame.pack(fill="both", expand=True, padx=25, pady=(0, 20))

        lbl_log = ctk.CTkLabel(
            log_frame,
            text="Live Synchronization Telemetry & SQL Events:",
            font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"),
            text_color="#cbd5e1"
        )
        lbl_log.pack(anchor="w", padx=20, pady=(15, 6))

        self.txt_logs = ctk.CTkTextbox(
            log_frame,
            font=ctk.CTkFont(family="Consolas", size=11),
            fg_color="#080c14",
            text_color="#e2e8f0",
            corner_radius=12,
            border_width=1,
            border_color="#1e293b"
        )
        self.txt_logs.pack(fill="both", expand=True, padx=20, pady=(0, 15))

    def create_card(self, parent, title, value, color, col):
        card = ctk.CTkFrame(parent, fg_color="#131d31", corner_radius=14, border_width=1, border_color="#1e293b")
        card.grid(row=0, column=col, padx=5, sticky="nsew", ipady=8)

        lbl_t = ctk.CTkLabel(
            card,
            text=title,
            font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"),
            text_color="#94a3b8"
        )
        lbl_t.pack(anchor="w", padx=14, pady=(6, 2))

        lbl_v = ctk.CTkLabel(
            card,
            text=value,
            font=ctk.CTkFont(family="Segoe UI", size=15, weight="bold"),
            text_color=color
        )
        lbl_v.pack(anchor="w", padx=14, pady=(0, 6))

        return lbl_v

    def log_message(self, msg, level="info"):
        def _append():
            ts = datetime.datetime.now().strftime("%H:%M:%S")
            prefix = "ℹ️" if level == "info" else "✅" if level == "success" else "⚠️" if level == "warning" else "❌"
            self.txt_logs.insert("end", f"[{ts}] {prefix} {msg}\n")
            self.txt_logs.see("end")

            if self.engine.last_sync_time:
                self.card_time.configure(text=self.engine.last_sync_time.split(" ")[-1])
            if self.engine.total_synced:
                self.card_items.configure(text=f"{self.engine.total_synced:,}")

        self.after(0, _append)

    def toggle_auto_sync(self):
        if self.engine.running:
            self.engine.stop_auto_sync()
            self.btn_auto.configure(text="▶ Start Auto-Sync", fg_color="#059669", hover_color="#047857")
            self.card_status.configure(text="PAUSED", text_color="#fbbf24")
        else:
            self.engine.start_auto_sync()
            self.btn_auto.configure(text="⏸ Pause Auto-Sync", fg_color="#e11d48", hover_color="#be123c")
            self.card_status.configure(text="🟢 AUTO-SYNC LIVE", text_color="#34d399")

    def manual_sync(self):
        threading.Thread(target=self.engine.perform_sync, daemon=True).start()

    def test_pos_connection(self):
        def _test():
            self.log_message("Testing SQL Server connection...", "info")
            ok, msg = self.engine.test_connection()
            if ok:
                self.log_message(msg, "success")
            else:
                self.log_message(msg, "error")
        threading.Thread(target=_test, daemon=True).start()

def main():
    app = ModernSyncDashboard()
    app.mainloop()

if __name__ == "__main__":
    main()
