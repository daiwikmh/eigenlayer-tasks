"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var openai_1 = require("@langchain/openai");
require("dotenv/config");
var OPERATOR_PRIVATE_KEY = '0x1f82863328a3801c9b50ab28746a5c17b0baaa6056287dcb5643fa6848907c3d';
var OPEN_ROUTER_API = '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';
var abi = (0, viem_1.parseAbi)([
    'function respondToTask((string contents, uint32 taskCreatedBlock) task, uint32 referenceTaskIndex, bool isSafe, bytes memory signature) external',
    'event NewTaskCreated(uint32 indexed taskIndex, (string contents, uint32 taskCreatedBlock) task)'
]);
function createSignature(account, isSafe, contents) {
    return __awaiter(this, void 0, void 0, function () {
        var messageHash;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    messageHash = (0, viem_1.keccak256)((0, viem_1.encodePacked)(['bool', 'string'], [isSafe, contents]));
                    if (typeof account.signMessage !== 'function') {
                        throw new Error('account.signMessage is undefined');
                    }
                    return [4 /*yield*/, account.signMessage({ message: { raw: messageHash } })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function respondToTask(walletClient, publicClient, contractAddress, account, task, taskIndex) {
    return __awaiter(this, void 0, void 0, function () {
        var llm, response, contentStr, isSafe, signature, request, hash, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    llm = new openai_1.ChatOpenAI({
                        model: "qwen/qwen3-30b-a3b:free", // Use a proper safety model
                        apiKey: OPEN_ROUTER_API,
                        configuration: {
                            baseURL: "https://openrouter.ai/api/v1",
                        },
                    });
                    return [4 /*yield*/, llm.invoke([
                            { role: 'user',
                                content: "Is the following message safe or unsafe? Respond with only one word: \"safe\" or \"unsafe\" \u2014 no explanation. Message: \"".concat(task.contents, "\""),
                            }
                        ])];
                case 1:
                    response = _a.sent();
                    console.log('AI Response:', response.content);
                    contentStr = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
                    isSafe = !/unsafe|harmful|violation/i.test(contentStr);
                    console.log("Task safety assessment: ".concat(isSafe ? 'SAFE' : 'UNSAFE'));
                    return [4 /*yield*/, createSignature(account, isSafe, task.contents)];
                case 2:
                    signature = _a.sent();
                    return [4 /*yield*/, publicClient.simulateContract({
                            address: contractAddress,
                            abi: abi,
                            functionName: 'respondToTask',
                            args: [task, taskIndex, isSafe, signature],
                            account: account,
                        })];
                case 3:
                    request = (_a.sent()).request;
                    return [4 /*yield*/, walletClient.writeContract(__assign(__assign({}, request), { account: account }))];
                case 4:
                    hash = _a.sent();
                    return [4 /*yield*/, publicClient.waitForTransactionReceipt({ hash: hash })];
                case 5:
                    _a.sent();
                    console.log('Responded to task:', {
                        taskIndex: taskIndex,
                        task: task,
                        isSafe: isSafe,
                        transactionHash: hash
                    });
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error('Error responding to task:', error_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var contractAddress, account, publicClient, walletClient;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    contractAddress = '0x0b6D8B9A2b84F3A40282a99674dA8E388B1eEC28';
                    account = (0, accounts_1.privateKeyToAccount)(OPERATOR_PRIVATE_KEY);
                    publicClient = (0, viem_1.createPublicClient)({
                        chain: chains_1.holesky,
                        transport: (0, viem_1.http)('https://1rpc.io/holesky'),
                    });
                    walletClient = (0, viem_1.createWalletClient)({
                        chain: chains_1.holesky,
                        transport: (0, viem_1.http)('https://1rpc.io/holesky'),
                        account: account,
                    });
                    console.log('Starting to watch for new tasks...');
                    publicClient.watchEvent({
                        address: contractAddress,
                        event: (0, viem_1.parseAbiItem)('event NewTaskCreated(uint32 indexed taskIndex, (string contents, uint32 taskCreatedBlock) task)'),
                        onLogs: function (logs) { return __awaiter(_this, void 0, void 0, function () {
                            var _i, logs_1, log, args, _a, taskIndex, task;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _i = 0, logs_1 = logs;
                                        _b.label = 1;
                                    case 1:
                                        if (!(_i < logs_1.length)) return [3 /*break*/, 4];
                                        log = logs_1[_i];
                                        args = log.args;
                                        if (!args)
                                            return [3 /*break*/, 3];
                                        _a = args, taskIndex = _a.taskIndex, task = _a.task;
                                        console.log('New task detected:', {
                                            taskIndex: Number(taskIndex),
                                            task: task
                                        });
                                        return [4 /*yield*/, respondToTask(walletClient, publicClient, contractAddress, account, task, Number(taskIndex))];
                                    case 2:
                                        _b.sent();
                                        _b.label = 3;
                                    case 3:
                                        _i++;
                                        return [3 /*break*/, 1];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); },
                    });
                    process.on('SIGINT', function () {
                        console.log('Stopping task watcher...');
                        process.exit();
                    });
                    return [4 /*yield*/, new Promise(function () { })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
