import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

const config: sql.config = {
  server: 'ihours.database.windows.net',
  port: 1433,
  database: 'ErpDB',
  user: 'ihoursadmin',
  password: '@TandemgAdmin',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    try {
      pool = new sql.ConnectionPool(config);
      await pool.connect();
      console.log('Connected to Azure SQL Database');
    } catch (err) {
      console.error('Database connection failed:', err);
      throw err;
    }
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Database connection closed');
  }
}

export { sql };