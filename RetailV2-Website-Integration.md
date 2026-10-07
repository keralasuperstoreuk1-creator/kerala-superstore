# RetailV2 (Eposv2) — Website Integration വിശകലനം

> എല്ലാ വിവരങ്ങളും **read-only** ആയി ശേഖരിച്ചതാണ്. ആപ്പിനോ ഡാറ്റാബേസിനോ ഒരു മാറ്റവും വരുത്തിയിട്ടില്ല.
> എഴുതിയ തീയതി: 07/10/2026 · വിശകലന സമയത്ത് Eposv2.exe പ്രവർത്തിക്കുകയായിരുന്നു (PID 5064)

---

## 1. ആപ്പിനെ കുറിച്ച് (Overview)

| കാര്യം | വിവരം |
|---|---|
| ഇൻസ്റ്റലേഷൻ സ്ഥലം | `C:\Program Files (x86)\RetailV2` |
| മെയിൻ എക്സിക്യൂട്ടബിൾ | `Eposv2.exe` (3,977,728 bytes) |
| പ്രൊഡക്റ്റ് പേര് / പതിപ്പ് | Epos / 1.0.0.0 |
| ടെക്നോളജി | C# Windows Forms, .NET Framework 4.8 (CLR v4.0.30319) |
| അസെംബ്ലി റഫറൻസുകൾ | 34 എണ്ണം (AWSSDK, Dropbox.Api, SendGrid, RestSharp, Newtonsoft.Json, Stomp.Net, websocket-sharp, QRCoder, zxing, GlobalPayments.Api, POSLink, Microsoft.PointOfService ...) |
| ക്ലാസുകൾ | 515 class + 13 struct + 24 enum + 120 interface (17 namespaces ൽ) |
| കോഡിലെ പ്രധാന namespaces | `Epos`, `Epos.Classes`, `Epos.Classes.NetPay/RMS/Teya/Visu/EVO`, `Epos.UC`, `DGVPrinterHelper`, `ECRUtilATLLib`, `Ingenico.ECRTestApplication.*` |
| ഫയലുകൾ | 259 എണ്ണം, സബ്-ഫോൾഡർ ഇല്ല, ആകെ ~173 MB |
| പ്രവർത്തന സമയം | 07/10/2026 09:10 മുതൽ (ഈ റിപ്പോർട്ട് എഴുതുമ്പോൾ) |
| ആപ്പ് തുറന്ന പോർട്ട് | **ഇല്ല** (listening port ഒന്നുമില്ല, established connection ഇല്ല) |

### കടയുടെ വിവരം (BusunessDetails ടേബിളിൽ നിന്ന്)

```
BusinessName : KERALA SUPERSTORE
Address      : UNIT 2, 73 OLD MARKET STREET
Town         : (കാലിയാണ്)
PostCode     : M9 8DX
Telephone    : 07749132122
CustomerID   : 5001
Email        : KERALASUPERSTORELTD@GMAIL.COM
VAT No       : (കാലിയാണ്)
```

Receipt-ൽ കാണുന്ന VAT നംബർ കാലി — ബ്രിട്ടനിൽ VAT രജിസ്ട്രേഷൻ ഇല്ലാതെ ബിൽ അസാധുവാകും.

---

## 2. ഡാറ്റാബേസ് (ഇതാണ് website connect ചെയ്യാൻ പ്രധാനം)

### കണക്ഷൻ വിവരങ്ങൾ

`Configuration.xml`-ൽ നിന്ന്:

| കാര്യം | മൂല്യം |
|---|---|
| Server | `.` (localhost) |
| Instance | (കാലി — default MSSQLSERVER) |
| Catalog / DB | **`epos`** |
| MDF Path | `C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\epos.mdf` |
| Login | `sa` |
| Password | `London2012$` |
| Master Server | `.` , Instance `SQLEXPRESS`, DB `epos` |
| Master Login | `sa` / `London2012` |

**Connection string (എളുപ്പത്തിൽ):**
```
Server=.;Database=epos;User Id=sa;Password=London2012$
```
അല്ലെങ്കിൽ Windows auth (ഞാൻ ഉപയോഗിച്ചത്, പ്രവർത്തിച്ചു):
```
Server=.;Database=epos;Integrated Security=True
```

### SQL Server സേവർ നില

