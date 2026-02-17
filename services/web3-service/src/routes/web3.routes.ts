import { Router } from "express";
import {
  createWallet,
  getWalletBalance,
  sendTransaction,
  deployContract,
  getTransactionStatus,
  getBlockNumber,
  getGasPrice
} from "../controllers/web3.controller";

const router = Router();

router.post("/wallets", createWallet);
router.get("/wallets/:walletAddress/:blockchain/balance", getWalletBalance);

router.post("/transactions", sendTransaction);
router.get("/transactions/:txHash/:blockchain", getTransactionStatus);

router.post("/contracts/deploy", deployContract);

router.get("/network/:blockchain/block-number", getBlockNumber);
router.get("/network/:blockchain/gas-price", getGasPrice);

export { router as web3Router };
