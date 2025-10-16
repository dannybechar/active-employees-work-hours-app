# Active Employees Work Hours Summary

A TypeScript web application built with Next.js that connects to Azure SQL Database to display active employee work hours data with Excel export functionality.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **React** + **Tailwind CSS**
- **mssql** (Node.js driver for SQL Server)
- **exceljs** (Excel export functionality)

## Features

- 📊 **Data Display**: Sortable, paginated table showing employee work hours summary
- 🔍 **Search**: Filter employees by name
- 📤 **Excel Export**: Download data as Excel file with formatting
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Real-time Sorting**: Click column headers to sort data

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Access to the Azure SQL Database

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env.local` file in the root directory with your database connection string:
   ```
   MSSQL_CONNECTION_STRING="Driver={ODBC Driver 18 for SQL Server};Server=tcp:ihours.database.windows.net,1433;Database=ErpDB;Uid=ihoursadmin;Pwd=@TandemgAdmin;Encrypt=yes;TrustServerCertificate=no;MultipleActiveResultSets=yes;Connection Timeout=30;"
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/
│   │   └── active-employees/
│   │       └── route.ts          # API endpoints for data and Excel export
│   ├── globals.css               # Global CSS with Tailwind
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Main page with data table
├── lib/
│   └── db.ts                     # Database connection handler
├── .env.local                    # Environment variables (not in repo)
├── package.json                  # Dependencies and scripts
├── tailwind.config.ts            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## API Endpoints

### GET `/api/active-employees`
Returns JSON data of active employees with work hours summary.

### GET `/api/active-employees?export=excel`
Downloads an Excel file (`ActiveEmployees_WorkHoursSummary_<timestamp>.xlsx`) containing the same data with formatting.

## Database Query

The application executes a complex SQL query that:
- Calculates total working hours from `HoursActivityReport`
- Determines working months and weeks
- Calculates hours per working month/week
- Gets previous week hours (Sunday to Saturday)
- Filters only active employees (no termination date)
- Orders by hours per working month (descending)

## Usage

1. **View Data**: The main page displays a table of active employees with their work hours metrics
2. **Search**: Use the search bar to filter employees by name
3. **Sort**: Click any column header to sort the data
4. **Paginate**: Use pagination controls at the bottom for large datasets
5. **Export**: Click "Export to Excel" to download the data as an Excel file

## Development

To build for production:
```bash
npm run build
npm start
```

To run in development mode with hot reloading:
```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MSSQL_CONNECTION_STRING` | Complete Azure SQL Database connection string |

## License

This project is for internal use.