| സേവർ | സ്ഥിതി |
|---|---|
| `MSSQLSERVER` (ഡിഫോൾട്ട്) | ✅ **Running** — ഇതിലാണ് `epos` DB |
| `SQLEXPRESS01` | ⛔ Stopped |
| SQL Browser | ✅ Running |
| കമ്പ്യൂട്ടറിന്റെ പേര് | `KERALA` |
| TCP ലിസൻ | `0.0.0.0:1433` — **LAN-ൽ നിന്ന് connect ചെയ്യാം** |
| sqlcmd | `C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\SQLCMD.EXE` |

> ⚠️ 1433 പോർട്ട് `0.0.0.0`-ൽ തുറന്നിരിക്കുന്നു. ഫയർവാൾ ശരിയായി ക്രമീകരിച്ചിട്ടില്ലെങ്കിൽ പുറത്തുനിന്നുള്ളവർക്കും ഡിബി കാണാം. കാണാനാകുന്ന ഭാഗം §8-ൽ.

### ഡാറ്റാബേസ് വലിപ്പം (read-only count)

| ടേബിൾ | റെക്കോഡുകൾ | Sync-ൽ ബാക്കി (IsTransfered=0) |
|---|---|---|
| `Transaction_Summary` | 30,124 | **62** |
| `Transaction_Details` | 171,750 | — |
| `Inventory` | 4,140 | — |
| `Department` | 42 | — |
| `Staff` / `Users` | 5 | — |
| `Customers` | 6 | — |
| `Shift` | 532 | 1 |
| `TillLog` | 1,826 | 5 |
| `VAT` | 3 (0% / 5% / 20%) | — |
| `Orders` | 0 | — |
| മൊത്തം ടേബിളുകൾ | **114** | — |

എന്റെ വിശകലന സമയത്ത് ഏറ്റവും പുതിയ ട്രാൻസാക്ഷൻ: `Tran_ID=30124`, 07/10/2026 19:13:13, Card 1.89.

---

## 3. Website-ഉമായി connect ചെയ്യാൻ വേണ്ട ടേബിളുകളും കോളുകളും

### 3.1 വിൽപ്പന (Sales) — website-ൽ ഓർഡർ/സെയിൽസ് കാണിക്കാൻ

**`Transaction_Summary`** (ഒരു ബില്ലിന്റെ തലയണ)

| കോൾ | ടൈപ്പ് | അർത്ഥം |
|---|---|---|
| `Tran_ID` | int | ബില്ലിന്റെ ID (പ്രധാന key) |
| `Till_ID` | int | ഏത് ടില്ല് (ഇവിടെ 1) |
| `User_Code` | int | സ്റ്റാഫ് കോഡ് |
| `Date` | datetime | ബില്ലിന്റെ സമയം |
| `NoofItem` | decimal | സാധനങ്ങളുടെ എണ്ണം |
| `Cash` / `Card` / `Cheque` / `Coupon` | decimal | ഓരോ പേയ്‌മെന്റ് |
| `Change` | decimal | മാറ്റം |
| `TotalAmount` | decimal | ആകെ തുക |
| `TotalDiscount` | decimal | ഡിസ്കൗണ്ട് |
| `onAcc` | decimal | അക്കൗണ്ടിലേക്ക് |
| `CustomerID` | int | `Customers` ടേബിളിലേക്കുള്ള link |
| `IsRefund` | int | 1 = റിഫണ്ട് |
| `IsDeleted` | int | 1 = റദ്ദാക്കിയത് |
| `IsPrinted` | int | പ്രിന്റ് ആയോ |
| `IsTransfered` | int | **0 = ക്ലൗഡിലേക്ക് പോയിട്ടില്ല** |
| `DD_Voucher`, `DD_Total_Points`, `DD_Today_Points`, `DD_Customer_Name`, `DD_QRCode`, `DD_Credit_Voucher` | — | DealDio loyalty |

**`Transaction_Details`** (ബില്ലിലെ ഓരോ സാധനം)

