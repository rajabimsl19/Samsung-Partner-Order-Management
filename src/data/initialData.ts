import { PartnerUser, ProductItem, PartnerOrder, ApprovalStep, SystemUser } from '../types';

export const INITIAL_OFFICERS = {
  tsmList: [
    { id: 'tso-1', name: 'Rafiqul Islam', code: 'TSO-DHK-01', role: 'TSM / TSO', zone: 'Dhaka Central' },
    { id: 'tso-2', name: 'Kamrul Ahsan', code: 'TSO-CTG-02', role: 'TSM / TSO', zone: 'Chittagong Metro' },
    { id: 'tso-3', name: 'Nazmul Huda', code: 'TSO-SYL-03', role: 'TSM / TSO', zone: 'Sylhet Division' },
  ],
  zbhList: [
    { id: 'zbh-1', name: 'Mahmudul Hasan', code: 'ZBH-DHK', role: 'ZBH / ASM', zone: 'Dhaka Division' },
    { id: 'zbh-2', name: 'Mizanur Rahman', code: 'ASM-CTG', role: 'ZBH / ASM', zone: 'Chittagong Division' },
    { id: 'zbh-3', name: 'Farhan Kabir', code: 'ZBH-SYL', role: 'ZBH / ASM', zone: 'Sylhet Division' },
  ],
  rsmList: [
    { id: 'rsm-1', name: 'Tanvir Ahmed', code: 'CSM-CENTRAL', role: 'CSM / RSM', zone: 'Central & Dhaka Region' },
    { id: 'rsm-2', name: 'Saiful Islam', code: 'RSM-SOUTH', role: 'CSM / RSM', zone: 'South & East Region' },
    { id: 'rsm-3', name: 'Tariqul Islam', code: 'CSM-NORTH', role: 'CSM / RSM', zone: 'North & West Region' },
  ],
};

export const INITIAL_USERS: SystemUser[] = [
  {
    id: 'u-1',
    username: 'admin',
    password: 'admin123',
    fullName: 'System Commercial Administrator',
    role: 'admin',
    designation: 'Samsung Headquarters Order Desk',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u-2',
    username: 'tso_dhaka',
    password: 'pass123',
    fullName: 'Rafiqul Islam',
    role: 'tsm',
    designation: 'TSM / TSO (Territory Sales Officer)',
    zone: 'Dhaka Central',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'u-3',
    username: 'tso_ctg',
    password: 'pass123',
    fullName: 'Kamrul Ahsan',
    role: 'tsm',
    designation: 'TSM / TSO (Territory Sales Officer)',
    zone: 'Chittagong Metro',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'u-4',
    username: 'zbh_dhaka',
    password: 'pass123',
    fullName: 'Mahmudul Hasan',
    role: 'zbh',
    designation: 'ZBH / ASM (Zonal Business Head)',
    zone: 'Dhaka Division',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'u-5',
    username: 'rsm_central',
    password: 'pass123',
    fullName: 'Tanvir Ahmed',
    role: 'rsm',
    designation: 'CSM / RSM (Commercial Sales Manager)',
    zone: 'Central & Dhaka Region',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'u-6',
    username: 'electro_bd',
    password: 'pass123',
    fullName: 'Electro Haven Ltd (Owner: Mr. Rahim)',
    role: 'partner',
    designation: 'Authorized Partner Retailer',
    dmsCode: 'SAMS-DHK-01',
    zone: 'Dhaka Central',
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'u-7',
    username: 'ctg_telecom',
    password: 'pass123',
    fullName: 'Chittagong Telecom World (Owner: Mr. Alam)',
    role: 'partner',
    designation: 'Authorized Partner Retailer',
    dmsCode: 'SAMS-CTG-04',
    zone: 'Chittagong Metro',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'u-8',
    username: 'sylhet_gal',
    password: 'pass123',
    fullName: 'Sylhet Galaxy Premium (Owner: Mr. Foyez)',
    role: 'partner',
    designation: 'Authorized Partner Retailer',
    dmsCode: 'SAMS-SYL-08',
    zone: 'Sylhet Division',
    createdAt: '2026-02-01T00:00:00Z',
  },
];

