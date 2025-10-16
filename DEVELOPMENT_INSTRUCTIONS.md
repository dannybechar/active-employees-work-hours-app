# Development Instructions for Active Employees Work Hours App

## Project Overview
This is a TypeScript Next.js 14 application that connects to Azure SQL Database to display active employee work hours data with Excel export functionality. The app features a sortable, searchable data table with pagination and professional UI using Tailwind CSS.

## Current Project Status
- ✅ **Complete MVP deployed and functional**
- ✅ Database connection with Azure SQL using mssql driver
- ✅ API endpoints for data retrieval and Excel export
- ✅ Frontend with sorting, searching, pagination
- ✅ Excel export with formatting
- ✅ GitHub repository setup
- ✅ Local development environment running

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Azure SQL Database via mssql driver
- **Export**: ExcelJS for Excel file generation
- **Development**: Local development server with hot reload

### Project Structure
```
├── app/
│   ├── api/
│   │   └── active-employees/
│   │       └── route.ts          # API endpoints (GET data, GET Excel export)
│   ├── globals.css               # Tailwind CSS styles
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Main data table page
├── lib/
│   └── db.ts                     # Database connection handler
├── .env.local                    # Environment variables (DATABASE CONNECTION)
├── package.json                  # Dependencies and scripts
├── tailwind.config.ts            # Tailwind configuration
└── tsconfig.json                 # TypeScript configuration
```

## Database Schema Context

### Key Tables Used
- `dbo.Employee` - Employee master data (ID, FirstName, LastName)
- `dbo.HoursActivityReport` - Time tracking data (EmployeeID, CalendarDayId, Duration)
- `dbo.EmployeeFTETerm` - FTE percentage history (EmployeeID, Percentage, StartDate, EndDate)
- `dbo.EmployeePositionTerm` - Position history including terminations (EmployeeID, EndDate)

### Main Query Logic
The core SQL query (`ActiveEmployees_WorkHoursSummary`) performs:
1. Calculates total minutes worked per employee from HoursActivityReport
2. Determines working months and weeks counts
3. Calculates hours per working month/week averages
4. Gets previous week hours (Sunday to Saturday)
5. Filters only active employees (no termination date)
6. Orders by hours per working month descending

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Git Commands
```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "description"

# Push to GitHub
git push origin main
```

## Environment Setup

### Required Environment Variables (.env.local)
```env
MSSQL_CONNECTION_STRING="Driver={ODBC Driver 18 for SQL Server};Server=tcp:ihours.database.windows.net,1433;Database=ErpDB;Uid=ihoursadmin;Pwd=@TandemgAdmin;Encrypt=yes;TrustServerCertificate=no;MultipleActiveResultSets=yes;Connection Timeout=30;"
```

### Database Connection Configuration
Located in `lib/db.ts`:
- Connection pooling enabled (max 10 connections)
- 30-second connection and request timeouts
- SSL encryption enabled
- Automatic connection management

## Key Files and Their Purposes

### `/app/api/active-employees/route.ts`
- **Purpose**: API endpoints for data retrieval and Excel export
- **Endpoints**:
  - `GET /api/active-employees` - Returns JSON employee data
  - `GET /api/active-employees?export=excel` - Downloads Excel file
- **Key Functions**:
  - `getActiveEmployeesData()` - Executes main SQL query
  - Excel generation with formatting using ExcelJS

### `/app/page.tsx`
- **Purpose**: Main frontend page with data table
- **Features**:
  - Real-time search by employee name
  - Sortable columns (click headers)
  - Pagination (20 items per page)
  - Excel export button
  - Responsive design
- **State Management**: Uses React hooks for local state

### `/lib/db.ts`
- **Purpose**: Database connection management
- **Features**:
  - Connection pool singleton pattern
  - Error handling and logging
  - Graceful connection cleanup
  - Azure SQL specific configuration

## API Reference

