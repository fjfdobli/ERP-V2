import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, TextField, InputAdornment, CircularProgress, Dialog, DialogTitle, DialogContent, 
  DialogActions, Grid, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, 
  Chip, Tooltip, Tabs, Tab, Divider, Card, CardContent, 
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { 
  Add as AddIcon, Search as SearchIcon, Refresh as RefreshIcon, 
  ExpandMore as ExpandMoreIcon, ListAlt as ListAltIcon, PersonOutline as PersonOutlineIcon,
  ReceiptLong as ReceiptLongIcon, EditNote as EditNoteIcon, MonetizationOn as MonetizationOnIcon,
  PictureAsPdf as PictureAsPdfIcon, AccountBalanceWallet as AccountBalanceWalletIcon,
  Edit as EditIcon, Delete as DeleteIcon, CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon, CreditCard as CreditCardIcon, AttachMoney as AttachMoneyIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { 
  fetchPayrolls, createPayroll, updatePayroll, deletePayroll, bulkCreatePayroll 
} from '../redux/slices/payrollSlice';
import { fetchEmployees } from '../redux/slices/employeesSlice';
import { Payroll as PayrollType, PayrollFilters } from '../services/payrollService';
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Employee } from '../services/employeesService';
import { fetchAttendance } from '../redux/slices/attendanceSlice';
import { calculateBaseSalary, calculateOvertimePay, calculateNetSalary } from '../services/utils/payrollUtils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { autoTable } from 'jspdf-autotable';
import { Attendance } from '../services/attendanceService';

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
      id={`payroll-tabpanel-${index}`}
      aria-labelledby={`payroll-tab-${index}`}
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

interface PayrollFormData {
  employeeId: number | string;
  period: string; // YYYY-MM
  startDate: Date;
  endDate: Date;
  baseSalary: number;
  overtimePay: number;
  bonus: number;
  deductions: number;
  taxWithholding: number;
  status: 'Draft' | 'Pending' | 'Approved' | 'Paid';
  notes: string;
  bankTransferRef: string;
  paymentDate: Date | null;
}

interface BulkPayrollRow {
  employeeId: number;
  employeeName: string;
  baseSalary: number;
  overtimePay: number;
  bonus: number;
  deductions: number;
  taxWithholding: number;
  include: boolean;
}

const PayrollPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { payrollRecords, isLoading: payrollLoading } = useAppSelector((state: any) => state.payroll || { payrollRecords: [], isLoading: false });
  const { employees, isLoading: employeesLoading } = useAppSelector((state: any) => state.employees);
  const { attendanceRecords, isLoading: attendanceLoading } = useAppSelector((state: any) => state.attendance || { attendanceRecords: [], isLoading: false });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [bulkPayrollDate, setBulkPayrollDate] = useState<Date>(new Date());
  const [bulkPayrollData, setBulkPayrollData] = useState<BulkPayrollRow[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollType | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<PayrollFilters>({
    period: format(new Date(), 'yyyy-MM'),
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  
  const [formData, setFormData] = useState<PayrollFormData>({
    employeeId: '',
    period: format(new Date(), 'yyyy-MM'),
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    baseSalary: 0,
    overtimePay: 0,
    bonus: 0,
    deductions: 0,
    taxWithholding: 0,
    status: 'Draft',
    notes: '',
    bankTransferRef: '',
    paymentDate: null
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

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await dispatch(fetchEmployees()).unwrap();
      await dispatch(fetchPayrolls(filters)).unwrap();
      
      // Also fetch attendance data for the current period
      if (filters.startDate && filters.endDate) {
        await dispatch(fetchAttendance({
          startDate: filters.startDate,
          endDate: filters.endDate
        })).unwrap();
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      showSnackbar(error.message || 'Failed to load data', 'error');
      setLoading(false);
    }
  }, [dispatch, filters, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (payroll?: PayrollType) => {
    if (payroll) {
      setSelectedPayroll(payroll);
      
      setFormData({
        employeeId: payroll.employeeId,
        period: payroll.period,
        startDate: parseISO(payroll.startDate),
        endDate: parseISO(payroll.endDate),
        baseSalary: payroll.baseSalary,
        overtimePay: payroll.overtimePay,
        bonus: payroll.bonus,
        deductions: payroll.deductions,
        taxWithholding: payroll.taxWithholding,
        status: payroll.status as any,
        notes: payroll.notes || '',
        bankTransferRef: payroll.bankTransferRef || '',
        paymentDate: payroll.paymentDate ? parseISO(payroll.paymentDate) : null
      });
    } else {
      setSelectedPayroll(null);
      setFormData({
        employeeId: '',
        period: format(new Date(), 'yyyy-MM'),
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
        baseSalary: 0,
        overtimePay: 0,
        bonus: 0,
        deductions: 0,
        taxWithholding: 0,
        status: 'Draft',
        notes: '',
        bankTransferRef: '',
        paymentDate: null
      });
    }
    setOpenDialog(true);
    setIsBulkMode(false);
  };

  const handleOpenBulkDialog = () => {
    // Initialize bulk payroll data with all active employees
    if (employees && employees.length > 0) {
      const initialData: BulkPayrollRow[] = employees
        .filter((emp: any) => emp.status !== 'Inactive')
        .map((emp: any) => {
          const salary = typeof emp.salary === 'number' ? emp.salary : 0;
          const employeeId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id;
          
          // Calculate overtime from attendance records
          const overtimePay = calculateOvertimePay(
            attendanceRecords.filter((record: Attendance) => record.employeeId === employeeId),
            salary / 176, // hourly rate (22 days × 8 hours)
            filters.startDate || format(startOfMonth(new Date()), 'yyyy-MM-dd'),
            filters.endDate || format(endOfMonth(new Date()), 'yyyy-MM-dd'),
            1.25 // 25% overtime premium
          );
          
          // Calculate base salary from attendance records
          const baseSalary = calculateBaseSalary(
            attendanceRecords.filter((record: Attendance) => record.employeeId === employeeId),
            salary / 22, // daily rate
            filters.startDate || format(startOfMonth(new Date()), 'yyyy-MM-dd'),
            filters.endDate || format(endOfMonth(new Date()), 'yyyy-MM-dd')
          );
          
          return {
            employeeId,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            baseSalary: Math.round(baseSalary * 100) / 100,
            overtimePay: Math.round(overtimePay * 100) / 100,
            bonus: 0,
            deductions: Math.round(salary * 0.045 * 100) / 100, // 4.5% SSS
            taxWithholding: Math.round(salary * 0.1 * 100) / 100, // 10% tax
            include: true
          };
        });
      
      setBulkPayrollData(initialData);
    }
    
    setBulkPayrollDate(new Date());
    setIsBulkMode(true);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPayroll(null);
    setIsBulkMode(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Salary') || 
              name.includes('Pay') || 
              name.includes('bonus') || 
              name.includes('deductions') || 
              name.includes('tax') 
              ? Number(value) 
              : value
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'employeeId' && employees) {
        const selectedEmployee = employees.find((emp: any) => Number(emp.id) === Number(value));
        if (selectedEmployee) {
          const employeeId = typeof selectedEmployee.id === 'string' ? parseInt(selectedEmployee.id) : selectedEmployee.id;
          const salary = selectedEmployee.salary || 0;
          
          // Calculate overtime from attendance records
          const overtimePay = calculateOvertimePay(
            attendanceRecords.filter((record: Attendance) => record.employeeId === employeeId),
            salary / 176, // hourly rate (22 days × 8 hours)
            format(prev.startDate, 'yyyy-MM-dd'),
            format(prev.endDate, 'yyyy-MM-dd'),
            1.25 // 25% overtime premium
          );
          
          // Calculate base salary from attendance records
          const baseSalary = calculateBaseSalary(
            attendanceRecords.filter((record: Attendance) => record.employeeId === employeeId),
            salary / 22, // daily rate
            format(prev.startDate, 'yyyy-MM-dd'),
            format(prev.endDate, 'yyyy-MM-dd')
          );
          
          return {
            ...prev,
            [name]: value,
            baseSalary: Math.round(baseSalary * 100) / 100,
            overtimePay: Math.round(overtimePay * 100) / 100,
            deductions: Math.round(salary * 0.045 * 100) / 100, // 4.5% SSS
            taxWithholding: Math.round(salary * 0.1 * 100) / 100 // 10% tax
          };
        }
      }
      return { ...prev, [name]: value };
    });
  };

  const handleDateChange = (name: 'startDate' | 'endDate' | 'paymentDate') => (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [name]: date
      }));

      // If changing start or end date, also update period and recalculate values
      if (name === 'startDate' || name === 'endDate') {
        setFormData((prev) => {
          const newStartDate = name === 'startDate' ? date : prev.startDate;
          // Removed redundant line as newEndDate is already handled elsewhere

          // Update period based on start date
          const newPeriod = format(formData.startDate, 'yyyy-MM');

          // Recalculate values if employee is selected
          if (prev.employeeId && employees) {
            const selectedEmployee = employees.find((emp: any) => 
              Number(emp.id) === Number(prev.employeeId)
            );

            if (selectedEmployee) {
              const employeeId = typeof selectedEmployee.id === 'string' ? 
                parseInt(selectedEmployee.id) : selectedEmployee.id;
              const salary = selectedEmployee.salary || 0;

              // Calculate overtime from attendance records
              const overtimePay = calculateOvertimePay(
                attendanceRecords.filter((record: Attendance) => record.employeeId === employeeId),
                salary / 176, // hourly rate
                format(prev.startDate, 'yyyy-MM-dd'),
                format(newEndDate, 'yyyy-MM-dd'),
                1.25 // 25% overtime premium
              );

              // Calculate base salary from attendance records
              const baseSalary = calculateBaseSalary(
                attendanceRecords.filter((record: Attendance) => record.employeeId === employeeId),
                salary / 22, // daily rate
                format(prev.startDate, 'yyyy-MM-dd'),
                format(newEndDate, 'yyyy-MM-dd')
              );

              return {
                ...prev,
                period: newPeriod,
                startDate: name === 'startDate' ? date : formData.startDate,
                endDate: newEndDate,
                baseSalary: Math.round(baseSalary * 100) / 100,
                overtimePay: Math.round(overtimePay * 100) / 100
              };
            }
          }

          return {
            ...prev,
            period: newPeriod,
            startDate: prev.startDate,
            endDate: newEndDate
          };
        });
        const newEndDate = name === 'endDate' ? date : formData.endDate;
        
        // Update period based on start date
        const newPeriod = format(formData.startDate, 'yyyy-MM');
        
        setFormData(prev => {
          // Recalculate values if employee is selected
          if (prev.employeeId && employees) {
            const selectedEmployee = employees.find((emp: any) => 
              Number(emp.id) === Number(prev.employeeId)
            );
            
            if (selectedEmployee) {
              const employeeId = typeof selectedEmployee.id === 'string' ? 
                parseInt(selectedEmployee.id) : selectedEmployee.id;
              const salary = selectedEmployee.salary || 0;
              
              // Calculate overtime from attendance records
              const overtimePay = calculateOvertimePay(
                attendanceRecords.filter((record: Attendance) => record.employeeId === employeeId),
                salary / 176, // hourly rate
                format(prev.startDate, 'yyyy-MM-dd'),
                format(newEndDate, 'yyyy-MM-dd'),
                1.25 // 25% overtime premium
              );
              
              // Calculate base salary from attendance records
              const baseSalary = calculateBaseSalary(
                attendanceRecords.filter((record: Attendance) => record.employeeId === employeeId),
                salary / 22, // daily rate
                format(prev.startDate, 'yyyy-MM-dd'),
                format(newEndDate, 'yyyy-MM-dd')
              );
              
              return {
                ...prev,
                period: newPeriod,
                startDate: prev.startDate,
                endDate: newEndDate,
                baseSalary: Math.round(baseSalary * 100) / 100,
                overtimePay: Math.round(overtimePay * 100) / 100
              };
            }
          }
          
          return {
            ...prev,
            period: newPeriod,
            startDate: name === 'startDate' ? date : prev.startDate,
            endDate: newEndDate
          };
        });
      }
    }
  };

  const handleBulkDateChange = (date: Date | null) => {
    if (date) {
      setBulkPayrollDate(date);
      
      // Update period and date ranges for bulk entry
      const newStartDate = startOfMonth(date);
      const newEndDate = endOfMonth(date);
      
      setFormData(prev => ({
        ...prev,
        period: format(date, 'yyyy-MM'),
        startDate: newStartDate,
        endDate: newEndDate
      }));
      
      // Recalculate bulk payroll data
      if (employees && employees.length > 0 && bulkPayrollData.length > 0) {
        const updatedData = bulkPayrollData.map(row => {
          const employee = employees.find((emp: any) => Number(emp.id) === row.employeeId);
          if (!employee) return row;
          
          const salary = employee.salary || 0;
          
          // Calculate overtime from attendance records
          const overtimePay = calculateOvertimePay(
            attendanceRecords.filter((record: Attendance) => 
              record.employeeId === row.employeeId
            ),
            salary / 176, // hourly rate
            format(newStartDate, 'yyyy-MM-dd'),
            format(newEndDate, 'yyyy-MM-dd'),
            1.25 // 25% overtime premium
          );
          
          // Calculate base salary from attendance records
          const baseSalary = calculateBaseSalary(
            attendanceRecords.filter((record: Attendance) => 
              record.employeeId === row.employeeId
            ),
            salary / 22, // daily rate
            format(newStartDate, 'yyyy-MM-dd'),
            format(newEndDate, 'yyyy-MM-dd')
          );
          
          return {
            ...row,
            baseSalary: Math.round(baseSalary * 100) / 100,
            overtimePay: Math.round(overtimePay * 100) / 100
          };
        });
        
        setBulkPayrollData(updatedData);
      }
    }
  };

  const handleBulkInputChange = (index: number, field: keyof BulkPayrollRow, value: any) => {
    const updatedData = [...bulkPayrollData];
    updatedData[index] = {
      ...updatedData[index],
      [field]: field === 'include' ? value : Number(value)
    };
    
    setBulkPayrollData(updatedData);
  };

  const handleFilterChange = (name: keyof PayrollFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePeriodChange = (date: Date | null) => {
    if (date) {
      const period = format(date, 'yyyy-MM');
      const newStartDate = format(startOfMonth(date), 'yyyy-MM-dd');
      const newEndDate = format(endOfMonth(date), 'yyyy-MM-dd');
      
      setFilters({
        period,
        startDate: newStartDate,
        endDate: newEndDate
      });
    }
  };

  const getNetSalary = (baseSalary: number, overtimePay: number, bonus: number, deductions: number, taxWithholding: number) => {
    return baseSalary + overtimePay + bonus - deductions - taxWithholding;
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      if (isBulkMode) {
        // Handle bulk payroll submission
        const payrollRecords = bulkPayrollData
          .filter(row => row.include)
          .map(row => {
            const netSalary = getNetSalary(
              row.baseSalary, 
              row.overtimePay, 
              row.bonus,
              row.deductions,
              row.taxWithholding
            );
            
            return {
              employeeId: row.employeeId,
              period: format(bulkPayrollDate, 'yyyy-MM'),
              startDate: format(startOfMonth(bulkPayrollDate), 'yyyy-MM-dd'),
              endDate: format(endOfMonth(bulkPayrollDate), 'yyyy-MM-dd'),
              baseSalary: row.baseSalary,
              overtimePay: row.overtimePay,
              bonus: row.bonus,
              deductions: row.deductions,
              taxWithholding: row.taxWithholding,
              netSalary,
              status: 'Draft' as const,
              notes: `Payroll for ${format(bulkPayrollDate, 'MMMM yyyy')}`,
              bankTransferRef: null,
              paymentDate: null
            };
          });
        
        await dispatch(bulkCreatePayroll(payrollRecords as any)).unwrap();
        showSnackbar(`Successfully created payroll for ${payrollRecords.length} employees`, 'success');
      } else {
        // Handle single payroll record
        const { 
          employeeId, period, startDate, endDate, baseSalary, 
          overtimePay, bonus, deductions, taxWithholding,
          status, notes, bankTransferRef, paymentDate
        } = formData;
        
        if (!employeeId) {
          showSnackbar('Please select an employee', 'error');
          setLoading(false);
          return;
        }
        
        const netSalary = getNetSalary(
          baseSalary, 
          overtimePay, 
          bonus,
          deductions,
          taxWithholding
        );
        
        const payrollData = {
          employeeId: Number(employeeId),
          period,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          baseSalary,
          overtimePay,
          bonus,
          deductions,
          taxWithholding,
          netSalary,
          status,
          notes: notes || null,
          bankTransferRef: bankTransferRef || null,
          paymentDate: paymentDate ? format(paymentDate, 'yyyy-MM-dd') : null
        };
        
        if (selectedPayroll) {
          await dispatch(updatePayroll({ id: selectedPayroll.id, data: payrollData as any })).unwrap();
          showSnackbar('Payroll record updated successfully', 'success');
        } else {
          await dispatch(createPayroll(payrollData as any)).unwrap();
          showSnackbar('Payroll record created successfully', 'success');
        }
      }
      
      handleCloseDialog();
      fetchData();
    } catch (error: any) {
      console.error('Error saving payroll:', error);
      showSnackbar(error.message || 'Failed to save payroll record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      setLoading(true);
      try {
        await dispatch(deletePayroll(id)).unwrap();
        showSnackbar('Payroll record deleted successfully', 'success');
        fetchData();
      } catch (error: any) {
        console.error('Error deleting payroll:', error);
        showSnackbar(error.message || 'Failed to delete payroll record', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChangePayrollStatus = async (id: number, newStatus: 'Draft' | 'Pending' | 'Approved' | 'Paid') => {
    setLoading(true);
    try {
      let paymentDate = null;
      if (newStatus === 'Paid') {
        paymentDate = format(new Date(), 'yyyy-MM-dd');
      }
      
      await dispatch(updatePayroll({ 
        id, 
        data: { 
          status: newStatus,
          paymentDate
        } 
      })).unwrap();
      
      showSnackbar(`Payroll status updated to ${newStatus}`, 'success');
      fetchData();
    } catch (error: any) {
      console.error('Error updating payroll status:', error);
      showSnackbar(error.message || 'Failed to update payroll status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Simple client-side filtering based on searchTerm
    console.log("Searching for:", searchTerm);
  };

  const getStatusChip = (status: string) => {
    let color: 'default' | 'success' | 'error' | 'warning' | 'info' = 'default';
    let icon = null;
    
    switch (status) {
      case 'Draft':
        color = 'default';
        icon = <EditNoteIcon fontSize="small" />;
        break;
      case 'Pending':
        color = 'warning';
        icon = <ScheduleIcon fontSize="small" />;
        break;
      case 'Approved':
        color = 'info';
        icon = <CheckCircleIcon fontSize="small" />;
        break;
      case 'Paid':
        color = 'success';
        icon = <CreditCardIcon fontSize="small" />;
        break;
    }
    
    return (
      <Chip 
        label={status}
        color={color}
        size="small"
        variant="outlined"
        icon={icon as React.ReactElement}
      />
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees?.find((emp: any) => Number(emp.id) === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  };

  const getEmployeeDetails = (employeeId: number) => {
    return employees?.find((emp: any) => Number(emp.id) === employeeId);
  };

  // PDF Generation Functions
  const generatePayslipPDF = (payroll: PayrollType) => {
    const employee = getEmployeeDetails(payroll.employeeId);
    if (!employee) {
      showSnackbar('Employee details not found', 'error');
      return;
    }

    // Create the document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Company Logo and Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("Opzon's Printers", pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Lanang, Davao city, Philippines", pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    doc.text("Tel: (02) 8123-4567 | Email: payroll@printingpress.com", pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Document Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(35, 87, 137);
    doc.text("EMPLOYEE PAYSLIP", pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Border for the entire document
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(margin, margin - 10, pageWidth - 2 * margin, yPos + 140);
    
    // Employee Information Section
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 40, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("EMPLOYEE DETAILS", margin + 5, yPos + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Employee Name:`, margin + 5, yPos + 16);
    doc.text(`${employee.firstName} ${employee.lastName}`, margin + 60, yPos + 16);
    
    doc.text(`Employee ID:`, margin + 5, yPos + 24);
    doc.text(`${employee.employeeId || '---'}`, margin + 60, yPos + 24);
    
    doc.text(`Position:`, margin + 5, yPos + 32);
    doc.text(`${employee.position || '---'}`, margin + 60, yPos + 32);
    
    doc.text(`Pay Period:`, pageWidth - margin - 80, yPos + 16);
    doc.text(`${format(parseISO(payroll.startDate), 'MM/dd/yyyy')} - ${format(parseISO(payroll.endDate), 'MM/dd/yyyy')}`, pageWidth - margin - 30, yPos + 16);
    
    doc.text(`Payroll Date:`, pageWidth - margin - 80, yPos + 24);
    doc.text(`${payroll.paymentDate ? format(parseISO(payroll.paymentDate), 'MM/dd/yyyy') : '---'}`, pageWidth - margin - 30, yPos + 24);
    
    doc.text(`Status:`, pageWidth - margin - 80, yPos + 32);
    doc.text(`${payroll.status}`, pageWidth - margin - 30, yPos + 32);
    
    yPos += 50;
    
    // Earnings Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("EARNINGS", margin + 5, yPos);
    // Earnings Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("EARNINGS", margin + 5, yPos);
    yPos += 5;
    
    // Earnings Table
    const earningsData = [
      ["Description", "Amount"],
      ["Basic Salary", formatCurrency(payroll.baseSalary)],
      ["Overtime Pay", formatCurrency(payroll.overtimePay)],
      ["Bonus", formatCurrency(payroll.bonus)],
      ["Gross Pay", formatCurrency(payroll.baseSalary + payroll.overtimePay + payroll.bonus)]
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [earningsData[0]],
      body: earningsData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: [220, 230, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      margin: { left: margin + 5, right: margin + 5 },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'auto',
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 150 },
        1: { halign: 'right' }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Deductions Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("DEDUCTIONS", margin + 5, yPos);
    yPos += 5;
    
    // Deductions Table
    const deductionsData = [
      ["Description", "Amount"],
      ["Standard Deductions", formatCurrency(payroll.deductions)],
      ["Tax Withholding", formatCurrency(payroll.taxWithholding)],
      ["Total Deductions", formatCurrency(payroll.deductions + payroll.taxWithholding)]
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [deductionsData[0]],
      body: deductionsData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: [220, 230, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      margin: { left: margin + 5, right: margin + 5 },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'auto',
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 150 },
        1: { halign: 'right' }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Net Pay Section
    doc.setFillColor(220, 230, 240);
    doc.rect(margin + 5, yPos, pageWidth - 2 * margin - 10, 20, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("NET PAY:", margin + 15, yPos + 12);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 100, 0);
    doc.text(formatCurrency(payroll.netSalary), pageWidth - margin - 30, yPos + 12, { align: 'right' });
    
    // Reset color
    doc.setTextColor(0, 0, 0);
    
    yPos += 30;
    
    // Additional Information
    if (payroll.bankTransferRef) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Bank Transfer Reference: ${payroll.bankTransferRef}`, margin + 5, yPos);
      yPos += 6;
    }
    
    if (payroll.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Notes: ${payroll.notes}`, margin + 5, yPos);
      yPos += 6;
    }
    
    yPos += 10;
    
    // Footer with signatures
    doc.line(margin + 20, yPos, margin + 80, yPos);
    doc.line(pageWidth - margin - 80, yPos, pageWidth - margin - 20, yPos);
    
    doc.setFontSize(9);
    doc.text("Prepared by", margin + 20, yPos + 5, { align: 'left' });
    doc.text("Received by", pageWidth - margin - 80, yPos + 5, { align: 'left' });
    
    // Disclaimer at bottom
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text("This is a computer-generated document and does not require a signature.", pageWidth / 2, pageHeight - 20, { align: 'center' });
    
    // Save the PDF with the employee name and period
    const fileName = `Payslip_${employee.lastName}_${employee.firstName}_${payroll.period}.pdf`;
    doc.save(fileName);
  };

  // Generate period summary PDF report
  const generatePeriodReport = (period: string, summary: any) => {
    // Create the document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Company Logo and Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("Opzon's Printers", pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Lanang, Davao City, Philippines", pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    doc.text("Tel: (02) 8123-4567 | Email: payroll@printingpress.com", pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Document Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(35, 87, 137);
    doc.text("PAYROLL SUMMARY REPORT", pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    // Period subtitle
    doc.setFontSize(12);
    doc.text(`Period: ${format(
      new Date(
        Number(period.split('-')[0]),
        Number(period.split('-')[1]) - 1
      ),
      'MMMM yyyy'
    )}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Summary Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 50, 3, 3, 'FD');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("PERIOD SUMMARY", margin + 10, yPos + 10);
    
    // Summary data
    doc.setFont('helvetica', 'normal');
    doc.text(`Start Date: ${format(parseISO(summary.startDate), 'MM/dd/yyyy')}`, margin + 10, yPos + 20);
    doc.text(`End Date: ${format(parseISO(summary.endDate), 'MM/dd/yyyy')}`, margin + 10, yPos + 30);
    doc.text(`Total Employees: ${summary.count}`, margin + 10, yPos + 40);
    
    // Financial summary on the right side
    doc.setFont('helvetica', 'bold');
    doc.text("Total Payroll:", pageWidth - margin - 100, yPos + 20);
    doc.text("Paid Amount:", pageWidth - margin - 100, yPos + 30);
    doc.text("Pending Amount:", pageWidth - margin - 100, yPos + 40);
    
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(summary.total), pageWidth - margin - 10, yPos + 20, { align: 'right' });
    doc.text(formatCurrency(summary.paid), pageWidth - margin - 10, yPos + 30, { align: 'right' });
    doc.text(formatCurrency(summary.pending), pageWidth - margin - 10, yPos + 40, { align: 'right' });
    
    yPos += 60;
    
    // Filter payroll records for this period
    const periodPayrolls = payrollRecords?.filter((record: PayrollType) => record.period === period) || [];
    
    // Employee Details Table
    const tableHeaders = ["Employee", "Base Salary", "Overtime", "Bonus", "Deductions", "Tax", "Net Salary", "Status"];
    const tableData = periodPayrolls.map((record: PayrollType) => [
      getEmployeeName(record.employeeId),
      formatCurrency(record.baseSalary),
      formatCurrency(record.overtimePay),
      formatCurrency(record.bonus),
      formatCurrency(record.deductions),
      formatCurrency(record.taxWithholding),
      formatCurrency(record.netSalary),
      record.status
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [220, 230, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'auto',
        cellPadding: 2,
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { cellWidth: 20 }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Status Summary
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("STATUS SUMMARY", margin, yPos);
    yPos += 8;
    
    // Count payroll records by status
    const statusCounts: Record<string, number> = {
      'Draft': 0,
      'Pending': 0,
      'Approved': 0,
      'Paid': 0
    };
    
    periodPayrolls.forEach((record: PayrollType) => {
      statusCounts[record.status]++;
    });
    
    const statusData = [
      ["Status", "Count"],
      ["Draft", statusCounts.Draft.toString()],
      ["Pending", statusCounts.Pending.toString()],
      ["Approved", statusCounts.Approved.toString()],
      ["Paid", statusCounts.Paid.toString()],
      ["Total", periodPayrolls.length.toString()]
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [statusData[0]],
      body: statusData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: [220, 230, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'auto',
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { halign: 'center' }
      },
      margin: { left: margin, right: margin + 100 }
    });
    
    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text("Generated on: " + format(new Date(), 'MM/dd/yyyy HH:mm:ss'), margin, pageHeight - 20);
    doc.text("Page 1 of 1", pageWidth - margin, pageHeight - 20, { align: 'right' });
    
    // Save the PDF
    const fileName = `Payroll_Summary_${period}.pdf`;
    doc.save(fileName);
  };

  // Filter displayed records based on search term
  const filteredRecords = searchTerm.trim() 
    ? payrollRecords?.filter((record: PayrollType) => {
        const lowerSearch = searchTerm.toLowerCase();
        return (
          (record.employeeName?.toLowerCase().includes(lowerSearch)) ||
          record.status.toLowerCase().includes(lowerSearch) ||
          (record.notes && record.notes.toLowerCase().includes(lowerSearch)) ||
          record.period.includes(lowerSearch)
        );
      })
    : payrollRecords;

  // Group payroll records by period for the summary
  const groupedByPeriod = payrollRecords?.reduce((acc: any, record: PayrollType) => {
    if (!acc[record.period]) {
      acc[record.period] = {
        period: record.period,
        count: 0,
        total: 0,
        paid: 0,
        pending: 0,
        startDate: record.startDate,
        endDate: record.endDate
      };
    }
    
    acc[record.period].count++;
    acc[record.period].total += record.netSalary;
    
    if (record.status === 'Paid') {
      acc[record.period].paid += record.netSalary;
    } else {
      acc[record.period].pending += record.netSalary;
    }
    
    return acc;
  }, {});

  const periodSummaries = groupedByPeriod ? Object.values(groupedByPeriod) : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Payroll
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<ListAltIcon />}
            onClick={handleOpenBulkDialog}
            sx={{ mr: 1 }}
          >
            Bulk Payroll Generation
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Payroll Record
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="payroll management tabs">
          <Tab icon={<ReceiptLongIcon />} label="Payroll Records" />
          <Tab icon={<MonetizationOnIcon />} label="Summary & Reports" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  placeholder="Search employee or status..."
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Pay Period"
                      views={['year', 'month']}
                      value={new Date(Number(filters.period?.split('-')[0] || new Date().getFullYear()), 
                                     Number(filters.period?.split('-')[1] || (new Date().getMonth() + 1).toString()) - 1)}
                      onChange={handlePeriodChange}
                      slotProps={{ textField: { size: 'small', sx: { mr: 1 } } }}
                    />
                  </LocalizationProvider>
                  
                  <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
                    <InputLabel id="status-filter-label">Status</InputLabel>
                    <Select
                      labelId="status-filter-label"
                      value={filters.status || ''}
                      label="Status"
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="Draft">Draft</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Approved">Approved</MenuItem>
                      <MenuItem value="Paid">Paid</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Button 
                    variant="outlined"
                    color="primary"
                    onClick={() => fetchData()}
                    startIcon={<RefreshIcon />}
                  >
                    Apply
                  </Button>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    onClick={() => handlePeriodChange(new Date())}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Current Month
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          {(loading || payrollLoading || employeesLoading) ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Employee</strong></TableCell>
                    <TableCell><strong>Period</strong></TableCell>
                    <TableCell><strong>Base Salary</strong></TableCell>
                    <TableCell><strong>Overtime</strong></TableCell>
                    <TableCell><strong>Bonus</strong></TableCell>
                    <TableCell><strong>Deductions</strong></TableCell>
                    <TableCell><strong>Tax</strong></TableCell>
                    <TableCell><strong>Net Salary</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords && filteredRecords.length > 0 ? (
                    filteredRecords.map((record: PayrollType) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {record.employeeName || getEmployeeName(record.employeeId)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(Number(record.period.split('-')[0]), 
                                           Number(record.period.split('-')[1]) - 1), 
                                 'MMMM yyyy')}
                        </TableCell>
                        <TableCell>{formatCurrency(record.baseSalary)}</TableCell>
                        <TableCell>{formatCurrency(record.overtimePay)}</TableCell>
                        <TableCell>{formatCurrency(record.bonus)}</TableCell>
                        <TableCell>{formatCurrency(record.deductions)}</TableCell>
                        <TableCell>{formatCurrency(record.taxWithholding)}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(record.netSalary)}
                        </TableCell>
                        <TableCell>{getStatusChip(record.status)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleOpenDialog(record)}
                            >
                              Edit
                            </Button>
                            
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
                              startIcon={<DownloadIcon />}
                              onClick={() => generatePayslipPDF(record)}
                            >
                              Payslip
                            </Button>
                            
                            {record.status !== 'Paid' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                onClick={() => handleChangePayrollStatus(record.id, 'Paid')}
                              >
                                Mark Paid
                              </Button>
                            )}
                            
                            {record.status === 'Draft' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleDelete(record.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        No payroll records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Current Period
                  </Typography>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {format(
                      new Date(
                        Number(filters.period?.split('-')[0] || new Date().getFullYear().toString()), 
                        Number(filters.period?.split('-')[1] || (new Date().getMonth() + 1).toString()) - 1
                      ), 
                      'MMMM yyyy'
                    )}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Employee Count: <strong>{employees?.filter((e: any) => e.status !== 'Inactive').length || 0}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Pay Period: <strong>{filters.startDate} to {filters.endDate}</strong>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Current Period Total Payroll
                  </Typography>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {formatCurrency(payrollRecords?.reduce((sum: number, record: PayrollType) => {
                      if (record.period === filters.period) {
                        return sum + record.netSalary;
                      }
                      return sum;
                    }, 0) || 0)}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Paid: <strong>{formatCurrency(payrollRecords?.reduce((sum: number, record: PayrollType) => {
                        if (record.period === filters.period && record.status === 'Paid') {
                          return sum + record.netSalary;
                        }
                        return sum;
                      }, 0) || 0)}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Pending: <strong>{formatCurrency(payrollRecords?.reduce((sum: number, record: PayrollType) => {
                        if (record.period === filters.period && record.status !== 'Paid') {
                          return sum + record.netSalary;
                        }
                        return sum;
                      }, 0) || 0)}</strong>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Year-to-Date Total
                  </Typography>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {formatCurrency(payrollRecords?.reduce((sum: number, record: PayrollType) => {
                      const year = record.period.split('-')[0];
                      if (year === new Date().getFullYear().toString()) {
                        return sum + record.netSalary;
                      }
                      return sum;
                    }, 0) || 0)}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Total Employees Paid: <strong>{
                        new Set(
                          payrollRecords
                            ?.filter((record: PayrollType) => record.period.split('-')[0] === new Date().getFullYear().toString())
                            .map((record: PayrollType) => record.employeeId)
                        ).size || 0
                      }</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Average Monthly Payroll: <strong>{formatCurrency(
                        (payrollRecords?.reduce((sum: number, record: PayrollType) => {
                          const year = record.period.split('-')[0];
                          if (year === new Date().getFullYear().toString()) {
                            return sum + record.netSalary;
                          }
                          return sum;
                        }, 0) || 0) / Math.max(1, periodSummaries.length)
                      )}</strong>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                Period Summaries
              </Typography>
              
              {periodSummaries.length > 0 ? (
                periodSummaries.sort((a: any, b: any) => b.period.localeCompare(a.period))
                  .map((summary: any) => (
                    <Accordion key={summary.period}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Grid container>
                          <Grid item xs={4}>
                            <Typography>
                              <strong>{format(
                                new Date(
                                  summary.period.split('-')[0],
                                  Number(summary.period.split('-')[1]) - 1
                                ),
                                'MMMM yyyy'
                              )}</strong>
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography>
                              Employees: {summary.count}
                            </Typography>
                          </Grid>
                          <Grid item xs={5}>
                            <Typography>
                              Total: {formatCurrency(summary.total)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Period Details</Typography>
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2">
                                Start Date: {format(parseISO(summary.startDate), 'MM/dd/yyyy')}
                              </Typography>
                              <Typography variant="body2">
                                End Date: {format(parseISO(summary.endDate), 'MM/dd/yyyy')}
                              </Typography>
                              <Typography variant="body2">
                                Number of Employees: {summary.count}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Payment Summary</Typography>
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2">
                                Total Payroll: {formatCurrency(summary.total)}
                              </Typography>
                              <Typography variant="body2">
                                Paid Amount: {formatCurrency(summary.paid)}
                              </Typography>
                              <Typography variant="body2">
                                Pending Amount: {formatCurrency(summary.pending)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sx={{ mt: 1 }}>
                            <Button 
                              size="small" 
                              variant="outlined"
                              color="primary"
                              startIcon={<DownloadIcon />}
                              onClick={() => generatePeriodReport(summary.period, summary)}
                            >
                              Generate Period Report
                            </Button>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))
              ) : (
                <Typography variant="body1" color="textSecondary" align="center">
                  No payroll periods to display
                </Typography>
              )}
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Add/Edit Payroll Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth={isBulkMode ? "lg" : "md"} fullWidth>
      <DialogTitle>
          {isBulkMode ? 'Bulk Payroll Generation' : (selectedPayroll ? 'Edit Payroll Record' : 'Add New Payroll Record')}
        </DialogTitle>
        
        <DialogContent>
          {isBulkMode ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ mb: 3, mt: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Pay Period"
                      views={['year', 'month']}
                      value={bulkPayrollDate}
                      onChange={handleBulkDateChange}
                      slotProps={{ textField: { fullWidth: true, helperText: `${format(startOfMonth(bulkPayrollDate), 'MM/dd/yyyy')} - ${format(endOfMonth(bulkPayrollDate), 'MM/dd/yyyy')}` } }}
                    />
                  </LocalizationProvider>
                </Box>
                
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Employee</strong></TableCell>
                        <TableCell><strong>Include</strong></TableCell>
                        <TableCell><strong>Base Salary</strong></TableCell>
                        <TableCell><strong>Overtime Pay</strong></TableCell>
                        <TableCell><strong>Bonus</strong></TableCell>
                        <TableCell><strong>Deductions</strong></TableCell>
                        <TableCell><strong>Tax</strong></TableCell>
                        <TableCell><strong>Net</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bulkPayrollData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.employeeName}</TableCell>
                          <TableCell>
                            <Chip
                              label={row.include ? "Included" : "Excluded"}
                              color={row.include ? "success" : "default"}
                              onClick={() => handleBulkInputChange(index, 'include', !row.include)}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={row.baseSalary}
                              onChange={(e) => handleBulkInputChange(index, 'baseSalary', e.target.value)}
                              disabled={!row.include}
                              size="small"
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={row.overtimePay}
                              onChange={(e) => handleBulkInputChange(index, 'overtimePay', e.target.value)}
                              disabled={!row.include}
                              size="small"
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={row.bonus}
                              onChange={(e) => handleBulkInputChange(index, 'bonus', e.target.value)}
                              disabled={!row.include}
                              size="small"
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={row.deductions}
                              onChange={(e) => handleBulkInputChange(index, 'deductions', e.target.value)}
                              disabled={!row.include}
                              size="small"
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={row.taxWithholding}
                              onChange={(e) => handleBulkInputChange(index, 'taxWithholding', e.target.value)}
                              disabled={!row.include}
                              size="small"
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(
                                row.baseSalary + row.overtimePay + row.bonus - row.deductions - row.taxWithholding
                              )}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="employee-label">Employee</InputLabel>
                  <Select
                    labelId="employee-label"
                    name="employeeId"
                    value={formData.employeeId}
                    label="Employee"
                    onChange={handleSelectChange}
                    required
                  >
                    {employees && employees.length > 0 ? 
                      employees
                        .filter((emp: any) => emp.status !== 'Inactive')
                        .map((employee: any) => (
                          <MenuItem key={employee.id} value={employee.id}>
                            {`${employee.firstName} ${employee.lastName}`}
                          </MenuItem>
                        )) : 
                      <MenuItem disabled>No employees available</MenuItem>
                    }
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Pay Period"
                    views={['year', 'month']}
                    value={
                      formData.period ? 
                      new Date(
                        Number(formData.period.split('-')[0]), 
                        Number(formData.period.split('-')[1]) - 1
                      ) : 
                      new Date()
                    }
                    onChange={(date) => {
                      if (date) {
                        setFormData(prev => ({
                          ...prev,
                          period: format(date, 'yyyy-MM'),
                          startDate: startOfMonth(date),
                          endDate: endOfMonth(date)
                        }));
                      }
                    }}
                    slotProps={{ textField: { 
                      fullWidth: true,
                      helperText: `${format(formData.startDate, 'MM/dd/yyyy')} - ${format(formData.endDate, 'MM/dd/yyyy')}`
                    } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Salary Details
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="baseSalary"
                  label="Base Salary"
                  type="number"
                  fullWidth
                  value={formData.baseSalary}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="overtimePay"
                  label="Overtime Pay"
                  type="number"
                  fullWidth
                  value={formData.overtimePay}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="bonus"
                  label="Bonus"
                  type="number"
                  fullWidth
                  value={formData.bonus}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="deductions"
                  label="Deductions"
                  type="number"
                  fullWidth
                  value={formData.deductions}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="taxWithholding"
                  label="Tax Withholding"
                  type="number"
                  fullWidth
                  value={formData.taxWithholding}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.paper', border: '1px dashed' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Net Salary
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {formatCurrency(
                      getNetSalary(
                        formData.baseSalary, 
                        formData.overtimePay, 
                        formData.bonus,
                        formData.deductions,
                        formData.taxWithholding
                      )
                    )}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Payment Details
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="Draft">Draft</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="bankTransferRef"
                  label="Bank Transfer Reference"
                  fullWidth
                  value={formData.bankTransferRef}
                  onChange={handleInputChange}
                  disabled={formData.status !== 'Paid'}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Payment Date"
                    value={formData.paymentDate}
                    onChange={handleDateChange('paymentDate')}
                    disabled={formData.status !== 'Paid'}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  multiline
                  rows={3}
                  fullWidth
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Add any notes about this payroll record"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default PayrollPage;