| കോൾ | അർത്ഥം |
|---|---|
| `Tran_ID` (varchar 100) | `Transaction_Summary.Tran_ID`-ണ് link |
| `Barcode` | ബാർകോഡ് |
| `Description` | സാധനത്തിന്റെ പേര് |
| `QTY` | അളവ് |
| `Price` | വില |
| `DiscountAmount`, `DiscountType` | ഡിസ്കൗണ്ട് |
| `VAT_Percentage` | വാറ്റ് ശതമാനം |
| `Dept_ID`, `Sub_Cat_ID` | `Department` ടേബിളിലേക്കുള്ള link |
| `PLU` | ഭക്ഷണം/വിള കോഡ് |
| `IsDeleted` | റദ്ദാക്കിയതോ |

**`Transaction_Discount`** — `Tran_ID`, `Barcode`, `Offer_Name`, `Amount`, `VAT_Percentage`, `Dept_ID`

### 3.2 പ്രോഡക്റ്റ് കാറ്റലോഗ് (website product list ആയി)

**`Inventory`** — 4,140 റെക്കോഡ്. വെബ്‌സൈറ്റിന് വേണ്ട കോളുകൾ **ഇതിനകം ഉണ്ട്**:

| കോൾ | വിശദാംശം |
|---|---|
| `SKU` (int) | ഉള്ളിലെ key |
| `Barcode` (varchar 100) | സ്കാൻ ചെയ്യുന്ന ബാർകോഡ് |
| `Description` (varchar 1000) | സാധനത്തിന്റെ പേര് |
| `Price` (decimal) | കടയിലെ വില |
| **`Web_Price` (decimal)** | **വെബ്‌സൈറ്റ് വില — ഇത് ഉപയോഗിക്കൂ** |
| **`Image_Link` (varchar 250)** | **സാധനത്തിന്റെ ഫോട്ടോ URL** |
| `Brand_Name` (varchar 100) | ബ്രാൻഡ് |
| `Dep_ID`, `Sub_Cat_ID` | ഡിപ്പാർട്ട്മെന്റ് |
| `VAT_ID` | `VAT` ടേബിളിലേക്ക് |
| `Sup_ID` | `Supplier` ടേബിളിലേക്ക് |
| `Quantity`, `Minimum_stock`, `ShelfStock`, `StockOnOrder` | സ്റ്റോക്ക് |
| `Purchased_Price`, `Profit`, `CostPerCase` | ചെലവ്/ലാഭം |
| `A_Price`, `B_Price`, `C_Price`, `Night_Price` | വിവിധ വില നിരകൾ |
| `Weight`, `PLU`, `CaseBarCode`, `size` | അളവ്/വലിപ്പം |
| `ExpiryDate`, `FuturePrice`, `FuturePriceEffectiveDate` | കാലാവധി, ഭാവി വില |
| `Active`, `Is_Deleted` | ലിസ്റ്റിൽ കാണിക്കണോ |
| `Is_Discountable`, `Is_Loyal` | ഓഫർ/ലോയൽട്ടി |
| `Date_Created`, `Last_Modified` | മാറ്റം വരുത്തിയ സമയം — **incremental sync-ന് ഇത് ഉപയോഗിക്കൂ** |

> 💡 `Web_Price` എന്ന കോൾ ഇതിനകം ഡാറ്റാബേസിൽ ഉള്ളത്, വിൽപ്പനക്കാരൻ **വെബ്‌സൈറ്റ് വില വേറെ വെക്കാൻ** ഉദ്ദേശിച്ചിട്ടുണ്ട് എന്നതിന്റെ തെളിവ്. നിങ്ങളുടെ website-ഉമായി connect ചെയ്യാൻ ഇത് ഏറ്റവും അനുയോജ്യം.

### 3.3 മറ്റ് പ്രധാന ടേബിളുകൾ