### GET `/api/active-employees`
**Response**: JSON array of employee work hours data
```typescript
interface EmployeeData {
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
```

### GET `/api/active-employees?export=excel`
**Response**: Excel file download with formatted data
**Filename**: `ActiveEmployees_WorkHoursSummary_<timestamp>.xlsx`

## Common Development Tasks

### Adding New Features
1. **New API Endpoint**: Add to `/app/api/` directory
2. **Database Changes**: Modify queries in API routes
3. **UI Changes**: Update `/app/page.tsx` and CSS
4. **New Components**: Create in `/components/` directory (if needed)

### Database Query Modifications
- Main query is in `/app/api/active-employees/route.ts`
- Modify the `SQL_QUERY` constant
- Update TypeScript interfaces if data structure changes
- Test with various date ranges and employee data

### UI Enhancements
- Tailwind CSS classes in `/app/page.tsx`
- Global styles in `/app/globals.css`
- Responsive design considerations for mobile/desktop

### Excel Export Customizations
- ExcelJS configuration in API route
- Header formatting, column widths, cell styling
- Additional worksheets or data formatting

## Debugging and Troubleshooting

### Common Issues
1. **Database Connection Errors**:
   - Check `.env.local` file exists and has correct connection string
   - Verify Azure SQL firewall allows your IP
   - Check connection pool status in logs

2. **Excel Export Not Working**:
   - Verify ExcelJS dependency installed
   - Check browser download settings
   - Verify API endpoint response headers

3. **UI Not Updating**:
   - Check React dev tools for state issues
   - Verify API responses in Network tab
   - Check console for JavaScript errors

### Logging
- Database connections logged to console
- API errors logged with stack traces
- Frontend errors visible in browser console

## Testing Strategy

### Manual Testing Checklist
- [ ] Data loads correctly on page load
- [ ] Search functionality filters by name
- [ ] All columns sort correctly (ascending/descending)
- [ ] Pagination works with large datasets
- [ ] Excel export downloads with correct data
- [ ] Responsive design works on mobile/desktop

### Database Testing
- [ ] Query executes within reasonable time (<5 seconds)
- [ ] Data accuracy verified against source tables
- [ ] Date range logic correct for current period
- [ ] Active employee filtering working

## Future Enhancement Ideas

### Short-term Improvements
- Add loading spinners for better UX
- Implement error boundaries for error handling
- Add data refresh button
- Export to additional formats (CSV, PDF)

### Medium-term Features
- Date range selection for historical data
- Employee detail drill-down pages
- Charts and visualizations
- Real-time data updates

### Long-term Considerations
- User authentication and role-based access
- Multiple database environment support
- Automated testing suite
- Performance optimization for large datasets

## Deployment Notes

### Local Development
- Application runs on `http://localhost:3000`
- Hot reload enabled for development
- Environment variables loaded from `.env.local`

### Production Considerations
- Build optimization with `npm run build`
- Environment variables via deployment platform
- Database connection scaling considerations
- Static asset optimization

## Security Considerations

### Current Security Measures
- Database credentials in environment variables
- SSL/TLS encryption for database connections
- No sensitive data exposed in client-side code

### Security Best Practices
- Never commit `.env.local` to git
- Regularly rotate database credentials
- Implement proper error handling (no stack traces in production)
- Consider implementing rate limiting for API endpoints

## Contact and Resources

### Key Resources
- **GitHub Repository**: https://github.com/dannybechar/active-employees-work-hours-app
- **Local Development**: http://localhost:3000
- **Next.js Documentation**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **ExcelJS Documentation**: https://github.com/exceljs/exceljs

### Development Environment
- **Node.js Version**: 18+ required
- **Package Manager**: npm
- **IDE Recommendations**: VS Code with TypeScript extensions
- **Git**: Version control with GitHub integration

---

*This file should be updated whenever significant changes are made to the project architecture, database schema, or development workflow.*