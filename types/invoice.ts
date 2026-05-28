export type DueType = 'signing' | '15days' | 'annual' | '';

export interface LineItem {
  id: string;
  desc: string;
  amount: string;
  due: DueType;
}

export interface PaidItem {
  id: string;
  desc: string;
  amount: string;
}

export interface TermItem {
  id: string;
  value: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  dateIssued: string;
  dateDue: string;
  billTo: string;
  billCompany: string;
  billNpwp: string;
  billEmail: string;
  items: LineItem[];
  paidItems: PaidItem[];
  terms: string[];
  total: number;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  npwp: string;
  email: string;
  phone: string;
  createdAt: string;
}