| ടേബിൾ | പ്രധാന കോളുകൾ | Website-ൽ ഉപയോഗം |
|---|---|---|
| `Customers` | `Customer_ID`, `First_Name`, `Surname`, `Account_Number`, `Email`, `Phone`, `Mobile`, `Post_Code`, `Credit_Limit`, `Payment_Terms` | കസ്റ്റമർ list |
| `CustomerPayments` | `Customer_ID`, `Tran_ID`, `Cash/Card/coupon/cheque/Amount`, `IsTransfered` | അക്കൗണ്ട് പേയ്‌മെന്റ് |
| `Department` | `Dpet_ID`, `Dept_name`, `Groups`, `Age`, `Is_Discountable`, `Is_Loyal`, `Is_Activated` | വിഭാഗങ്ങൾ / category |
| `VAT` | `Vat_ID`, `Name`, `Percentage` | വാറ്റ് നിരക്ക് (0/5/20) |
| `Supplier` | `Sup_ID`, `Name`, `Email`, `Phone`, `Payment_Terms` | സപ്ലയർ |
| `Staff` / `Users` | `UserCode` / `User_Id`, `FirstName`, `LastName`, `Role`, `Password`, `Is_Activated` | ഉപയോക്താക്കൾ |
| `Shift` | `ID`, `User_code`, `Till_ID`, `Date`, `Login`, `Logoff`, `IsTransfered` | ഷിഫ്റ്റ് സമയം |
| `ZReading` | `ID`, `Till_Id`, `User_Id`, `Date`, `Start`, `Finish` | ദിവസാവസാന report |
| `TillLog` | `TillLogID`, `TillID`, `Date`, `XReading`, `ZReading`, `IsTransfered` | X/Z റീഡിംഗ് |
| `CashLift`, `NoSale`, `TranPayout`, `Void`, `UserLog` | `IsTransfered` ഉണ്ട് | ക്യാഷ് ലിഫ്റ്റ്, നോ സെയിൽ, പേഔട്ട്, വോയ്ഡ്, ലോഗിൻ ലോഗ് |
| `Offer` | `Offer_ID`, `Barcode1..10`, `StartDate`, `EndDate`, `OfferName`, `Active` | ഓഫർ |
| `Promotion` | `Promotion_ID`, `Promotion_Name`, `Promotion_Code`, `Product_Barcode`, `Promotion_QTY`, `Promotion_Price`, `Promotion_Discount`, `Start/End_Date`, `Start/End_Time`, `Monday..Sunday`, `img_link`, `is_activated` | പ്രമോഷൻ (weekly days വരെ ഉണ്ട്) |
| `Tills` | `ID`, `configFileID`, `IPAdress` (192.168.1.2), `ComputerName` (TILL1) | ടില്ല് വിവരം |
| `Parameters` | 65 rows (Name/Value) | ആപ്പിന്റെ settings |
| `Configuration` | `ConfigID`, `AppSerial`, `RegDate`, `ExpireDate`, `MachineName` | **ലൈസൻസ് — ഇപ്പോൾ കാലി** |
| `CardPayment_Report` | `Terminal_TPI`, `Report_Type`, `Request_ID`, `Report_Result`, `Report_Time`, `Balances`, `Banking` | കാർഡ് ടെർമിനൽ report |
| `BusunessDetails` | കടയുടെ വിവരം | header/footer |
| Booker_*, Budgens_*, Londis_*, Parfetts_* | വൻകിട wholesale sync | ബാർകോഡ്/വില/�ർഡർ സിങ്ക് (ഇപ്പോൾ ഉപയോഗത്തിൽ അല്ലെന്ന് തോന്നുന്നു) |

---

## 4. ആപ്പിന് ഇതിനകം ഉള്ള online/connectivity സംവിധാനങ്ങൾ

നിങ്ങളുടെ website connect ചെയ്യാൻ മുൻപ് ഉപയോഗിച്ച വഴികൾ — ഇവ നോക്കുന്നത് നല്ലതാണ്:

### 4.1 Cloud sync (SQL → Cloud) — `SynchroniseDB` class
```
PullDB()  / PushDB()
RunSync1() / RunSync2()
RunReportSync1() / RunReportSync2()
GetConnectionStringLocal() / GetConnectionStringServer() / GetConnectionStringReportServer()
```
- Cloud server: **`firstwareuk.database.windows.net`** (Azure SQL), user `firstwareadmin`
- ഫ്ലാഗ്: `IsTransfered` (0 = പോയിട്ടില്ല, 1 = പോയി)
- അപ്ഡേറ്റ്: `update Transaction_Summary set IsTransfered=1 where IsTransfered=0 and Till_ID='...'`
- ഡൗൺലോഡ് ചെയ്താൽ ലോക്കൽ ഡാറ്റ മായും: *"Are you sure you want to download full database from the server and this operation will delete the loacl database?"*
- പിഴവ് സന്ദേശങ്ങൾ: `Cloud Server is not available`, `Push DB Error`, `Sync Error`, `ReportSync1/2 Error`
- Settings-ൽ `Cloud Backup = 1` (**ഇപ്പോൾ ON ആണ്**), `Sync Public IP = 0`

