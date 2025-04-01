import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logout } from '../../redux/slices/authSlice';
import { AppBar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Button, Avatar, Menu, MenuItem, Tooltip, Badge, useMediaQuery, Collapse } from '@mui/material';
import { Menu as MenuIcon, Dashboard as DashboardIcon, People as ClientsIcon, ShoppingCart as OrdersIcon, Inventory as InventoryIcon, Group as EmployeesIcon, LocalShipping as SuppliersIcon, HowToReg as AttendanceIcon, Build as MachineryIcon, BarChart as ReportsIcon, Notifications as NotificationsIcon, AccountCircle, Settings, ExitToApp, ChevronLeft, ExpandLess, ExpandMore, RequestQuote as RequestIcon, ImportContacts as ClientRequestIcon, Source as SupplierRequestIcon, Payments as PayrollIcon } from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';

const drawerWidth = 260;
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Clients', icon: <ClientsIcon />, path: '/clients' },
  { text: 'Orders', 
    icon: <OrdersIcon />, 
    children: [
      { text: 'Client Orders', icon: <ClientRequestIcon />, path: '/orders/clients' },
      { text: 'Order Requests', icon: <RequestIcon />, path: '/orders/requests' },
      { text: 'Supplier Orders', icon: <SupplierRequestIcon />, path: '/orders/suppliers' }
    ]
  },
  { text: 'Suppliers', icon: <SuppliersIcon />, path: '/suppliers' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
  { text: 'Employees', icon: <EmployeesIcon />, path: '/employees' },
  { text: 'Attendance', icon: <AttendanceIcon />, path: '/attendance' },
  { text: 'Payroll', icon: <PayrollIcon />, path: '/payroll' },
  { text: 'Machinery', icon: <MachineryIcon />, path: '/machinery' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
];

const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<HTMLButtonElement | null>(null);
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector(state => state.auth);
  
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const isOrdersPathActive = React.useCallback(() => {
    return location.pathname.includes('/orders');
  }, [location.pathname]);

  useEffect(() => {
    if (isOrdersPathActive() && openSubMenu !== 'Orders') {
      setOpenSubMenu('Orders');
    }
  }, [isOrdersPathActive, openSubMenu]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSubMenuToggle = (text: string) => {
    setOpenSubMenu(openSubMenu === text ? null : text);
  };

  interface UserMenuOpenEvent extends React.MouseEvent<HTMLButtonElement> {}

  const handleUserMenuOpen = (event: UserMenuOpenEvent) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleProfileClick = () => {
    setUserMenuAnchor(null);
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    setUserMenuAnchor(null);
    navigate('/settings');
  };

  interface NotificationsOpenEvent extends React.MouseEvent<HTMLButtonElement> {}

  const handleNotificationsOpen = (event: NotificationsOpenEvent) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getInitial = (str?: string): string => {
    return str && str.length > 0 ? str.charAt(0).toUpperCase() : 'U';
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 1,
        backgroundColor: 'primary.main',
        color: 'white'
      }}>
        <PrintIcon sx={{ fontSize: 28, mr: 1 }} />
        <Typography variant="h6" noWrap component="div" fontWeight="bold">
          Opzon's Printing Press
        </Typography>
        {isSmallScreen && (
          <IconButton 
            onClick={handleDrawerToggle}
            sx={{ 
              position: 'absolute', 
              right: 8,
              color: 'white'
            }}
          >
            <ChevronLeft />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      
      {user && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Avatar 
            sx={{ 
              width: 64, 
              height: 64, 
              mx: 'auto', 
              bgcolor: 'primary.main',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}
          >
            {getInitial(user.firstName) || getInitial(user.email)}
          </Avatar>
          <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 'medium' }}>
            {user.firstName 
              ? `${user.firstName} ${user.lastName || ''}`
              : user.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.role || 'Admin'}
          </Typography>
        </Box>
      )}
      
      <Divider />
      
      <List sx={{ flexGrow: 1, px: 1 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            {item.children ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleSubMenuToggle(item.text)}
                    sx={{ 
                      borderRadius: 1,
                      mb: 0.5,
                      backgroundColor: isOrdersPathActive() 
                        ? 'rgba(25, 118, 210, 0.12)' 
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                    {openSubMenu === item.text ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                
                <Collapse in={openSubMenu === item.text} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItem key={child.text} disablePadding>
                        <ListItemButton
                          sx={{ 
                            pl: 4,
                            borderRadius: 1,
                            mb: 0.5,
                            '&.Mui-selected': {
                              backgroundColor: 'primary.light',
                              color: 'white',
                              '& .MuiListItemIcon-root': {
                                color: 'white',
                              },
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            }
                          }}
                          selected={location.pathname === child.path}
                          onClick={() => {
                            navigate(child.path);
                            if (isSmallScreen) {
                              setMobileOpen(false);
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText primary={child.text} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItem disablePadding>
                <ListItemButton
                  sx={{ 
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'white',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    }
                  }}
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (isSmallScreen) {
                      setMobileOpen(false);
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            )}
          </React.Fragment>
        ))}
      </List>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<ExitToApp />}
          onClick={handleLogout}
          sx={{ justifyContent: 'flex-start', py: 1 }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  const getPageTitle = () => {
    if (location.pathname.includes('/orders/requests')) return 'Order Requests';
    if (location.pathname.includes('/orders/clients')) return 'Client Orders';
    if (location.pathname.includes('/orders/suppliers')) return 'Supplier Orders';
    if (location.pathname.includes('/dashboard')) return 'Dashboard';
    if (location.pathname.includes('/profile')) return 'My Profile';
    if (location.pathname.includes('/settings')) return 'Settings';
    
    const pathSegments = location.pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    if (!lastSegment) return 'Dashboard';
    
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            {getPageTitle()}
          </Typography>
          
          <Tooltip title="Notifications">
            <IconButton 
              color="inherit" 
              onClick={handleNotificationsOpen}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={handleNotificationsClose}
            PaperProps={{
              sx: { 
                width: 320,
                maxHeight: 400,
                mt: 1.5,
                '& .MuiList-root': {
                  py: 0
                }
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #eee' }}>
              <Typography variant="subtitle1" fontWeight="medium">Notifications</Typography>
            </Box>
            <MenuItem onClick={handleNotificationsClose} sx={{ py: 1.5 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Low inventory alert: Black Ink
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  10 minutes ago
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleNotificationsClose} sx={{ py: 1.5 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  New order received: ORD-2025-00123
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  1 hour ago
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleNotificationsClose} sx={{ py: 1.5 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Maintenance required: Digital Printer
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  3 hours ago
                </Typography>
              </Box>
            </MenuItem>
            <Box sx={{ p: 1, borderTop: '1px solid #eee', textAlign: 'center' }}>
              <Button size="small">View All</Button>
            </Box>
          </Menu>
          
          <Button
            onClick={handleUserMenuOpen}
            color="inherit"
            startIcon={
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
                {getInitial(user?.firstName) || getInitial(user?.email)}
              </Avatar>
            }
            endIcon={<MenuIcon />}
            sx={{ textTransform: 'none' }}
          >
            <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', lineHeight: 1.2 }}>
                {user?.firstName 
                  ? `${user.firstName} ${user.lastName || ''}`
                  : user?.email}
              </Typography>
              <Typography variant="caption" color="inherit" sx={{ opacity: 0.8 }}>
                {user?.role || 'Admin'}
              </Typography>
            </Box>
          </Button>
          
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            PaperProps={{
              sx: { width: 200, mt: 1.5 }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>My Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleSettingsClick}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid rgba(0, 0, 0, 0.08)'
            },
          }}
        >
          {drawer}
        </Drawer>
        
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid rgba(0, 0, 0, 0.08)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: 'background.default',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Toolbar />
        <Outlet /> 
      </Box>
    </Box>
  );
};

export default DashboardLayout;