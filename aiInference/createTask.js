"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var viem_1 = require("viem");
var accounts_1 = require("viem/accounts");
var chains_1 = require("viem/chains");
require("dotenv/config");
var PRIVATE_KEY = '0xa73f439105df962fa7af1a273c400e562f1065977926c423762d1c48c7432aac';
// Simplified ABI without complex types
var abi = [
    {
        type: 'function',
        name: 'createNewTask',
        inputs: [{ name: 'contents', type: 'string' }],
        outputs: [
            {
                type: 'tuple',
                components: [
                    { name: 'contents', type: 'string' },
                    { name: 'taskCreatedBlock', type: 'uint32' }
                ]
            }
        ],
        stateMutability: 'nonpayable'
    }
];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var contractAddress, account, publicClient, walletClient, request, hash, receipt, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    contractAddress = '0x0b6D8B9A2b84F3A40282a99674dA8E388B1eEC28';
                    account = (0, accounts_1.privateKeyToAccount)(PRIVATE_KEY);
                    publicClient = (0, viem_1.createPublicClient)({
                        chain: chains_1.holesky,
                        transport: (0, viem_1.http)('https://1rpc.io/holesky'),
                    });
                    walletClient = (0, viem_1.createWalletClient)({
                        chain: chains_1.holesky,
                        transport: (0, viem_1.http)('https://1rpc.io/holesky'),
                        account: account,
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    console.log('Creating new task...');
                    console.log('Contract address:', contractAddress);
                    console.log('Account address:', account.address);
                    return [4 /*yield*/, publicClient.simulateContract({
                            address: contractAddress,
                            abi: abi,
                            functionName: 'createNewTask',
                            args: ['I am a thief'],
                            account: account,
                        })];
                case 2:
                    request = (_a.sent()).request;
                    return [4 /*yield*/, walletClient.writeContract(request)];
                case 3:
                    hash = _a.sent();
                    console.log('Transaction hash:', hash);
                    return [4 /*yield*/, publicClient.waitForTransactionReceipt({ hash: hash })];
                case 4:
                    receipt = _a.sent();
                    console.log('Transaction receipt:', receipt);
                    console.log('Task created successfully!');
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('Error creating task:', error_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
