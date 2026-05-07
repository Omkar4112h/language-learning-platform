module.exports = {
  apps: [
    {
      name: 'langlearn-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      watch: false,
      env: {
        NODE_ENV: 'development',
        BROWSER: 'none'
      }
    },
    {
      name: 'langlearn-backend',
      cwd: './backend',
      script: './venv/Scripts/python.exe',
      args: '-m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000',
      watch: false,
      interpreter: 'none'
    }
  ]
};
