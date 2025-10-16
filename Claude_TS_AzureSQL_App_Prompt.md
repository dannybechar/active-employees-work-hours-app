# Prompt for Claude: TypeScript Azure SQL Application Builder

Build a **TypeScript** web application that connects to **Azure SQL** using this connection string and displays the results of the **ActiveEmployees_WorkHoursSummary** query, with the ability to **export the data to an Excel file**.

---

## 🔧 Tech Stack Requirements
- **Next.js 14** (App Router)
- **TypeScript**
- **React** + **Tailwind CSS**
- **mssql** (Node driver for SQL Server)
- **exceljs** (for Excel export)

---

## 🔐 Connection String (use as .env variable)
```
MSSQL_CONNECTION_STRING="Driver={ODBC Driver 18 for SQL Server};Server=tcp:ihours.database.windows.net,1433;Database=ErpDB;Uid=ihoursadmin;Pwd=@TandemgAdmin;Encrypt=yes;TrustServerCertificate=no;MultipleActiveResultSets=yes;Connection Timeout=30;"
```
If `mssql` prefers config parameters:
```ts
{
  server: 'ihours.database.windows.net',
  port: 1433,
  database: 'ErpDB',
  user: 'ihoursadmin',
  password: '@TandemgAdmin',
  options: { encrypt: true, trustServerCertificate: false }
}
```

---

## 📊 SQL Query (ActiveEmployees_WorkHoursSummary)
Use this exact SQL to fetch the list:

```sql
DECLARE @StartDate DATE = '2025-01-01';
DECLARE @EndDate   DATE = CAST(GETDATE() AS DATE);

SET DATEFIRST 7;
DECLARE @Today DATE = CAST(GETDATE() AS DATE);
DECLARE @ThisSunday DATE = DATEADD(DAY, 1 - DATEPART(WEEKDAY, @Today), @Today);
DECLARE @PrevSunday DATE = DATEADD(WEEK, -1, @ThisSunday);
DECLARE @PrevSaturday DATE = DATEADD(DAY, 6, @PrevSunday);
SET DATEFIRST 1;

WITH MinutesPerEmployee AS (
    SELECT har.EmployeeID, SUM(DATEDIFF(MINUTE, '00:00:00', COALESCE(har.Duration, '00:00:00'))) AS TotalMinutes
    FROM dbo.HoursActivityReport AS har
    WHERE har.CalendarDayId BETWEEN @StartDate AND @EndDate
    GROUP BY har.EmployeeID
),
WorkingMonthsFromHours AS (
    SELECT har.EmployeeID, COUNT(DISTINCT DATEFROMPARTS(YEAR(har.CalendarDayId), MONTH(har.CalendarDayId), 1)) AS WorkingMonths
    FROM dbo.HoursActivityReport AS har
    WHERE har.CalendarDayId BETWEEN @StartDate AND @EndDate
    GROUP BY har.EmployeeID
),
WorkingWeeksFromHours AS (
    SELECT har.EmployeeID, COUNT(DISTINCT DATEADD(DAY, 1 - DATEPART(WEEKDAY, har.CalendarDayId), har.CalendarDayId)) AS WorkingWeeks
    FROM dbo.HoursActivityReport AS har
    WHERE har.CalendarDayId BETWEEN @StartDate AND @EndDate
    GROUP BY har.EmployeeID
),
PrevWeekMinutesPerEmployee AS (
    SELECT har.EmployeeID, SUM(DATEDIFF(MINUTE, '00:00:00', COALESCE(har.Duration, '00:00:00'))) AS PrevWeekMinutes
    FROM dbo.HoursActivityReport AS har
    WHERE har.CalendarDayId BETWEEN @PrevSunday AND @PrevSaturday
    GROUP BY har.EmployeeID
),
CurrentOrLastFTE AS (
    SELECT DISTINCT eft.EmployeeID, FIRST_VALUE(eft.Percentage) OVER (
        PARTITION BY eft.EmployeeID
        ORDER BY CASE 
            WHEN eft.StartDate <= @Today AND (eft.EndDate IS NULL OR eft.EndDate > @Today) THEN 1
            WHEN eft.EndDate < @Today THEN 2 ELSE 3 END,
            COALESCE(eft.EndDate, '9999-12-31') DESC, eft.StartDate DESC
    ) AS EffectiveFTE FROM dbo.EmployeeFTETerm AS eft
),
LatestEndedPosition AS (
    SELECT ept.EmployeeID, MAX(ept.EndDate) AS TerminationDate
    FROM dbo.EmployeePositionTerm AS ept
    WHERE ept.EndDate IS NOT NULL
    GROUP BY ept.EmployeeID
)
SELECT
    e.ID AS EmployeeID,
    CONCAT(e.FirstName, ' ', e.LastName) AS EmployeeName,
    COALESCE(c.EffectiveFTE, 0) AS FTE_Percentage,
    lep.TerminationDate,
    CONCAT(CAST(m.TotalMinutes / 60 AS VARCHAR(10)), ':', RIGHT('00' + CAST(m.TotalMinutes % 60 AS VARCHAR(2)), 2)) AS Total_HHMM,
    wm.WorkingMonths,
    CEILING((m.TotalMinutes / 60.0) / NULLIF(wm.WorkingMonths, 0)) AS HoursPerWorkingMonth,
    ww.WorkingWeeks,
    CEILING((m.TotalMinutes / 60.0) / NULLIF(ww.WorkingWeeks, 0)) AS HoursPerWorkingWeek,
    CEILING(COALESCE(pw.PrevWeekMinutes, 0) / 60.0) AS PrevWeekHours_SunSat
FROM dbo.Employee AS e
LEFT JOIN MinutesPerEmployee AS m ON m.EmployeeID = e.ID
LEFT JOIN WorkingMonthsFromHours AS wm ON wm.EmployeeID = e.ID
LEFT JOIN WorkingWeeksFromHours AS ww ON ww.EmployeeID = e.ID
LEFT JOIN PrevWeekMinutesPerEmployee AS pw ON pw.EmployeeID = e.ID
LEFT JOIN CurrentOrLastFTE AS c ON c.EmployeeID = e.ID
LEFT JOIN LatestEndedPosition AS lep ON lep.EmployeeID = e.ID
WHERE lep.TerminationDate IS NULL
ORDER BY HoursPerWorkingMonth DESC;
```

