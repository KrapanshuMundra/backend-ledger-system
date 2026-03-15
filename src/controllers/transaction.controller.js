const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const mongoose = require("mongoose")

/**
 * 1. Standard Transaction Controller (Transfer)
 * Processes money from one account to another
 */
async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    // 1. Validate request
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({ _id: fromAccount })
    const toUserAccount = await accountModel.findOne({ _id: toAccount })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    // 2. Validate idempotency key (prevent duplicates)
    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {
        return res.status(200).json({
            message: "Transaction already processed or in progress",
            transaction: isTransactionAlreadyExists
        })
    }

    // 3. Check account status
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both accounts must be ACTIVE"
        })
    }

    // 4. Check Balance (Calculated from Ledger)
    const balance = await fromUserAccount.getBalance()
    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}.`
        })
    }

    let transaction;
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        // 5. Create transaction record
        transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "COMPLETED" // Directly completed now
        }], { session }))[0]

        // 6. Create Ledger Entries (This is what Compass stores)
        await ledgerModel.create([{
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })

        await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        await session.commitTransaction()
        session.endSession()

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction: transaction
        })

    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        return res.status(500).json({
            message: "Transaction failed during processing",
            error: error.message
        })
    }
}

/**
 * 2. Initial Funds Controller
 * Adds money to an account without a sender
 */
async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({ _id: toAccount })
    if (!toUserAccount) {
        return res.status(400).json({ message: "Invalid toAccount" })
    }

    // Identify the system/admin user providing the funds
    const fromUserAccount = await accountModel.findOne({ user: req.user._id })
    if (!fromUserAccount) {
        return res.status(400).json({ message: "System user account not found" })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "COMPLETED"
        })

        await transaction.save({ session })

        // Create the credit entry in the ledger
        await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        // Optional: Create the debit from system account
        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })

        await session.commitTransaction()
        session.endSession()

        return res.status(201).json({
            message: "Initial funds added successfully",
            transaction: transaction
        })
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        return res.status(500).json({ message: "Initial funds failed" })
    }
}
module.exports = {
    createTransaction,
    createInitialFundsTransaction,
}