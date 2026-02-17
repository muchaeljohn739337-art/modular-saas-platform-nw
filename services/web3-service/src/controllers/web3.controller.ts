import { Request, Response, NextFunction } from "express";
import { Web3Service } from "../services/web3.service";

const web3Service = new Web3Service();

export const createWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, userId, blockchain } = req.body;
    const wallet = await web3Service.createWallet(tenantId, userId, blockchain);
    res.json(wallet);
  } catch (error) {
    next(error);
  }
};

export const getWalletBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { walletAddress, blockchain } = req.params;
    const balance = await web3Service.getWalletBalance(walletAddress, blockchain);
    res.json({ balance });
  } catch (error) {
    next(error);
  }
};

export const sendTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromWalletId, toAddress, amount, blockchain } = req.body;
    const transaction = await web3Service.sendTransaction(fromWalletId, toAddress, amount, blockchain);
    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

export const deployContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, name, bytecode, abi, blockchain } = req.body;
    const contract = await web3Service.deployContract(tenantId, name, bytecode, abi, blockchain);
    res.json(contract);
  } catch (error) {
    next(error);
  }
};

export const getTransactionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { txHash, blockchain } = req.params;
    const transaction = await web3Service.getTransactionStatus(txHash, blockchain);
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

export const getBlockNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { blockchain } = req.params;
    const blockNumber = await web3Service.getBlockNumber(blockchain);
    res.json({ blockNumber });
  } catch (error) {
    next(error);
  }
};

export const getGasPrice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { blockchain } = req.params;
    const gasPrice = await web3Service.getGasPrice(blockchain);
    res.json({ gasPrice });
  } catch (error) {
    next(error);
  }
};