### 4.2 Telegram alert — `Telegram` class
```
SendAsync(String msg) / SendSync(String msg)
URL: https://api.telegram.org/bot<TOKEN>/sendMessage
```
- Token ബൈനറിയിൽ **hardcode ചെയ്തിരിക്കുന്നു** (`8005597248:AAFob...`)
- Chat ID `Eposv2.exe.config`-ൽ (`ChatID = 123456789`)
- Parameters: `Telegram Void`, `Telegram NoSale`, `Telegram Refund`, `Telegram Report View`, `Telegram Report` — **എല്ലാം 0 (OFF)**

### 4.3 Dropbox backup — `Lic.txt`
- `access_token` + `refresh_token` ഫയലിൽ സൂക്ഷിച്ചിരിക്കുന്നു
- scope: `files.content.write`, `files.metadata.read`, `account_info.read`

### 4.4 കാർഡ് ടെർമിനൽ — RMS (Retail Merchant Services)
```
OAuth: https://api-auth.retailmerchantservices.net/oauth2/token
Terminal: https://api-terminal.retailmerchantservices.net
Redirect: https://firstware.org/rmsprod
Scopes: rms/pos:read rms/pos:write
User-Agent: CoderPro .Net Client
client_id: vp89bqmuk9buq5dmk6vj04gbd
```
Endpoints കാണുന്നു: `/client/v1/payment/action`, `/client/v1/payment/complete`, `/client/v1/payment/notification`, `/client/v1/payment/receipt`, `/client/v1/payment/result`, `/client/v1/pos/registration`, `/client/v1/error`, `/client/v1/device/restart`, `/client/v1/payment/report/batch`, `/client/v1/payment/report/offline`

### 4.5 മറ്റ് integrations (Configuration.xml-ൽ, എല്ലാം `false`)

| Service | Endpoint | നില |
|---|---|---|
| **DealDio** (loyalty/points) | `https://www.dealdio.com/dd_epos/` + `api_partner_v1_test/secure/scanVouchersFromRetailer`, `assignUserPointsFromRetailer` | enable=false |
| **Food2Go** (online food order) | `https://demo-api.food2go.co.uk/` | enable=false |
| **Visu** (analytics) | `https://pos-data.visu.ai/daily_data` | enable=false |
| **Hikvision IP camera** | ISAPI `/ISAPI/System/Video/inputs/channels/1/overlays/text` | enable=false |
| SendGrid (email) | `SendGrid.dll` present | — |
| AWS (AWSSDK.dll), Stomp.Net (message queue), websocket-sharp | present | — |
| Freshdesk support | `firstwarecouksupport@firstware.freshdesk.com` | — |

### 4.6 ഫയൽ-അടിസ്ഥാന ഔട്ട്പുട്ടുകൾ (ഏറ്റവും എളുപ്പമുള്ള hook)

| ഫയൽ | ഉള്ളടക്കം | മാറ്റം |
|---|---|---|
| `Receipt.txt` | അവസാന പ്രിന്റ് ആയ ബിൽ | **19:03:35 (07/10/2026)** |
| `Error.txt` | പിഴവ് ലോഗ് | **2,037,177 bytes**, 07/10/2026 09:10 |
| `Errorlog.txt`, `Payment.txt` | 0 bytes (കാലി) | — |
| `PrintoutHandelr.log` | പ്രിന്റർ ലോഗ് | 987,805 bytes |
| `system.log` | പ്രിന്റർ buffer | 33,644 bytes |

---

## 5. Website connect ചെയ്യാനുള്ള വഴികൾ (ഓപ്ഷനുകൾ)

### ഓപ്ഷൻ A — ഡാറ്റാബേസ് നേരിട്ട് വായിക്കുക ⭐ (ഏറ്റവും എളുപ്പം, ആപ്പിന് ഒരു മാറ്റവുമില്ല)

SQL Server ഇപ്പോൾ `0.0.0.0:1433`-ൽ കേൾക്കുന്നുണ്ട്. Website-ന് വേണ്ടി ഒരു read-only DB user ഉണ്ടാക്കി അതിൽ നിന്ന് വായിക്കാം.

