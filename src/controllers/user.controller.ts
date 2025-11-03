import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types/global";
import {
  Customer,
  LedgerStatus,
  Transaction,
  TransactionType,
} from "../types/api/user.types";
import prisma from "../utils/database";

interface CreateUserCreateResponse {
  id: string;
  ledgerId: string | null;
}

interface CreateTransactionCreatedResponse {
  transactionId: string;
  ledgerId: string;
  amountOfTransaction: number;
  balanceOfLedger: number;
  statusOfLedger: LedgerStatus;
}

export const createNewCustomer = async (
  request: Request<{}, ApiResponse<CreateUserCreateResponse>, Customer>,
  response: Response<ApiResponse<CreateUserCreateResponse>>
) => {
  try {
    const { fullName, address, phoneNumber } = request.body;

    if (!fullName || !address || !phoneNumber) {
      return response.status(400).json({
        success: false,
        statusCode: 400,
        errors: ["Details are Incomplete!"],
      });
    }

    const newLedger = await prisma.ledger.create({
      data: {
        balance: 0,
        status: "NONE",
      },
    });
    if (!newLedger || !newLedger.id) {
      console.error("Ledger creation returned falsy:", newLedger);
      return response.status(500).json({
        success: false,
        statusCode: 500,
        errors: ["Failed to create ledger"],
      });
    }

    //CREATING NEW CUSTOMER
    const newCustomer = await prisma.customer.create({
      data: {
        fullName: fullName,
        address: address,
        phoneNumber: phoneNumber,
        ledgerID: newLedger.id,
      },
    });

    return response.status(201).json({
      success: true,
      statusCode: 201,
      data: {
        id: newCustomer.id,
        ledgerId: newCustomer.ledgerID || null,
      },
    });
  } catch (error: any) {
    console.error("Error message:", error.message);
    return response.status(500).json({
      success: false,
      statusCode: 500,
      errors: ["Internal server error. Please try again later.", error.message],
    });
  }
};

export const performTransaction = async (
  request: Request<
    {},
    ApiResponse<CreateTransactionCreatedResponse>,
    Transaction
  >,
  response: Response<ApiResponse<CreateTransactionCreatedResponse>>
) => {
  //get the user and ledger details

  try {
    const { customerID, ledgerID, amount, typeOfTransaction, imgUrls } =
      request.body;
    if (!ledgerID || !customerID || !amount || !typeOfTransaction || !imgUrls) {
      return response.status(400).json({
        success: false,
        statusCode: 400,
        errors: ["All feilds are required is required"],
      });
    }

    const custLedger = await prisma.ledger.findUnique({
      where: { id: ledgerID },
      include: {
        transactions: true, // This will include all transactions
      },
    });

    if (!custLedger) {
      return response.status(400).json({
        success: false,
        statusCode: 400,
        errors: ["Customer Ledger Not Found!"],
      });
    }

    let balance: number = 0;
    let status: LedgerStatus;

    const currentBalanceAbsolute: number = custLedger.balance;
    if (custLedger.status === "GAIN") {
      balance = 1 * currentBalanceAbsolute;
    } else if (custLedger.status === "LOSS") {
      balance = -1 * currentBalanceAbsolute;
    }

    //now check the type of transaction
    switch (typeOfTransaction) {
      case TransactionType.CREDIT:
        // Handle CREDIT transaction
        balance = balance + amount;
        //Customer ko aur lending kari hamne to aur paise diye uske balance me aur zyada vapis lene hain
        console.log("Processing CREDIT transaction");
        break;

      case TransactionType.DEBIT:
        // Handle DEBIT transaction
        balance = balance - amount;
        //Customer has returned some money and uske ledger me se debit krdo kam kardo amount.
        console.log("Processing DEBIT transaction");
        break;

      default:
        // Invalid transaction type
        return response.status(400).json({
          success: false,
          statusCode: 400,
          errors: ["Invalid transaction type. Must be CREDIT or DEBIT"],
        });
    }

    //updating the ledger
    if (balance < 0) {
      status = LedgerStatus.LOSS;
    } else if (balance > 0) {
      status = LedgerStatus.GAIN;
    } else {
      status = LedgerStatus.NONE;
    }

    balance = Math.abs(balance); // again converting the balance to adbsolute

    //record new Transaction
    const newTransaction = await prisma.transaction.create({
      data: {
        amount: amount,
        type: typeOfTransaction,
        ledgerId: ledgerID, // This automatically creates the relationship
        imgUrls: imgUrls,
      },
    });

    console.log("Created transaction:", newTransaction);

    // Update the ledger (with explicit transaction connection)
    const updatedLedger = await prisma.ledger.update({
      where: {
        id: ledgerID,
      },
      data: {
        balance: balance,
        status: status,
        transactions: {
          connect: {
            id: newTransaction.id, // 👈 Explicitly connect the new transaction
          },
        },
      },
      include: {
        transactions: true, // Include transactions in the response
      },
    });

    console.log(
      "Updated ledger with transactions:",
      updatedLedger.transactions,
      "transactions"
    );

    return response.status(201).json({
      success: true,
      statusCode: 200,
      data: {
        transactionId: newTransaction.id,
        ledgerId: updatedLedger.id,
        amountOfTransaction: amount,
        balanceOfLedger: balance,
        statusOfLedger: status,
      },
    });
  } catch (error: any) {
    return response.status(400).json({
      success: false,
      statusCode: 500,
      errors: ["Some Error Occured", error.message],
    });
  }
};

export const getAllTransactionsOfCustomer = async (
  request: Request,
  response: Response
) => {
  try {
    const { ledgerID } = request.params;
    if (!ledgerID) {
      return response.status(400).json({
        success: false,
        statusCode: 500,
        errors: ["Details Incomplete"],
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        ledgerId: ledgerID,
      },
    });

    return response.status(200).json({
        success:true,
        statusCode:200,
        data:{
            transactions:transactions
        }
    })
  } catch (error: any) {
    return response.status(400).json({
      success: false,
      statusCode: 500,
      errors: ["Some Error Occured", error.message],
    });
  }
};

export const getCustomersonSearch = async (
  request: Request,
  response: Response
) => {
  try {
    const { value } = request.query;
    
    if (!value || typeof value !== 'string') {
      return response.status(400).json({
        success: false,
        statusCode: 400,
        errors: ["Search value is required"]
      });
    }
    console.log(value)
    // Create case-insensitive regex pattern
    const searchRegex = new RegExp(value, 'i');

    // Search customers using regex on multiple fields
    const matchingCustomers = await prisma.customer.findMany({
      where: {
        OR: [
          {
            fullName: {
              contains: value,
              mode: 'insensitive'  // Case-insensitive search
            }
          },
          {
            phoneNumber: {
              contains: value,
              mode: 'insensitive'
            }
          },
          {
            address: {
              contains: value,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: {
        fullName: 'asc'  // Sort results alphabetically
      }
    });

    return response.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        customers: matchingCustomers,
        count: matchingCustomers.length,
        searchTerm: value
      }
    });

  } catch (error: any) {
    console.error('Search error:', error);
    return response.status(500).json({
      success: false,
      statusCode: 500,
      errors: ["Search failed", error.message]
    });
  }
};
