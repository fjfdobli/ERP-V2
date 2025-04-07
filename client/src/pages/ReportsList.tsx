import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, TextField, InputAdornment, CircularProgress, Grid, Snackbar, Alert, 
  FormControl, InputLabel, Select, MenuItem, Card, CardContent, CardHeader,
  Divider, List, ListItem, ListItemText, Chip, Tabs, Tab
} from '@mui/material';
import { 
  Search as SearchIcon, Refresh as RefreshIcon, 
  Download as DownloadIcon, PictureAsPdf as PdfIcon,
  InsertDriveFile as ExcelIcon, Dashboard as DashboardIcon,
  ReceiptLong as ReceiptIcon, Description as ReportIcon,
  CalendarMonth as CalendarIcon, ShoppingCart as OrdersIcon,
  Inventory as InventoryIcon, People as PeopleIcon,
  Build as BuildIcon, AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { format as formatDate, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, formatDistance, isWithinInterval } from 'date-fns';
import { fetchPayrolls } from '../redux/slices/payrollSlice';
import { fetchEmployees } from '../redux/slices/employeesSlice';
import { fetchInventory } from '../redux/slices/inventorySlice';
import { fetchClientOrders } from '../redux/slices/clientOrdersSlice';
import { fetchClients } from '../redux/slices/clientsSlice';
import { fetchSuppliers } from '../redux/slices/suppliersSlice';
import { fetchMachinery, fetchMachineryStats } from '../redux/slices/machinerySlice';
import { fetchAttendance } from '../redux/slices/attendanceSlice';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Report templates and document interfaces
interface ReportFilter {
  startDate: Date;
  endDate: Date;
  type: string;
  format: 'pdf' | 'excel' | 'csv';
}

// Create a wrapper for format function to avoid collision with 'format' property 
const formatFunc = (date: Date | number, formatStr: string) => {
  // When using format inside a function that uses the 'format' parameter
  // we need to make sure we're using the date-fns function, not the parameter
  return formatDate(date, formatStr);
};

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  availableFormats: ('pdf' | 'excel' | 'csv')[];
  generateReport: (
    data: any, 
    format: 'pdf' | 'excel' | 'csv', 
    startDate: Date, 
    endDate: Date
  ) => void;
}

interface ReportTemplate {
  title: string;
  subtitle: string;
  headerFields: string[];
  footerText: string;
  logo?: string;
}