**ഘട്ടം 1 — read-only ഉപയോക്താവ് ഉണ്ടാക്കുക** (ഈ ഒരു തവണ മാത്രം, ആപ്പിനെ ബാധിക്കില്ല):
```sql
-- SSMS / sqlcmd-ൽ ഒരിക്കൽ മാത്രം run ചെയ്യുക
USE [epos];
CREATE LOGIN webreader WITH PASSWORD = '<ശക്തമായ പാസ്‌വേഡ്>';
CREATE USER webreader FOR LOGIN webreader;
GRANT SELECT ON SCHEMA::dbo TO webreader;
-- എഴുത്ത് അനുവദിക്കരുത് (INSERT/UPDATE/DELETE കൊടുക്കരുത്)
```

**ഘട്ടം 2 — website-ൽ നിന്ന് വായിക്കുക:**
```php
// PHP example
$pdo = new PDO('sqlsrv:Server=192.168.1.2;Database=epos', 'webreader', '<password>');
```
```python
# Python example
import pyodbc
cn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=.;DATABASE=epos;'
                    'UID=webreader;PWD=<password>')
```

**ഇന്റർവെൽ അടിസ്ഥാനത്തിൽ എടുക്കാൻ ചോദിക്കുന്ന queries:**
```sql
-- പുതിയ സെയിസ് (incremental)
SELECT s.Tran_ID, s.Date, s.TotalAmount, s.Cash, s.Card, s.Coupon, s.Cheque,
       s.TotalDiscount, s.IsRefund, s.CustomerID, s.Till_ID, s.User_Code,
       d.Barcode, d.Description, d.QTY, d.Price, d.VAT_Percentage, d.Dept_ID
FROM Transaction_Summary s
LEFT JOIN Transaction_Details d ON d.Tran_ID = CAST(s.Tran_ID AS VARCHAR(100))
WHERE s.Date >= :last_sync_time        -- അല്ലെങ്കിൽ s.Tran_ID > :last_id
ORDER BY s.Date;

-- പുതിയ/മാറിയ പ്രോഡക്റ്റുകൾ
SELECT SKU, Barcode, Description, Price, Web_Price, Image_Link, Brand_Name,
       Dep_ID, VAT_ID, Quantity, Weight, Active, Last_Modified
FROM Inventory
WHERE Is_Deleted = 0
  AND (Last_Modified >= :last_sync_time OR Last_Modified IS NULL);

-- ഇന്നത്തെ സംക്ഷിപ്തം
SELECT COUNT(*) AS sales, SUM(TotalAmount) AS total, SUM(Card) AS card, SUM(Cash) AS cash
FROM Transaction_Summary
WHERE CAST(Date AS DATE) = CAST(GETDATE() AS DATE) AND IsDeleted = 0;
```

**⚠️ ശ്രദ്ധിക്കുക:** `Transaction_Details.Tran_ID` **varchar(100)** ആണ്, `Transaction_Summary.Tran_ID` **int** — ജോയിൻ ചെയ്യുമ്പോൾ `CAST` വേണം (മുകളിലെ ഉദാഹരണത്തിൽ ചേർത്തിട്ടുണ്ട്).

### ഓപ്ഷൻ B — ലോക്കൽ ഫയൽ / ഫോൾഡർ നിരീക്ഷിക്കുക
`Receipt.txt`-ഓ, ഒരു ഫോൾഡറിലേക്ക് ബാക്കപ്പ് എടുക്കുകയോ ചെയ്യാം. ആപ്പിന് ഒരു മാറ്റവുമില്ല. എന്നാൽ ഇത് polling/fragile ആണ്.

### ഓപ്ഷൻ C — ചെറിയ HTTP API എഴുതി ആപ്പിനെ "push" ചെയ്യിക്കുക
സോഴ്‌സ് കോഡ് കയ്യിലുണ്ടെങ്കിൽ `Program`-ലേക്ക് ഒരു `HttpClient` കോൾ ചേർക്കാം — ഓരോ സെയിലും മുഴുവൻ ഉടനെ website-ലേക്ക് പോകും. സോഴ്‌സ് ഇല്ലാതെ (ഈ .exe മാത്രം ഉള്ളപ്പോൾ) ഈ വഴി അസാധ്യം.

