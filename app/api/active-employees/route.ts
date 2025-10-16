import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import ExcelJS from 'exceljs';

export interface EmployeeData {
  EmployeeID: number;
  EmployeeName: string;
  FTE_Percentage: number;
  TerminationDate: string | null;
  Total_HHMM: string;
  WorkingMonths: number;
  HoursPerWorkingMonth: number;
  WorkingWeeks: number;
  HoursPerWorkingWeek: number;
  PrevWeekHours_SunSat: number;
}

const SQL_QUERY = `
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
`;

async function getActiveEmployeesData(): Promise<EmployeeData[]> {
  try {
    const pool = await getPool();
    const result = await pool.request().query(SQL_QUERY);
    return result.recordset as EmployeeData[];
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Failed to fetch employee data');
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const export_format = searchParams.get('export');

  try {
    const data = await getActiveEmployeesData();

    if (export_format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Active Employees Work Hours Summary');

      const headers = [
        'Employee ID',
        'Employee Name',
        'FTE Percentage',
        'Termination Date',
        'Total Hours (HH:MM)',
        'Working Months',
        'Hours Per Working Month',
        'Working Weeks',
        'Hours Per Working Week',
        'Previous Week Hours (Sun-Sat)'
      ];

      worksheet.addRow(headers);

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      data.forEach(employee => {
        worksheet.addRow([
          employee.EmployeeID,
          employee.EmployeeName,
          employee.FTE_Percentage,
          employee.TerminationDate,
          employee.Total_HHMM,
          employee.WorkingMonths,
          employee.HoursPerWorkingMonth,
          employee.WorkingWeeks,
          employee.HoursPerWorkingWeek,
          employee.PrevWeekHours_SunSat
        ]);
      });

      worksheet.columns.forEach(column => {
        column.width = 20;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="ActiveEmployees_WorkHoursSummary_${timestamp}.xlsx"`
        }
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee data' },
      { status: 500 }
    );
  }
}