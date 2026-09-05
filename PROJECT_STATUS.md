# Muncheez V2 - Project Status & System Audit
**Last Updated:** May 9, 2026

---

## 1. Project Directory Analysis (Folder-by-Folder)
Below is the breakdown of the **Muncheez** project structure located in `C:\Users\ADMIN\Desktop\destop files\K`.

### Root Directory
| File/Folder | Purpose |
| :--- | :--- |
| `src/` | **Source Code.** Contains all the frontend logic, UI, and state management. |
| `supabase/` | **Backend Infrastructure.** SQL migrations and database schema definitions. |
| `public/` | **Static Assets.** Icons, images, and public manifests. |
| `dist/` | **Build Output.** The compiled code ready for production deployment. |
| `emailtemp/` | **Email Templates.** HTML/CSS templates for automated user notifications. |
| `.env` | **Environment Variables.** Contains the Supabase API URL and Service Keys. |
| `package.json` | **Project Blueprint.** Lists all dependencies and run commands. |
| `vite.config.ts` | **Build Configuration.** Settings for the Vite development environment. |

### `src/` Subfolders
| Folder | Purpose |
| :--- | :--- |
| `pages/` | **Views.** Separated into `customer`, `merchant`, `courier`, and `admin` silos. |
| `layouts/` | **Silo Containers.** Defines the "walls" between different user roles. |
| `components/` | **Reusable UI.** Buttons, Inputs, Navbars, and specific feature components. |
| `context/` | **Global State.** `AuthContext` (Auth state) and `MockDatabaseContext` (Prototypes). |
| `lib/` | **Third-party Clients.** Specifically the Supabase client initialization. |
| `types/` | **TypeScript Definitions.** The schema interfaces (Orders, Merchants, Riders). |
| `utils/` | **Helpers.** Formatting currency, dates, and common logic. |

---

## 2. Current Project Status
### Where we are now:
The system has transitioned from a **Mock Prototype** to a **Supabase-driven Application**. 

*   **Role Isolation:** Complete. A logged-in Courier cannot see the Merchant portal, and vice versa.
*   **Database Schema:** Live. All 13 tables (Profiles, Merchants, Riders, Orders, etc.) are deployed.
*   **Auth Flow:** Isolated. Login pages now verify the user's role before allowing access to a dashboard.
*   **Dashboard State:** Most dashboards are wired to real data, but currently sitting in an "Inactive/Pending Approval" state for new users.

### What we were trying to fix last:
1.  **Auth Routing Contamination:** Fixing the bug where the "Customer" navbar would show a "Merchant" name because of shared session cookies.
2.  **White Screen Crashes:** Resolving race conditions in `AuthContext` where the app tried to load the profile before the user session was ready.
3.  **Migration Completion:** Moving the final components (Checkout and Storefront) from the `MockDatabase` to the real Supabase `merchants` table.

---

## 3. Development Guide & Commands

### How to Run Muncheez
To launch the development server and see your app:
```powershell
npm run dev
```
> **URL:** `http://localhost:5173`

### How to Build for Production
```powershell
npm run build
```

### Essential File & System Commands
| Task | Command (PowerShell) |
| :--- | :--- |
| **List all files (Recursive)** | `dir -Recurse` |
| **Search for a file** | `dir -Filter "*filename*" -Recurse` |
| **Check dependencies** | `npm list --depth=0` |
| **Fix Code Linting** | `.\fix-all-errors.ps1` |
| **List project tree** | `tree /f` |

---

## 4. Key "Muncheez" Backend Details
*   **New Supabase URL:** `jjkieifzptlqujwbhgle.supabase.co`
*   **Active Tables:** `profiles`, `merchants`, `riders`, `orders`, `wallet_ledger`, `complaints`.
*   **Current Blocker:** Admin approval system needs to be triggered to "Activate" the merchant/rider dashboards so they can start processing orders.