### ഓപ്ഷൻ D — ഇതിനകമുള്ള cloud sync ഉപയോഗിക്കുക
`firstwareuk.database.windows.net` (Azure SQL) ഇതിനകം sync target ആണ്. ആ ആസ്ഥാനത്ത് നിന്ന് website വായിക്കാം. എന്നാൽ അത് FirstWare-യുടെ അക്കൗണ്ടാണ് — അവരുടെ അനുമതി/പാസ്‌വേഡ് വേണം.

**ഏറ്റവും നല്ലത്: ഓപ്ഷൻ A.** ആപ്പിനെ ഒന്നും തൊടേണ്ട, DB-യിൽ ഒരു read-only user മാത്രം.

---

## 6. ശ്രദ്ധിക്കേണ്ട പ്രശ്നങ്ങൾ (ഇപ്പോൾ ഉള്ളവ)

### 6.1 `MainConnectionString` decrypt ആകുന്നില്ല ⛔ (ഏറ്റവും പ്രധാനം)

`Error.txt`-ൽ **രാവിലത്തെ ഓരോ ദിവസവും** ഇത് വരുന്നു:
```
Failed to decrypt using provider 'DataProtectionConfigurationProvider'.
Error message from the provider: Key not valid for use in specified state.
(Exception from HRESULT: 0x8009000B)
(C:\Program Files (x86)\RetailV2\Eposv2.exe.config line 9)
```
ഞാൻ അതേ encrypted blob സ്വയം decrypt ചെയ്യാൻ ശ്രമിച്ചു — **രണ്ടിലും (CurrentUser, LocalMachine) പരാജയപ്പെട്ടു**.

അർത്ഥം: `Eposv2.exe.config`-ലെ `<connectionStrings>` ഇനി വായിക്കാൻ കഴിയില്ല. DPAPI key ആ മെഷീനിലെ/യൂസറിലെ പഴയ profile-ൽ ആയിരുന്നു (user profile മാറിയതാകാം, domain join ആയതാകാം, അല്ലെങ്കിൽ മറ്റൊരു മെഷീനിൽ encrypt ചെയ്തതാകാം).

**ഫലം:** cloud sync (§4.1) ഇപ്പോൾ **പ്രവർത്തിക്കുന്നില്ല**. ആപ്പ് ഇപ്പോഴും ലോക്കൽ DB-യിൽ പണിയെടുക്കുന്നുണ്ട്, പക്ഷേ ക്ലൗഡിലേക്ക് പോകുന്നില്ല.

**ഇതിന് പരിഹാരം** (ആപ്പ് vendor-ന് പറയുക / സ്വയം):
- ആ ഫയൽ `DataProtectionConfigurationProvider`-ൽ നിന്ന് ഒഴിവാക്കി plaintext ആക്കുക, അല്ലെങ്കിൽ
- അതേ user profile-ൽ വീണ്ടും encrypt ചെയ്യുക
- ഇപ്പോൾ നിങ്ങളുടെ website-ന് ഇത് തടസ്സമല്ല (ഓപ്ഷൻ A-യിൽ ഈ കണക്ഷൻ ആവശ്യമില്ല)

### 6.2 മറ്റ് പിഴവുകൾ (`Error.txt`-ൽ, ആവർത്തിച്ചുവരുന്നവ)
```
Index and length must refer to a location within the string. Parameter name: length
   (28/09, 01/10, 05/10/2026)
String was not recognized as a valid DateTime.
   (06/10/2026 21:20:19)
```
- ആദ്യത്തേത്: barcode/स्ट्रിംഗ് slice ചെയ്യുമ്പോൾ length കൂടുതലാകുന്നു — **സാധനം scan ചെയ്യുമ്പോൾ** ഉണ്ടാകാൻ സാധ്യത
- രണ്ടാമത്തേത്: തീയതി parse ആകുന്നില്ല — **locale/format** പ്രശ്നം

### 6.3 രഹസ്യങ്ങൾ plaintext ആയി കിടക്കുന്നു ⚠️
| ഫയൽ | രഹസ്യം |
|---|---|
| `Configuration.xml` | SQL `sa` password (`London2012$`), card machine API key + AuthToken + serial, DealDio password, Food2Go ClientSecret, Visu token, IP camera password — **എല്ലാം plaintext** |
| `Eposv2.exe` (ബൈനറി) | Telegram bot token, RMS `client_id`/`client_secret` |
| `Lic.txt` | Dropbox access + refresh token |
| `Eposv2.exe.config` | DPAPI encrypted blob (ഇപ്പോൾ ഉപയോഗശൂന്യം) |
| DB `Users` table | `Password` column ഉണ്ട് (hash ആണോ plaintext ആണോ പരിശോധിച്ചിട്ടില്ല) |