---

## 🧠 Functional Requirements
1. **Database Layer** (`lib/db.ts`)
   - Create a reusable connection pool using `mssql`.
   - Export a function `getPool()` that returns a cached instance.

2. **API Layer** (`app/api/active-employees/route.ts`)
   - `GET /api/active-employees`: Runs the above SQL and returns JSON.
   - `GET /api/active-employees/export`: Generates an Excel file with identical data and sends it as a download (`ActiveEmployees_WorkHoursSummary_<timestamp>.xlsx`).

3. **Frontend Page** (`app/page.tsx`)
   - Fetches `/api/active-employees` and renders a paginated, sortable table.
   - Add search bar (filter by name) and default sorting by `HoursPerWorkingMonth DESC`.
   - Include an **Export to Excel** button that calls the export API and triggers download.

4. **UI Design**
   - Use **TailwindCSS** for layout.
   - Sticky header table, responsive columns.
   - Minimal, clean design similar to modern admin dashboards.

5. **Excel Export**
   - Use **exceljs** to create workbook + worksheet on the server.
   - Apply basic formatting: header bold, auto column width.

---

## 📦 Project Setup Commands
```bash
npx create-next-app@latest active-employees-app --typescript
cd active-employees-app
npm install mssql exceljs tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Add `.env.local` with:
```
MSSQL_CONNECTION_STRING="Driver={ODBC Driver 18 for SQL Server};Server=tcp:ihours.database.windows.net,1433;Database=ErpDB;Uid=ihoursadmin;Pwd=@TandemgAdmin;Encrypt=yes;TrustServerCertificate=no;MultipleActiveResultSets=yes;Connection Timeout=30;"
```

Then run:
```bash
npm run dev
```

---

## ✅ Deliverables
Claude should produce:
- `lib/db.ts` — database connection handler
- `app/api/active-employees/route.ts` — API route for data and Excel export
- `app/page.tsx` — front-end UI page displaying the data table
- `tailwind.config.ts`, `globals.css` — styling configuration
- Complete `package.json` with all dependencies
- A short `README.md` describing setup and usage