export const INITIAL_PARTNERS: PartnerUser[] = [
  {
    id: 'p-1',
    partnerCode: 'SAMS-DHK-01',
    dmsCode: 'SAMS-DHK-01',
    partnerName: 'Electro Haven Ltd (Dhaka Central)',
    username: 'electro_bd',
    password: 'pass123',
    phone: '+880 1711-209841',
    address: 'Gulshan-2, Dhaka 1212',
    zone: 'Dhaka Central',
    tsmName: 'Rafiqul Islam (TSM/TSO)',
    zbhName: 'Mahmudul Hasan (ZBH/ASM)',
    rsmName: 'Tanvir Ahmed (CSM/RSM)',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'p-2',
    partnerCode: 'SAMS-CTG-04',
    dmsCode: 'SAMS-CTG-04',
    partnerName: 'Chittagong Telecom World',
    username: 'ctg_telecom',
    password: 'pass123',
    phone: '+880 1819-445522',
    address: 'GEC Circle, Chittagong 4000',
    zone: 'Chittagong Metro',
    tsmName: 'Kamrul Ahsan (TSM/TSO)',
    zbhName: 'Mizanur Rahman (ZBH/ASM)',
    rsmName: 'Saiful Islam (CSM/RSM)',
    createdAt: '2026-01-15T11:30:00Z',
  },
  {
    id: 'p-3',
    partnerCode: 'SAMS-SYL-08',
    dmsCode: 'SAMS-SYL-08',
    partnerName: 'Sylhet Galaxy Premium Retail',
    username: 'sylhet_gal',
    password: 'pass123',
    phone: '+880 1722-889900',
    address: 'Zindabazar, Sylhet 3100',
    zone: 'Sylhet Division',
    tsmName: 'Nazmul Huda (TSM/TSO)',
    zbhName: 'Farhan Kabir (ZBH/ASM)',
    rsmName: 'Tanvir Ahmed (CSM/RSM)',
    createdAt: '2026-02-01T09:15:00Z',
  },
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-s25u',
    model: 'Galaxy S25 Ultra',
    prodcode: 'SM-S938B',
    status: 'Active',
    colors: [
      { color: 'Titanium Black', price: 179999 },
      { color: 'Titanium Gray', price: 179999 },
      { color: 'Titanium Silver', price: 179999 },
    ],
  },
  {
    id: 'prod-zfold6',
    model: 'Galaxy Z Fold6',
    prodcode: 'SM-F956B',
    status: 'Active',
    colors: [
      { color: 'Silver Shadow', price: 229999 },
      { color: 'Navy Blue', price: 229999 },
      { color: 'Crafted Black', price: 234999 },
    ],
  },
  {
    id: 'prod-s24fe',
    model: 'Galaxy S24 FE',
    prodcode: 'SM-S721B',
    status: 'Active',
    colors: [
      { color: 'Blue', price: 89999 },
      { color: 'Graphite', price: 89999 },
      { color: 'Mint', price: 89999 },
    ],
  },
  {
    id: 'prod-a55',
    model: 'Galaxy A55 5G',
    prodcode: 'SM-A556E',
    status: 'Active',
    colors: [
      { color: 'Awesome Navy', price: 49999 },
      { color: 'Awesome Iceblue', price: 49999 },
      { color: 'Awesome Lilac', price: 49999 },
    ],
  },
  {
    id: 'prod-a35',
    model: 'Galaxy A35 5G',
    prodcode: 'SM-A356E',
    status: 'Active',
    colors: [
      { color: 'Awesome Navy', price: 39999 },
      { color: 'Awesome Lemon', price: 39999 },
    ],
  },
  {
    id: 'prod-a16',
    model: 'Galaxy A16 4G',
    prodcode: 'SM-A165F',
    status: 'Active',
    colors: [
      { color: 'Light Green', price: 19999 },
      { color: 'Blue Black', price: 19999 },
      { color: 'Gold', price: 19999 },
    ],
  },
  {
    id: 'prod-taba9',
    model: 'Galaxy Tab A9+ LTE',
    prodcode: 'SM-X216B',
    status: 'Active',
    colors: [
      { color: 'Graphite', price: 31999 },
      { color: 'Silver', price: 31999 },
    ],
  },
];

export const createDefaultApprovalChain = (
  tsmName: string,
  zbhName: string,
  rsmName: string
): ApprovalStep[] => [
  {
    stage: 'TSM_TSO',
    stageTitle: 'Territory Review',
    designation: 'TSM / TSO',
    approverName: tsmName || 'Territory Sales Officer',
    status: 'Pending',
  },
  {
    stage: 'ZBH_ASM',
    stageTitle: 'Zonal Approval',
    designation: 'ZBH / ASM',
    approverName: zbhName || 'Zonal Business Head',
    status: 'Pending',
  },
  {
    stage: 'CSM_RSM',
    stageTitle: 'Regional Approval',
    designation: 'CSM / RSM',
    approverName: rsmName || 'Commercial Sales Manager',
    status: 'Pending',
  },
  {
    stage: 'ADMIN',
    stageTitle: 'Commercial Final Approval',
    designation: 'Samsung Admin Panel',
    approverName: 'Headquarters Admin Desk',
    status: 'Pending',
  },
];

export const INITIAL_ORDERS: PartnerOrder[] = [];

