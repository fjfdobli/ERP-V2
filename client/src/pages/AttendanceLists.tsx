import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, TextField, InputAdornment, CircularProgress, Dialog, DialogTitle, DialogContent, 
  DialogActions, Grid, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, 
  Chip, IconButton, Tooltip, Tabs, Tab, Divider 
} from '@mui/material';
import { 
  Add as AddIcon, Search as SearchIcon, Refresh as RefreshIcon, Today as TodayIcon,
  History as HistoryIcon, CalendarMonth as CalendarMonthIcon, NoteAdd as NoteAddIcon,
  Edit as EditIcon, Delete as DeleteIcon, CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, Schedule as ScheduleIcon, HourglassEmpty as HourglassEmptyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { 
  fetchAttendance, createAttendance, updateAttendance, deleteAttendance, bulkCreateAttendance 
} from '../redux/slices/attendanceSlice';
import { fetchEmployees } from '../redux/slices/employeesSlice';
import { Attendance, AttendanceFilters } from '../services/attendanceService';
import { format, isToday, isYesterday, parseISO, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Employee } from '../services/employeesService';

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
      id={`attendance-tabpanel-${index}`}
      aria-labelledby={`attendance-tab-${index}`}
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

interface AttendanceFormData {
  employeeId: number | string;
  date: Date;
  timeIn: Date | null;
  timeOut: Date | null;
  status: 'Present' | 'Absent' | 'Late' | 'Half-day' | 'On Leave';
  overtime: number | null;
  notes: string;
}

interface BulkAttendanceRow {
  employeeId: number;
  employeeName: string;
  present: boolean;
  timeIn: Date | null;
  timeOut: Date | null;
  status: 'Present' | 'Absent' | 'Late' | 'Half-day' | 'On Leave';
  overtime: number | null;
  notes: string;
}

const AttendanceLists: React.FC = () => {
  const dispatch = useAppDispatch();
  const { attendanceRecords, isLoading: attendanceLoading } = useAppSelector((state: any) => state.attendance || { attendanceRecords: [], isLoading: false });
  const { employees, isLoading: employeesLoading } = useAppSelector((state: any) => state.employees);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [bulkDate, setBulkDate] = useState<Date>(new Date());
  const [bulkAttendanceData, setBulkAttendanceData] = useState<BulkAttendanceRow[]>([]);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<AttendanceFilters>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  
  const [formData, setFormData] = useState<AttendanceFormData>({
    employeeId: '',
    date: new Date(),
    timeIn: null,
    timeOut: null,
    status: 'Present',
    overtime: null,
    notes: '',
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
      await dispatch(fetchAttendance(filters)).unwrap();
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

  const handleOpenDialog = (attendance?: Attendance) => {
    if (attendance) {
      setSelectedAttendance(attendance);
      
      // Convert string times to Date objects
      let timeIn = null;
      let timeOut = null;
      
      if (attendance.timeIn) {
        const timeInDate = new Date();
        const [hours, minutes] = attendance.timeIn.split(':').map(Number);
        timeInDate.setHours(hours, minutes);
        timeIn = timeInDate;
      }
      
      if (attendance.timeOut) {
        const timeOutDate = new Date();
        const [hours, minutes] = attendance.timeOut.split(':').map(Number);
        timeOutDate.setHours(hours, minutes);
        timeOut = timeOutDate;
      }
      
      setFormData({
        employeeId: attendance.employeeId,
        date: parseISO(attendance.date),
        timeIn,
        timeOut,
        status: attendance.status as any || 'Present',
        overtime: attendance.overtime,
        notes: attendance.notes || '',
      });
    } else {
      setSelectedAttendance(null);
      setFormData({
        employeeId: '',
        date: new Date(),
        timeIn: null,
        timeOut: null,
        status: 'Present',
        overtime: null,
        notes: '',
      });
    }
    setOpenDialog(true);
    setIsBulkMode(false);
  };

  const handleOpenBulkDialog = () => {
    // Initialize bulk attendance data with all active employees
    if (employees && employees.length > 0) {
      const initialData: BulkAttendanceRow[] = employees
        .filter((emp: any) => emp.status !== 'Inactive')
        .map((emp: any) => ({
          employeeId: Number(emp.id),
          employeeName: `${emp.firstName} ${emp.lastName}`,
          present: true,
          timeIn: new Date(new Date().setHours(8, 0, 0, 0)),
          timeOut: new Date(new Date().setHours(17, 0, 0, 0)),
          status: 'Present' as const,
          overtime: 0,
          notes: '',
        }));
      
      setBulkAttendanceData(initialData);
    }
    
    setBulkDate(new Date());
    setIsBulkMode(true);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAttendance(null);
    setIsBulkMode(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        date
      }));
    }
  };

  const handleBulkDateChange = (date: Date | null) => {
    if (date) {
      setBulkDate(date);
    }
  };

  const handleTimeChange = (name: 'timeIn' | 'timeOut') => (time: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: time
    }));
  };

  const handleBulkInputChange = (index: number, field: keyof BulkAttendanceRow, value: any) => {
    const updatedData = [...bulkAttendanceData];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value
    };
    
    // Update status automatically based on present field
    if (field === 'present') {
      updatedData[index].status = value ? 'Present' : 'Absent';
      
      // Clear times if absent
      if (!value) {
        updatedData[index].timeIn = null;
        updatedData[index].timeOut = null;
        updatedData[index].overtime = 0;
      } else {
        // Set default times if changed to present
        updatedData[index].timeIn = new Date(new Date().setHours(8, 0, 0, 0));
        updatedData[index].timeOut = new Date(new Date().setHours(17, 0, 0, 0));
      }
    }
    
    setBulkAttendanceData(updatedData);
  };

  const handleFilterChange = (name: keyof AttendanceFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateFilterChange = (name: 'startDate' | 'endDate') => (date: Date | null) => {
    if (date) {
      setFilters(prev => ({
        ...prev,
        [name]: format(date, 'yyyy-MM-dd')
      }));
    }
  };

  const applyDateRange = (range: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth') => {
    const today = new Date();
    let start: Date, end: Date;
    
    switch (range) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'yesterday':
        start = subDays(today, 1);
        end = subDays(today, 1);
        break;
      case 'thisWeek':
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'lastWeek':
        start = subDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
        end = subDays(endOfWeek(today, { weekStartsOn: 1 }), 7);
        break;
      case 'thisMonth':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      default:
        return;
    }
    
    setFilters(prev => ({
      ...prev,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      if (isBulkMode) {
        // Handle bulk attendance submission
        const attendanceRecords = bulkAttendanceData
          .filter(row => row.present || row.status !== 'Present')
          .map(row => ({
            employeeId: row.employeeId,
            date: format(bulkDate, 'yyyy-MM-dd'),
            timeIn: row.timeIn ? format(row.timeIn, 'HH:mm') : null,
            timeOut: row.timeOut ? format(row.timeOut, 'HH:mm') : null,
            status: row.status,
            overtime: row.overtime,
            notes: row.notes
          }));
        
        await dispatch(bulkCreateAttendance(attendanceRecords as any)).unwrap();
        showSnackbar(`Successfully recorded attendance for ${attendanceRecords.length} employees`, 'success');
      } else {
        // Handle single attendance record
        const { employeeId, date, timeIn, timeOut, status, overtime, notes } = formData;
        
        if (!employeeId) {
          showSnackbar('Please select an employee', 'error');
          setLoading(false);
          return;
        }
        
        const attendanceData = {
          employeeId: Number(employeeId),
          date: format(date, 'yyyy-MM-dd'),
          timeIn: timeIn ? format(timeIn, 'HH:mm') : null,
          timeOut: timeOut ? format(timeOut, 'HH:mm') : null,
          status,
          overtime,
          notes: notes || null
        };
        
        if (selectedAttendance) {
          await dispatch(updateAttendance({ id: selectedAttendance.id, data: attendanceData as any })).unwrap();
          showSnackbar('Attendance record updated successfully', 'success');
        } else {
          await dispatch(createAttendance(attendanceData as any)).unwrap();
          showSnackbar('Attendance record created successfully', 'success');
        }
      }
      
      handleCloseDialog();
      fetchData();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      showSnackbar(error.message || 'Failed to save attendance record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      setLoading(true);
      try {
        await dispatch(deleteAttendance(id)).unwrap();
        showSnackbar('Attendance record deleted successfully', 'success');
        fetchData();
      } catch (error: any) {
        console.error('Error deleting attendance:', error);
        showSnackbar(error.message || 'Failed to delete attendance record', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearch = () => {
    const searched = attendanceRecords?.filter((record: Attendance) => {
      const lowerSearch = searchTerm.toLowerCase();
      return (
        (record.employeeName?.toLowerCase().includes(lowerSearch)) ||
        record.status.toLowerCase().includes(lowerSearch) ||
        (record.notes && record.notes.toLowerCase().includes(lowerSearch))
      );
    });
    
    // TODO: Implement search functionality
    console.log("Searched records:", searched);
  };

  const getStatusChip = (status: string) => {
    let color: 'default' | 'success' | 'error' | 'warning' | 'info' = 'default';
    let icon = null;
    
    switch (status) {
      case 'Present':
        color = 'success';
        icon = <CheckCircleIcon fontSize="small" />;
        break;
      case 'Absent':
        color = 'error';
        icon = <CancelIcon fontSize="small" />;
        break;
      case 'Late':
        color = 'warning';
        icon = <ScheduleIcon fontSize="small" />;
        break;
      case 'Half-day':
        color = 'info';
        icon = <HourglassEmptyIcon fontSize="small" />;
        break;
      case 'On Leave':
        color = 'default';
        icon = <TodayIcon fontSize="small" />;
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

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees?.find((emp: any) => Number(emp.id) === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  };

  // Filter displayed records based on search term
  const filteredRecords = searchTerm.trim() 
    ? attendanceRecords?.filter((record: Attendance) => {
        const lowerSearch = searchTerm.toLowerCase();
        return (
          (record.employeeName?.toLowerCase().includes(lowerSearch)) ||
          record.status.toLowerCase().includes(lowerSearch) ||
          (record.notes && record.notes.toLowerCase().includes(lowerSearch))
        );
      })
    : attendanceRecords;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Attendance Management
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<NoteAddIcon />}
            onClick={handleOpenBulkDialog}
            sx={{ mr: 1 }}
          >
            Bulk Entry
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Record
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="attendance management tabs">
          <Tab label="Attendance Records" icon={<HistoryIcon />} />
          <Tab label="Reports & Analytics" icon={<CalendarMonthIcon />} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  placeholder="Search employees or status..."
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
                      label="From Date"
                      value={filters.startDate ? parseISO(filters.startDate) : null}
                      onChange={handleDateFilterChange('startDate')}
                      slotProps={{ textField: { size: 'small', sx: { mr: 1 } } }}
                    />
                    <DatePicker
                      label="To Date"
                      value={filters.endDate ? parseISO(filters.endDate) : null}
                      onChange={handleDateFilterChange('endDate')}
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
                      <MenuItem value="Present">Present</MenuItem>
                      <MenuItem value="Absent">Absent</MenuItem>
                      <MenuItem value="Late">Late</MenuItem>
                      <MenuItem value="Half-day">Half-day</MenuItem>
                      <MenuItem value="On Leave">On Leave</MenuItem>
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
                    onClick={() => applyDateRange('today')}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Today
                  </Button>
                  <Button
                    onClick={() => applyDateRange('thisWeek')}
                    size="small"
                  >
                    This Week
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          {(loading || attendanceLoading || employeesLoading) ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Employee</strong></TableCell>
                    <TableCell><strong>Time In</strong></TableCell>
                    <TableCell><strong>Time Out</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Overtime</strong></TableCell>
                    <TableCell><strong>Notes</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords && filteredRecords.length > 0 ? (
                    filteredRecords.map((record: Attendance) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>
                          {record.employeeName || getEmployeeName(record.employeeId)}
                        </TableCell>
                        <TableCell>{record.timeIn || '-'}</TableCell>
                        <TableCell>{record.timeOut || '-'}</TableCell>
                        <TableCell>{getStatusChip(record.status)}</TableCell>
                        <TableCell>
                          {record.overtime ? `${record.overtime} hours` : '-'}
                        </TableCell>
                        <TableCell>
                          {record.notes ? (
                            <Tooltip title={record.notes}>
                              <span>{record.notes.substring(0, 20)}{record.notes.length > 20 ? '...' : ''}</span>
                            </Tooltip>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit Record">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(record)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Record">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(record.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Attendance Reports & Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This section is under development. Soon you'll be able to view detailed attendance statistics, 
              generate reports, and analyze attendance patterns.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {/* Add/Edit Attendance Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth={isBulkMode ? "lg" : "md"} fullWidth>
        <DialogTitle>
          {isBulkMode ? 'Bulk Attendance Entry' : (selectedAttendance ? 'Edit Attendance Record' : 'Add New Attendance Record')}
        </DialogTitle>
        
        <DialogContent>
          {isBulkMode ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ mb: 3, mt: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Attendance Date"
                      value={bulkDate}
                      onChange={handleBulkDateChange}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Box>
                
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Employee</strong></TableCell>
                        <TableCell><strong>Present</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Time In</strong></TableCell>
                        <TableCell><strong>Time Out</strong></TableCell>
                        <TableCell><strong>Overtime (hrs)</strong></TableCell>
                        <TableCell><strong>Notes</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bulkAttendanceData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.employeeName}</TableCell>
                          <TableCell>
                            <Chip
                              label={row.present ? "Present" : "Absent"}
                              color={row.present ? "success" : "default"}
                              onClick={() => handleBulkInputChange(index, 'present', !row.present)}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={row.status}
                                onChange={(e) => handleBulkInputChange(index, 'status', e.target.value)}
                                disabled={!row.present}
                              >
                                <MenuItem value="Present">Present</MenuItem>
                                <MenuItem value="Late">Late</MenuItem>
                                <MenuItem value="Half-day">Half-day</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                              <TimePicker
                                value={row.timeIn}
                                onChange={(newTime) => handleBulkInputChange(index, 'timeIn', newTime)}
                                disabled={!row.present}
                                slotProps={{ textField: { size: 'small' } }}
                              />
                            </LocalizationProvider>
                          </TableCell>
                          <TableCell>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                              <TimePicker
                                value={row.timeOut}
                                onChange={(newTime) => handleBulkInputChange(index, 'timeOut', newTime)}
                                disabled={!row.present}
                                slotProps={{ textField: { size: 'small' } }}
                              />
                            </LocalizationProvider>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={row.overtime || 0}
                              onChange={(e) => handleBulkInputChange(index, 'overtime', Number(e.target.value))}
                              disabled={!row.present}
                              size="small"
                              InputProps={{
                                inputProps: { min: 0, max: 12 }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={row.notes}
                              onChange={(e) => handleBulkInputChange(index, 'notes', e.target.value)}
                              size="small"
                              placeholder="Optional notes"
                            />
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
                    label="Attendance Date"
                    value={formData.date}
                    onChange={handleDateChange}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Attendance Details
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
                    <MenuItem value="Present">Present</MenuItem>
                    <MenuItem value="Absent">Absent</MenuItem>
                    <MenuItem value="Late">Late</MenuItem>
                    <MenuItem value="Half-day">Half-day</MenuItem>
                    <MenuItem value="On Leave">On Leave</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="overtime"
                  label="Overtime Hours"
                  type="number"
                  fullWidth
                  value={formData.overtime === null ? '' : formData.overtime}
                  onChange={handleInputChange}
                  disabled={formData.status === 'Absent' || formData.status === 'On Leave'}
                  InputProps={{
                    inputProps: { min: 0, max: 12 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="Time In"
                    value={formData.timeIn}
                    onChange={handleTimeChange('timeIn')}
                    disabled={formData.status === 'Absent' || formData.status === 'On Leave'}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="Time Out"
                    value={formData.timeOut}
                    onChange={handleTimeChange('timeOut')}
                    disabled={formData.status === 'Absent' || formData.status === 'On Leave'}
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
                  placeholder="Add any notes about this attendance record"
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

export default AttendanceLists;