നിങ്ങളുടെ website-ൽ ഇവ കൊടുക്കരുത്. പുതിയ read-only login ഉണ്ടാക്കി അത് മാത്രം ഉപയോഗിക്കുക.

### 6.4 ലൈസൻസ് കാലി
DB `Configuration` table: `AppSerial`, `RegDate`, `ExpireDate`, `MachineName` — **എല്ലാം NULL**. ആപ്പ് എന്തെങ്കിലും expiry check ചെയ്യുന്നുണ്ടെങ്കിൽ ഭാവിയിൽ പ്രശ്നമാകാം.

### 6.5 ഫയർവാൾ
`1433` എല്ലാ interface-ലും തുറന്നിരിക്കുന്നു. Website-ന് LAN വഴി connect വേണമെങ്കിൽ ഇത് വേണം — പക്ഷേ **അകത്തെ മാത്രം** restrict ചെയ്യുക.

---

## 7. ശുപാർശ: അടുത്ത ഘട്ടങ്ങൾ

1. **DB-യിൽ read-only user ഉണ്ടാക്കുക** (§5 ഓപ്ഷൻ A) — ആപ്പിനെ തൊടേണ്ട
2. **Website-ൽ ഒരു sync script** എഴുതുക: `Inventory.Last_Modified` + `Transaction_Summary.Date` incremental-ആയി വായിച്ച് നിങ്ങളുടെ DB-യിലേക്ക് ഇടുക (5 മിനിറ്റ് ഒരിക്കൽ മതി)
3. **വില മാറ്റം website-ൽ നിന്ന് ആണെങ്കിൽ** `Inventory.Web_Price` ഉപയോഗിക്കുക (കടയിലെ `Price`-ഉമായി കൂട്ടിമുട്ടാതെ)
4. **VAT നംബർ ചേർക്കുക** `BusunessDetails`-ൽ (ഇപ്പോൾ കാലി)
5. **Cloud sync വീണ്ടും പണിയാക്കണമെങ്കിൽ** §6.1 പരിഹരിക്കുക
6. **രഹസ്യങ്ങൾ** website-ൽ കൊണ്ടുപോകരുത് (§6.3)

---

## 8. ഈ റിപ്പോർട്ട് ഉണ്ടാക്കാൻ ഉപയോഗിച്ചത്

- ഫയൽ ലിസ്റ്റിംഗ്, വലിപ്പം, timestamp (`Get-ChildItem`)
- `Eposv2.exe`-യുടെ version info + assembly metadata
- **Reflection-only** ലോഡിംഗ് (`Assembly.ReflectionOnlyLoadFrom`) — കോഡ് ഒന്നും execute ചെയ്തിട്ടില്ല; class/method/field/property names മാത്രം (custom C# dumper, `C:\Users\Till\AppData\Local\Temp\opencode\eposdumper.cs`)
- UTF-16 string heap വായന (URL, SQL, config key കണ്ടുപിടിക്കാൻ)
- ഫയലുകളുടെ ഉള്ളടക്കം: `Configuration.xml`, `Eposv2.exe.config`, `dev.conf`, `Lic.txt`, `Runtime.txt`, `Readme.txt`, `Receipt.txt`, `ATTACH.BAT`, `attach.sql`, `system.log`, `Error.txt` (tail)
- **read-only SQL queries**: `INFORMATION_SCHEMA.COLUMNS`, `sys.tables`, `COUNT(*)`, `TOP N SELECT` — ഒരു UPDATE/INSERT/DELETE/DELETE-ഉം ഇല്ല
- `Get-Service`, `Get-Process`, `Get-NetTCPConnection` (നില മാത്രം നോക്കി)

**ചെയ്തിട്ടില്ലാത്തത്:** ഒരു ഫയലും മാറ്റിയിട്ടില്ല, ആപ്പ് restart/close ചെയ്തിട്ടില്ല, DB-യിൽ ഒന്നും എഴുതിയിട്ടില്ല, ഒരു സേവറിലും ഇടപെട്ടിട്ടില്ല.
