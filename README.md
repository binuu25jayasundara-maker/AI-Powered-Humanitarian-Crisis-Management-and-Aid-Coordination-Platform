# ResQnest.AI Frontend (with Citizen Portal)

## Run
1. Install Node.js LTS from https://nodejs.org
2. Open THIS folder (the one with package.json) in VS Code
3. Terminal:
   npm install
   npm run dev
4. Open http://localhost:5173 and sign in with role "Citizen"

## Citizen Portal routes
/dashboard/citizen   Home
/citizen/request     Emergency request
/citizen/requests    Status tracker
/citizen/shelters    Map & shelters
/citizen/alerts      Safety alerts
/citizen/notifications
/citizen/profile
/emergency-help      Public, no login

Data is mock (localStorage) until the backend is ready: src/services/citizenApi.ts
