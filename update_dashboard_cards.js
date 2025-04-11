const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/pages/DashboardHome.tsx');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Update Orders card
fileContent = fileContent.replace(
  /(<Paper[\s\S]*?elevation={0}[\s\S]*?sx={{[\s\S]*?)backgroundColor: 'primary\.light',([\s\S]*?<\/Paper>)/m,
  (match, before, after) => {
    return `<Paper
  elevation={0}
  className="dashboard-card dashboard-card-primary"
  sx={{
    p: 3
  }}${after}`;
  }
);

// Update Order Requests card
fileContent = fileContent.replace(
  /(<Paper[\s\S]*?elevation={0}[\s\S]*?sx={{[\s\S]*?)backgroundColor: theme\.palette\.warning\.dark,([\s\S]*?<\/Paper>)/m,
  (match, before, after) => {
    return `<Paper
  elevation={0}
  className="dashboard-card dashboard-card-warning"
  sx={{
    p: 3
  }}${after}`;
  }
);

// Update Inventory card
fileContent = fileContent.replace(
  /(<Paper[\s\S]*?elevation={0}[\s\S]*?sx={{[\s\S]*?)backgroundColor: theme\.palette\.warning\.main,([\s\S]*?<\/Paper>)/m,
  (match, before, after) => {
    return `<Paper
  elevation={0}
  className="dashboard-card dashboard-card-warning"
  sx={{
    p: 3
  }}${after}`;
  }
);

// Update Employees card
fileContent = fileContent.replace(
  /(<Paper[\s\S]*?elevation={0}[\s\S]*?sx={{[\s\S]*?)backgroundColor: '#7E57C2',([\s\S]*?<\/Paper>)/m,
  (match, before, after) => {
    return `<Paper
  elevation={0}
  className="dashboard-card dashboard-card-purple"
  sx={{
    p: 3
  }}${after}`;
  }
);

// Update Payroll card
fileContent = fileContent.replace(
  /(<Paper[\s\S]*?elevation={0}[\s\S]*?sx={{[\s\S]*?)backgroundColor: '#26A69A',([\s\S]*?<\/Paper>)/m,
  (match, before, after) => {
    return `<Paper
  elevation={0}
  className="dashboard-card dashboard-card-teal"
  sx={{
    p: 3
  }}${after}`;
  }
);

// Update Machinery card
fileContent = fileContent.replace(
  /(<Paper[\s\S]*?elevation={0}[\s\S]*?sx={{[\s\S]*?)backgroundColor: '#EF6C00',([\s\S]*?<\/Paper>)/m,
  (match, before, after) => {
    return `<Paper
  elevation={0}
  className="dashboard-card dashboard-card-orange"
  sx={{
    p: 3
  }}${after}`;
  }
);

// Replace icon styling with class names
fileContent = fileContent.replace(
  /(<OrdersIcon)\s+sx={{\s+position: ['"]absolute['"],\s+right: -20,\s+bottom: -20,\s+fontSize: 150,\s+opacity: 0\.2\s+}}\s+\/>/g,
  '$1 className="icon-bg" />'
);

fileContent = fileContent.replace(
  /(<RequestIcon)\s+sx={{\s+position: ['"]absolute['"],\s+right: -20,\s+bottom: -20,\s+fontSize: 150,\s+opacity: 0\.2\s+}}\s+\/>/g,
  '$1 className="icon-bg" />'
);

fileContent = fileContent.replace(
  /(<InventoryIcon)\s+sx={{\s+position: ['"]absolute['"],\s+right: -20,\s+bottom: -20,\s+fontSize: 150,\s+opacity: 0\.2\s+}}\s+\/>/g,
  '$1 className="icon-bg" />'
);

fileContent = fileContent.replace(
  /(<PeopleIcon)\s+sx={{\s+position: ['"]absolute['"],\s+right: -20,\s+bottom: -20,\s+fontSize: 150,\s+opacity: 0\.2\s+}}\s+\/>/g,
  '$1 className="icon-bg" />'
);

fileContent = fileContent.replace(
  /(<PaidIcon)\s+sx={{\s+position: ['"]absolute['"],\s+right: -20,\s+bottom: -20,\s+fontSize: 150,\s+opacity: 0\.2\s+}}\s+\/>/g,
  '$1 className="icon-bg" />'
);

fileContent = fileContent.replace(
  /(<ConstructionIcon)\s+sx={{\s+position: ['"]absolute['"],\s+right: -20,\s+bottom: -20,\s+fontSize: 150,\s+opacity: 0\.2\s+}}\s+\/>/g,
  '$1 className="icon-bg" />'
);

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Dashboard cards updated successfully!');