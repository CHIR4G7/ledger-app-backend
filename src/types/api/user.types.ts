export interface Customer{
    fullName:string,
    address:string,
    phoneNumber:string
}

export enum TransactionType{
    CREDIT = "CREDIT",
    DEBIT = "DEBIT"
}
export enum LedgerStatus{
  GAIN = "GAIN",
  LOSS = "LOSS",
  NONE = "NONE"
}

export interface Transaction{
   customerID:string,
   ledgerID:string,
   amount:number,
   typeOfTransaction:TransactionType,
   imgUrls:string[]
}

export interface Ledger{
    balance:number,
    transactions:Transaction[]
}