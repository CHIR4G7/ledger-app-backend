import express from "express";
import { createNewCustomer, getAllTransactionsOfCustomer, performTransaction, getCustomersonSearch, getCustomerLedgerDetails } from "../controllers/user.controller";

const router = express.Router();


router.post('/createNewCustomer',createNewCustomer)
router.post('/performTransaction',performTransaction)
router.get('/getAllTransactions/:ledgerID',getAllTransactionsOfCustomer)
router.get('/search', getCustomersonSearch)  // Search customers route
router.get('/getLedgerDetails',getCustomerLedgerDetails)
export default router