const ReportsList: React.FC = () => {
  const dispatch = useAppDispatch();
  const payrollState = useAppSelector((state: any) => state.payroll || {});
  const employeesState = useAppSelector((state: any) => state.employees || {});
  const clientsState = useAppSelector((state: any) => state.clients || {});
  const suppliersState = useAppSelector((state: any) => state.suppliers || {});
  const inventoryState = useAppSelector((state: any) => state.inventory || {});
  const clientOrdersState = useAppSelector((state: any) => state.clientOrders || {});
  const supplierOrdersState = useAppSelector((state: any) => state.supplierOrders || {});
  const machineryState = useAppSelector((state: any) => state.machinery || {});
  const attendanceState = useAppSelector((state: any) => state.attendance || {});
  
  const [loading, setLoading] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState(0);
  const [reportFilters, setReportFilters] = useState<ReportFilter>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    type: 'all',
    format: 'pdf'
  });
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Common templates
  const commonTemplate: ReportTemplate = {
    title: "Printing Press ERP",
    subtitle: "Generated Report",
    headerFields: [],
    footerText: "© Printing Press ERP System. This is a system-generated report."
  };

  // Document generation utilities
  const generatePDF = (
    data: any[],
    columns: { header: string, dataKey: string }[],
    title: string,
    subtitle: string = '',
    orientation: 'portrait' | 'landscape' = 'portrait'
  ) => {
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = orientation === 'portrait' ? 210 : 297;
    const pageHeight = orientation === 'portrait' ? 297 : 210;
    
    // Add title and header
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 15, { align: 'center' });
    
    if (subtitle) {
      doc.setFontSize(12);
      doc.text(subtitle, pageWidth / 2, 22, { align: 'center' });
    }
    
    // Add date range
    const dateRange = `From: ${formatDate(reportFilters.startDate, 'MMM dd, yyyy')} - To: ${formatDate(reportFilters.endDate, 'MMM dd, yyyy')}`;
    doc.setFontSize(10);
    doc.text(`Report Date: ${formatDate(new Date(), 'MMM dd, yyyy')}`, 14, 30);
    doc.text(dateRange, 14, 35);
    
    // Add table
    (doc as any).autoTable({
      startY: 40,
      head: [columns.map(col => col.header)],
      body: data.map(item => columns.map(col => item[col.dataKey] || '')),
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      margin: { top: 40, right: 14, bottom: 20, left: 14 }
    });
    
    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount} - ${commonTemplate.footerText}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_report.pdf`);
    
    return doc;
  };

  const generateExcel = (
    data: any[],
    columns: { header: string, dataKey: string }[],
    sheetName: string,
    fileName: string
  ) => {
    const worksheetData = [
      columns.map(col => col.header),
      ...data.map(item => columns.map(col => item[col.dataKey] || ''))
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName.toLowerCase().replace(/\s+/g, '_')}_report.xlsx`);
  };

  const generateCSV = (
    data: any[],
    columns: { header: string, dataKey: string }[],
    fileName: string
  ) => {
    const worksheetData = [
      columns.map(col => col.header),
      ...data.map(item => columns.map(col => item[col.dataKey] || ''))
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName.toLowerCase().replace(/\s+/g, '_')}_report.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Report generation functions
  const generateSalesSummaryReport = (
    data: any,
    outputFormat: 'pdf' | 'excel' | 'csv',
    startDate: Date,
    endDate: Date
  ) => {
    const clientOrders = data.clientOrders || [];
    
    // Filter orders in the date range
    const filteredOrders = clientOrders.filter((order: any) => {
      const orderDate = parseISO(order.orderDate);
      return isWithinInterval(orderDate, { start: startDate, end: endDate });
    });
    
    // Process data for the report
    const reportData = filteredOrders.map((order: any) => ({
      orderNumber: order.orderNumber || order.id,
      clientName: order.clientName,
      orderDate: formatDate(parseISO(order.orderDate), 'MMM dd, yyyy'),
      deliveryDate: order.deliveryDate ? formatDate(parseISO(order.deliveryDate), 'MMM dd, yyyy') : 'N/A',
      status: order.status,
      totalAmount: formatCurrency(order.totalAmount || 0),
      paymentStatus: order.paymentStatus
    }));
    
    // Define columns for the report
    const columns = [
      { header: 'Order #', dataKey: 'orderNumber' },
      { header: 'Client', dataKey: 'clientName' },
      { header: 'Order Date', dataKey: 'orderDate' },
      { header: 'Delivery Date', dataKey: 'deliveryDate' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Amount', dataKey: 'totalAmount' },
      { header: 'Payment', dataKey: 'paymentStatus' }
    ];
    
    // Summary calculations
    const totalSales = filteredOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
    const paidOrders = filteredOrders.filter((order: any) => order.paymentStatus === 'Paid').length;
    const pendingOrders = filteredOrders.filter((order: any) => order.paymentStatus !== 'Paid').length;
    
    // Add summary to the report data
    reportData.push(
      { orderNumber: '', clientName: '', orderDate: '', deliveryDate: '', status: '', totalAmount: '', paymentStatus: '' },
      { orderNumber: 'Summary', clientName: '', orderDate: '', deliveryDate: '', status: '', totalAmount: '', paymentStatus: '' },
      { orderNumber: 'Total Orders', clientName: filteredOrders.length, orderDate: '', deliveryDate: '', status: '', totalAmount: '', paymentStatus: '' },
      { orderNumber: 'Total Sales', clientName: '', orderDate: '', deliveryDate: '', status: '', totalAmount: formatCurrency(totalSales), paymentStatus: '' },
      { orderNumber: 'Paid Orders', clientName: paidOrders, orderDate: '', deliveryDate: '', status: '', totalAmount: '', paymentStatus: '' },
      { orderNumber: 'Pending Orders', clientName: pendingOrders, orderDate: '', deliveryDate: '', status: '', totalAmount: '', paymentStatus: '' }
    );
    
    const title = "Sales Summary Report";
    const subtitle = `From ${formatDate(startDate, 'MMM dd, yyyy')} to ${formatDate(endDate, 'MMM dd, yyyy')}`;
    
    // Generate report in the selected format
    if (outputFormat === 'pdf') {
      generatePDF(reportData, columns, title, subtitle, 'landscape');
    } else if (outputFormat === 'excel') {
      generateExcel(reportData, columns, 'Sales Summary', title);
    } else if (outputFormat === 'csv') {
      generateCSV(reportData, columns, title);
    }
  };

  const generateInventoryReport = (
    data: any,
    outputFormat: 'pdf' | 'excel' | 'csv',
    startDate: Date,
    endDate: Date
  ) => {
    const inventory = data.inventory || [];
    
    // Process data for the report
    const reportData = inventory.map((item: any) => ({
      itemCode: item.itemCode || item.id,
      itemName: item.itemName,
      category: item.category,
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      unitPrice: formatCurrency(item.unitPrice || 0),
      value: formatCurrency((item.currentStock || 0) * (item.unitPrice || 0)),
      status: item.currentStock <= item.reorderLevel ? 'Low Stock' : 'In Stock'
    }));
    
    // Define columns for the report
    const columns = [
      { header: 'Item Code', dataKey: 'itemCode' },
      { header: 'Item Name', dataKey: 'itemName' },
      { header: 'Category', dataKey: 'category' },
      { header: 'Current Stock', dataKey: 'currentStock' },
      { header: 'Reorder Level', dataKey: 'reorderLevel' },
      { header: 'Unit Price', dataKey: 'unitPrice' },
      { header: 'Total Value', dataKey: 'value' },
      { header: 'Status', dataKey: 'status' }
    ];
    
    // Summary calculations
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter((item: any) => item.currentStock <= item.reorderLevel).length;
    const totalValue = inventory.reduce((sum: number, item: any) => 
      sum + ((item.currentStock || 0) * (item.unitPrice || 0)), 0);
    
    // Add summary to the report data
    reportData.push(
      { itemCode: '', itemName: '', category: '', currentStock: '', reorderLevel: '', unitPrice: '', value: '', status: '' },
      { itemCode: 'Summary', itemName: '', category: '', currentStock: '', reorderLevel: '', unitPrice: '', value: '', status: '' },
      { itemCode: 'Total Items', itemName: totalItems, category: '', currentStock: '', reorderLevel: '', unitPrice: '', value: '', status: '' },
      { itemCode: 'Low Stock Items', itemName: lowStockItems, category: '', currentStock: '', reorderLevel: '', unitPrice: '', value: '', status: '' },
      { itemCode: 'Total Inventory Value', itemName: '', category: '', currentStock: '', reorderLevel: '', unitPrice: '', value: formatCurrency(totalValue), status: '' }
    );
    
    const title = "Inventory Status Report";
    const subtitle = `Generated on ${formatDate(new Date(), 'MMM dd, yyyy')}`;
    
    // Generate report in the selected format
    if (outputFormat === 'pdf') {
      generatePDF(reportData, columns, title, subtitle, 'landscape');
    } else if (outputFormat === 'excel') {
      generateExcel(reportData, columns, 'Inventory', title);
    } else if (outputFormat === 'csv') {
      generateCSV(reportData, columns, title);
    }
  };

  const generateAttendanceReport = (
    data: any,
    outputFormat: 'pdf' | 'excel' | 'csv',
    startDate: Date,
    endDate: Date
  ) => {
    const attendance = data.attendance || [];
    const employees = data.employees || [];
    
    // Filter attendance records in the date range
    const filteredAttendance = attendance.filter((record: any) => {
      const recordDate = parseISO(record.date);
      return isWithinInterval(recordDate, { start: startDate, end: endDate });
    });
    
    // Get employee details
    const employeeMap = employees.reduce((map: any, employee: any) => {
      map[employee.id] = employee;
      return map;
    }, {});
    
    // Process data for the report
    const reportData = filteredAttendance.map((record: any) => {
      const employee = employeeMap[record.employeeId] || {};
      return {
        employeeId: record.employeeId,
        employeeName: employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`,
        department: employee.department || 'N/A',
        date: formatDate(parseISO(record.date), 'MMM dd, yyyy'),
        timeIn: record.timeIn || 'N/A',
        timeOut: record.timeOut || 'N/A',
        status: record.status || 'Present',
        hoursWorked: record.hoursWorked || 'N/A',
        overtime: record.overtime || '0'
      };
    });
    
    // Define columns for the report
    const columns = [
      { header: 'Employee ID', dataKey: 'employeeId' },
      { header: 'Employee Name', dataKey: 'employeeName' },
      { header: 'Department', dataKey: 'department' },
      { header: 'Date', dataKey: 'date' },
      { header: 'Time In', dataKey: 'timeIn' },
      { header: 'Time Out', dataKey: 'timeOut' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Hours Worked', dataKey: 'hoursWorked' },
      { header: 'Overtime', dataKey: 'overtime' }
    ];
    
    const title = "Employee Attendance Report";
    const subtitle = `From ${formatDate(startDate, 'MMM dd, yyyy')} to ${formatDate(endDate, 'MMM dd, yyyy')}`;
    
    // Generate report in the selected format
    if (outputFormat === 'pdf') {
      generatePDF(reportData, columns, title, subtitle, 'landscape');
    } else if (outputFormat === 'excel') {
      generateExcel(reportData, columns, 'Attendance', title);
    } else if (outputFormat === 'csv') {
      generateCSV(reportData, columns, title);
    }
  };

  const generateMachineryReport = (
    data: any,
    outputFormat: 'pdf' | 'excel' | 'csv',
    startDate: Date,
    endDate: Date
  ) => {
    const machinery = data.machinery || [];
    const maintenanceRecords = data.machineryStats?.maintenanceRecords || [];
    
    // Filter maintenance records in the date range
    const filteredMaintenance = maintenanceRecords.filter((record: any) => {
      const recordDate = parseISO(record.date);
      return isWithinInterval(recordDate, { start: startDate, end: endDate });
    });
    
    // Get machinery details
    const machineryMap = machinery.reduce((map: any, machine: any) => {
      map[machine.id] = machine;
      return map;
    }, {});
    
    // Process data for the report
    const reportData = filteredMaintenance.map((record: any) => {
      const machine = machineryMap[record.machineryId] || {};
      return {
        machineryId: record.machineryId,
        machineryName: machine.name || 'Unknown',
        maintenanceType: record.maintenanceType || 'Routine',
        date: formatDate(parseISO(record.date), 'MMM dd, yyyy'),
        performedBy: record.performedBy || 'N/A',
        cost: formatCurrency(record.cost || 0),
        details: record.details || 'N/A',
        nextMaintenanceDate: machine.nextMaintenanceDate ? 
          formatDate(parseISO(machine.nextMaintenanceDate), 'MMM dd, yyyy') : 'N/A',
      };
    });
    
    // Define columns for the report
    const columns = [
      { header: 'Machinery ID', dataKey: 'machineryId' },
      { header: 'Machinery Name', dataKey: 'machineryName' },
      { header: 'Maintenance Type', dataKey: 'maintenanceType' },
      { header: 'Date', dataKey: 'date' },
      { header: 'Performed By', dataKey: 'performedBy' },
      { header: 'Cost', dataKey: 'cost' },
      { header: 'Details', dataKey: 'details' },
      { header: 'Next Maintenance', dataKey: 'nextMaintenanceDate' }
    ];
    
    const title = "Machinery Maintenance Report";
    const subtitle = `From ${formatDate(startDate, 'MMM dd, yyyy')} to ${formatDate(endDate, 'MMM dd, yyyy')}`;
    
    // Generate report in the selected format
    if (outputFormat === 'pdf') {
      generatePDF(reportData, columns, title, subtitle, 'landscape');
    } else if (outputFormat === 'excel') {
      generateExcel(reportData, columns, 'Machinery Maintenance', title);
    } else if (outputFormat === 'csv') {
      generateCSV(reportData, columns, title);
    }
  };

  const generatePayrollReport = (
    data: any,
    outputFormat: 'pdf' | 'excel' | 'csv',
    startDate: Date,
    endDate: Date
  ) => {
    const payrollRecords = data.payrollRecords || [];
    const employees = data.employees || [];
    
    // Filter payroll records in the date range
    const filteredPayroll = payrollRecords.filter((record: any) => {
      const payPeriodEnd = parseISO(record.payPeriodEnd);
      return isWithinInterval(payPeriodEnd, { start: startDate, end: endDate });
    });
    
    // Get employee details
    const employeeMap = employees.reduce((map: any, employee: any) => {
      map[employee.id] = employee;
      return map;
    }, {});
    
    // Process data for the report
    const reportData = filteredPayroll.map((record: any) => {
      const employee = employeeMap[record.employeeId] || {};
      return {
        employeeId: record.employeeId,
        employeeName: employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`,
        department: employee.department || 'N/A',
        position: employee.position || 'N/A',
        payPeriod: `${formatDate(parseISO(record.payPeriodStart), 'MMM dd')} - ${formatDate(parseISO(record.payPeriodEnd), 'MMM dd, yyyy')}`,
        basicSalary: formatCurrency(record.basicSalary || 0),
        overtime: formatCurrency(record.overtimePay || 0),
        deductions: formatCurrency(record.deductions || 0),
        netSalary: formatCurrency(record.netSalary || 0)
      };
    });
    
    // Define columns for the report
    const columns = [
      { header: 'Employee ID', dataKey: 'employeeId' },
      { header: 'Employee Name', dataKey: 'employeeName' },
      { header: 'Department', dataKey: 'department' },
      { header: 'Position', dataKey: 'position' },
      { header: 'Pay Period', dataKey: 'payPeriod' },
      { header: 'Basic Salary', dataKey: 'basicSalary' },
      { header: 'Overtime', dataKey: 'overtime' },
      { header: 'Deductions', dataKey: 'deductions' },
      { header: 'Net Salary', dataKey: 'netSalary' }
    ];
    
    // Summary calculations
    const totalPayroll = filteredPayroll.reduce((sum: number, record: any) => 
      sum + (record.netSalary || 0), 0);
    
    // Add summary to the report data
    reportData.push(
      { employeeId: '', employeeName: '', department: '', position: '', payPeriod: '', basicSalary: '', overtime: '', deductions: '', netSalary: '' },
      { employeeId: 'Summary', employeeName: '', department: '', position: '', payPeriod: '', basicSalary: '', overtime: '', deductions: '', netSalary: '' },
      { employeeId: 'Total Employees', employeeName: filteredPayroll.length, department: '', position: '', payPeriod: '', basicSalary: '', overtime: '', deductions: '', netSalary: '' },
      { employeeId: 'Total Payroll', employeeName: '', department: '', position: '', payPeriod: '', basicSalary: '', overtime: '', deductions: '', netSalary: formatCurrency(totalPayroll) }
    );
    
    const title = "Payroll Report";
    const subtitle = `From ${formatDate(startDate, 'MMM dd, yyyy')} to ${formatDate(endDate, 'MMM dd, yyyy')}`;
    
    // Generate report in the selected format
    if (outputFormat === 'pdf') {
      generatePDF(reportData, columns, title, subtitle, 'landscape');
    } else if (outputFormat === 'excel') {
      generateExcel(reportData, columns, 'Payroll', title);
    } else if (outputFormat === 'csv') {
      generateCSV(reportData, columns, title);
    }
  };

  const generateDTR = (
    data: any,
    outputFormat: 'pdf' | 'excel' | 'csv',
    startDate: Date,
    endDate: Date
  ) => {
    const attendance = data.attendance || [];
    const employees = data.employees || [];
    
    // Group attendance by employee
    const attendanceByEmployee: { [key: string]: any[] } = {};
    
    attendance.forEach((record: any) => {
      const recordDate = parseISO(record.date);
      if (isWithinInterval(recordDate, { start: startDate, end: endDate })) {
        if (!attendanceByEmployee[record.employeeId]) {
          attendanceByEmployee[record.employeeId] = [];
        }
        attendanceByEmployee[record.employeeId].push(record);
      }
    });
    
    // Get employee details
    const employeeMap = employees.reduce((map: any, employee: any) => {
      map[employee.id] = employee;
      return map;
    }, {});
    
    // Generate a DTR for each employee
    Object.keys(attendanceByEmployee).forEach((employeeId) => {
      const employee = employeeMap[employeeId] || {};
      const employeeRecords = attendanceByEmployee[employeeId];
      
      // Sort records by date
      employeeRecords.sort((a: any, b: any) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      // Process data for the report
      const reportData = employeeRecords.map((record: any) => ({
        date: formatDate(parseISO(record.date), 'MMM dd, yyyy'),
        day: formatDate(parseISO(record.date), 'EEEE'),
        timeIn: record.timeIn || 'N/A',
        timeOut: record.timeOut || 'N/A',
        hoursWorked: record.hoursWorked || 'N/A',
        overtime: record.overtime || '0',
        status: record.status || 'Present',
        remarks: record.remarks || ''
      }));
      
      // Define columns for the report
      const columns = [
        { header: 'Date', dataKey: 'date' },
        { header: 'Day', dataKey: 'day' },
        { header: 'Time In', dataKey: 'timeIn' },
        { header: 'Time Out', dataKey: 'timeOut' },
        { header: 'Hours', dataKey: 'hoursWorked' },
        { header: 'OT', dataKey: 'overtime' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Remarks', dataKey: 'remarks' }
      ];
      
      // Summary calculations
      const totalHours = employeeRecords.reduce((sum: number, record: any) => 
        sum + (parseFloat(record.hoursWorked) || 0), 0);
      
      const totalOvertime = employeeRecords.reduce((sum: number, record: any) => 
        sum + (parseFloat(record.overtime) || 0), 0);
      
      const presentDays = employeeRecords.filter((record: any) => 
        record.status === 'Present').length;
      
      const absentDays = employeeRecords.filter((record: any) => 
        record.status === 'Absent').length;
      
      // Add summary to the report data
      reportData.push(
        { date: '', day: '', timeIn: '', timeOut: '', hoursWorked: '', overtime: '', status: '', remarks: '' },
        { date: 'Summary', day: '', timeIn: '', timeOut: '', hoursWorked: '', overtime: '', status: '', remarks: '' },
        { date: 'Total Days', day: String(employeeRecords.length), timeIn: '', timeOut: '', hoursWorked: '', overtime: '', status: '', remarks: '' },
        { date: 'Present Days', day: String(presentDays), timeIn: '', timeOut: '', hoursWorked: '', overtime: '', status: '', remarks: '' },
        { date: 'Absent Days', day: String(absentDays), timeIn: '', timeOut: '', hoursWorked: '', overtime: '', status: '', remarks: '' },
        { date: 'Total Hours', day: '', timeIn: '', timeOut: '', hoursWorked: totalHours.toFixed(2), overtime: '', status: '', remarks: '' },
        { date: 'Total Overtime', day: '', timeIn: '', timeOut: '', hoursWorked: '', overtime: totalOvertime.toFixed(2), status: '', remarks: '' }
      );
      
      const employeeName = employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`;
      const title = `Daily Time Record (DTR)`;
      const subtitle = `${employeeName} - ${employee.position || 'Employee'} - ${formatDate(startDate, 'MMM dd')} to ${formatDate(endDate, 'MMM dd, yyyy')}`;
      
      // Generate report in the selected format
      if (outputFormat === 'pdf') {
        const doc = generatePDF(reportData, columns, title, subtitle, 'portrait');
        
        // Add employee information on the PDF
        (doc as any).setPage(1);
        doc.setFontSize(12);
        doc.text(`Employee: ${employeeName}`, 14, 40);
        doc.text(`Position: ${employee.position || 'N/A'}`, 14, 46);
        doc.text(`Department: ${employee.department || 'N/A'}`, 14, 52);
        doc.text(`Employee ID: ${employeeId}`, 14, 58);
      } else if (outputFormat === 'excel') {
        generateExcel(reportData, columns, `DTR - ${employeeName}`, title);
      } else if (outputFormat === 'csv') {
        generateCSV(reportData, columns, `DTR - ${employeeName}`);
      }
    });
  };

  // Dashboard metrics
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    totalClients: 0,
    totalSuppliers: 0,
    totalMachinery: 0,
    activeOrders: 0,
    revenueThisMonth: 0,
    expensesThisMonth: 0,
    pendingPayments: 0,
    lowStockItems: 0,
    upcomingMaintenance: 0
  });

  // List of available reports with their generation functions
  const reportTypes: ReportType[] = [
    {
      id: 'sales_summary',
      name: 'Sales Summary',
      description: 'Summary of all sales transactions within the selected period',
      icon: <MoneyIcon color="primary" />,
      availableFormats: ['pdf', 'excel', 'csv'],
      generateReport: generateSalesSummaryReport
    },
    {
      id: 'inventory',
      name: 'Inventory Status Report',
      description: 'Current inventory levels, reorder suggestions, and inventory movements',
      icon: <InventoryIcon color="primary" />,
      availableFormats: ['pdf', 'excel', 'csv'],
      generateReport: generateInventoryReport
    },
    {
      id: 'employee_attendance',
      name: 'Employee Attendance',
      description: 'Employee attendance records and summary for the selected period',
      icon: <PeopleIcon color="primary" />,
      availableFormats: ['pdf', 'excel', 'csv'],
      generateReport: generateAttendanceReport
    },
    {
      id: 'machinery_maintenance',
      name: 'Machinery Maintenance',
      description: 'Report on machinery maintenance activities and upcoming maintenance schedules',
      icon: <BuildIcon color="primary" />,
      availableFormats: ['pdf', 'excel', 'csv'],
      generateReport: generateMachineryReport
    },
    {
      id: 'payroll',
      name: 'Payroll Report',
      description: 'Employee payroll information including overtime, bonuses, and deductions',
      icon: <ReceiptIcon color="primary" />,
      availableFormats: ['pdf', 'excel', 'csv'],
      generateReport: generatePayrollReport
    },
    {
      id: 'dtr',
      name: 'Daily Time Record (DTR)',
      description: 'Individual employee daily time records with attendance summary',
      icon: <CalendarIcon color="primary" />,
      availableFormats: ['pdf', 'excel', 'csv'],
      generateReport: generateDTR
    }
  ];

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get current month data
      const startDate = formatDate(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = formatDate(endOfMonth(new Date()), 'yyyy-MM-dd');
      
      // Fetch all data for dashboard
      await Promise.all([
        dispatch(fetchEmployees()),
        dispatch(fetchClients()),
        dispatch(fetchSuppliers()),
        dispatch(fetchMachinery({})),
        dispatch(fetchMachineryStats()),
        dispatch(fetchClientOrders()),
        dispatch(fetchInventory()),
        dispatch(fetchPayrolls({ startDate, endDate })),
        dispatch(fetchAttendance({ startDate, endDate }))
      ]);
      
      // Update dashboard data
      updateDashboardData();
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      showSnackbar(error.message || 'Failed to load dashboard data', 'error');
      setLoading(false);
    }
  }, [dispatch, showSnackbar]);

  const updateDashboardData = () => {
    // Calculate dashboard metrics from the fetched data
    const employees = employeesState.employees || [];
    const clients = clientsState.clients || [];
    const suppliers = suppliersState.suppliers || [];
    const machinery = machineryState.machinery || [];
    const clientOrders = clientOrdersState.clientOrders || [];
    const supplierOrders = supplierOrdersState.supplierOrders || [];
    const inventory = inventoryState.inventory || [];
    
    // Calculate active orders
    const activeOrders = clientOrders.filter((order: any) => 
      order.status !== 'Completed' && order.status !== 'Cancelled'
    ).length;
    
    // Calculate revenue this month from completed orders
    const revenueThisMonth = clientOrders.reduce((sum: number, order: any) => {
      if (order.status === 'Completed' || order.status === 'Delivered') {
        return sum + (order.totalAmount || 0);
      }
      return sum;
    }, 0);
    
    // Calculate expenses this month from supplier orders and payroll
    const supplierExpenses = supplierOrders.reduce((sum: number, order: any) => 
      sum + (order.totalAmount || 0), 0);
    
    const payrollExpenses = (payrollState.payrollRecords || []).reduce((sum: number, record: any) => 
      sum + (record.netSalary || 0), 0);
    
    const expensesThisMonth = supplierExpenses + payrollExpenses;
    
    // Calculate pending payments
    const pendingPayments = clientOrders.reduce((sum: number, order: any) => {
      if (order.paymentStatus === 'Pending' || order.paymentStatus === 'Partial') {
        return sum + (order.totalAmount - (order.amountPaid || 0));
      }
      return sum;
    }, 0);
    
    // Count low stock items
    const lowStockItems = inventory.filter((item: any) => 
      item.currentStock <= item.reorderLevel
    ).length;
    
    // Count machinery needing maintenance
    const today = new Date();
    const nextMonth = addMonths(today, 1);
    
    const upcomingMaintenance = machinery.filter((machine: any) => {
      if (!machine.nextMaintenanceDate) return false;
      const nextMaintenanceDate = parseISO(machine.nextMaintenanceDate);
      return isWithinInterval(nextMaintenanceDate, { start: today, end: nextMonth });
    }).length;
    
    // Update dashboard data
    setDashboardData({
      totalEmployees: employees.length,
      totalClients: clients.length,
      totalSuppliers: suppliers.length,
      totalMachinery: machinery.length,
      activeOrders,
      revenueThisMonth,
      expensesThisMonth,
      pendingPayments,
      lowStockItems,
      upcomingMaintenance
    });
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleFilterChange = (field: keyof ReportFilter, value: any) => {
    setReportFilters({
      ...reportFilters,
      [field]: value
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate') => (date: Date | null) => {
    if (date) {
      setReportFilters({
        ...reportFilters,
        [field]: date
      });
    }
  };

  const handleGenerateReport = (reportType: string) => {
    const selectedReport = reportTypes.find(report => report.id === reportType);
    
    if (!selectedReport) {
      showSnackbar('Invalid report type selected', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      // Gather all necessary data for the report
      const reportData = {
        clientOrders: clientOrdersState.clientOrders || [],
        supplierOrders: supplierOrdersState.supplierOrders || [],
        inventory: inventoryState.inventory || [],
        employees: employeesState.employees || [],
        machinery: machineryState.machinery || [],
        machineryStats: machineryState.stats || {},
        attendance: attendanceState.attendance || [],
        payrollRecords: payrollState.payrollRecords || [],
        clients: clientsState.clients || [],
        suppliers: suppliersState.suppliers || []
      };
      
      // Call the report generation function
      selectedReport.generateReport(
        reportData,
        reportFilters.format as 'pdf' | 'excel' | 'csv',
        reportFilters.startDate,
        reportFilters.endDate
      );
      
      setLoading(false);
      showSnackbar(`${selectedReport.name} generated successfully.`, 'success');
    } catch (error: any) {
      console.error('Error generating report:', error);
      setLoading(false);
      showSnackbar(`Failed to generate report: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  const handleGenerateSelectedReport = () => {
    if (reportFilters.type === 'all') {
      showSnackbar('Please select a report type', 'error');
      return;
    }
    
    handleGenerateReport(reportFilters.type);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Reports & Document Generation
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={fetchData}
        >
          Refresh Data
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="reports tabs">
          <Tab icon={<DashboardIcon />} label="Dashboard" />
          <Tab icon={<ReportIcon />} label="Generate Reports" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Employees
                      </Typography>
                      <Typography variant="h4" color="primary.main">
                        {dashboardData.totalEmployees}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Active Orders
                      </Typography>
                      <Typography variant="h4" color="primary.main">
                        {dashboardData.activeOrders}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Low Stock Items
                      </Typography>
                      <Typography variant="h4" color={dashboardData.lowStockItems > 0 ? 'error.main' : 'primary.main'}>
                        {dashboardData.lowStockItems}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Machinery Due Maintenance
                      </Typography>
                      <Typography variant="h4" color={dashboardData.upcomingMaintenance > 0 ? 'warning.main' : 'primary.main'}>
                        {dashboardData.upcomingMaintenance}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Financial Overview (Current Month)" />
                    <Divider />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Revenue
                          </Typography>
                          <Typography variant="h5" color="success.main">
                            {formatCurrency(dashboardData.revenueThisMonth)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Expenses
                          </Typography>
                          <Typography variant="h5" color="error.main">
                            {formatCurrency(dashboardData.expensesThisMonth)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle2" color="text.secondary">
                            Profit/Loss
                          </Typography>
                          <Typography 
                            variant="h5" 
                            color={dashboardData.revenueThisMonth - dashboardData.expensesThisMonth >= 0 ? 'success.main' : 'error.main'}
                          >
                            {formatCurrency(dashboardData.revenueThisMonth - dashboardData.expensesThisMonth)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle2" color="text.secondary">
                            Pending Payments
                          </Typography>
                          <Typography variant="h5" color="warning.main">
                            {formatCurrency(dashboardData.pendingPayments)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Business Overview" />
                    <Divider />
                    <CardContent>
                      <List>
                        <ListItem divider>
                          <ListItemText 
                            primary="Clients" 
                            secondary={`${dashboardData.totalClients} registered clients`} 
                          />
                          <Chip label={dashboardData.totalClients} color="primary" />
                        </ListItem>
                        
                        <ListItem divider>
                          <ListItemText 
                            primary="Suppliers" 
                            secondary={`${dashboardData.totalSuppliers} registered suppliers`} 
                          />
                          <Chip label={dashboardData.totalSuppliers} color="primary" />
                        </ListItem>
                        
                        <ListItem divider>
                          <ListItemText 
                            primary="Machinery" 
                            secondary={`${dashboardData.totalMachinery} registered machinery`} 
                          />
                          <Chip label={dashboardData.totalMachinery} color="primary" />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemText 
                            primary="Orders This Month" 
                            secondary="Client orders for the current month" 
                          />
                          <Chip 
                            label={(clientOrdersState.clientOrders || []).length} 
                            color="primary" 
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card>
                    <CardHeader 
                      title="Quick Reports" 
                      subheader="Generate common reports with a single click" 
                    />
                    <Divider />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Button 
                            variant="outlined" 
                            startIcon={<PdfIcon />}
                            fullWidth
                            onClick={() => handleGenerateReport('sales_summary')}
                            sx={{ py: 1 }}
                          >
                            Monthly Sales Report
                          </Button>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Button 
                            variant="outlined" 
                            startIcon={<PdfIcon />}
                            fullWidth
                            onClick={() => handleGenerateReport('inventory')}
                            sx={{ py: 1 }}
                          >
                            Inventory Status Report
                          </Button>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Button 
                            variant="outlined" 
                            startIcon={<PdfIcon />}
                            fullWidth
                            onClick={() => handleGenerateReport('dtr')}
                            sx={{ py: 1 }}
                          >
                            Generate DTR
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Report Generation
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Start Date"
                        value={reportFilters.startDate}
                        onChange={handleDateChange('startDate')}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="End Date"
                        value={reportFilters.endDate}
                        onChange={handleDateChange('endDate')}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="report-type-label">Report Type</InputLabel>
                      <Select
                        labelId="report-type-label"
                        value={reportFilters.type}
                        label="Report Type"
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                      >
                        <MenuItem value="all">Select Report Type</MenuItem>
                        {reportTypes.map((report) => (
                          <MenuItem key={report.id} value={report.id}>
                            {report.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="report-format-label">Report Format</InputLabel>
                      <Select
                        labelId="report-format-label"
                        value={reportFilters.format}
                        label="Report Format"
                        onChange={(e) => handleFilterChange('format', e.target.value as 'pdf' | 'excel' | 'csv')}
                      >
                        <MenuItem value="pdf">PDF</MenuItem>
                        <MenuItem value="excel">Excel</MenuItem>
                        <MenuItem value="csv">CSV</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button 
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={handleGenerateSelectedReport}
                      disabled={reportFilters.type === 'all' || loading}
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Selected Report'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Report Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Available Formats</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportTypes.map(report => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {report.icon}
                            <Typography sx={{ ml: 1 }}>
                              {report.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{report.description}</TableCell>
                        <TableCell>
                          <Box>
                            {report.availableFormats.includes('pdf') && (
                              <Chip 
                                icon={<PdfIcon />} 
                                label="PDF" 
                                size="small" 
                                sx={{ mr: 0.5 }} 
                              />
                            )}
                            {report.availableFormats.includes('excel') && (
                              <Chip 
                                icon={<ExcelIcon />} 
                                label="Excel" 
                                size="small" 
                                sx={{ mr: 0.5 }} 
                              />
                            )}
                            {report.availableFormats.includes('csv') && (
                              <Chip 
                                icon={<ExcelIcon />} 
                                label="CSV" 
                                size="small" 
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleGenerateReport(report.id)}
                            disabled={loading}
                          >
                            {loading && reportFilters.type === report.id ? 
                              <CircularProgress size={20} color="inherit" /> : 'Generate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportsList;