// src/redux/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import clientsReducer from './slices/clientsSlice';
import ordersReducer from './slices/ordersSlice';
import inventoryReducer from './slices/inventorySlice';
import employeesReducer from './slices/employeesSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  clients: clientsReducer,
  orders: ordersReducer,
  inventory: inventoryReducer,
  employees: employeesReducer
});

export default rootReducer;