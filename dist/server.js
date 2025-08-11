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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const infractionData_usecases_1 = require("./domain/usecases/infractionData.usecases");
const debtData_usecases_1 = require("./domain/usecases/debtData.usecases");
const paymentAgreementData_usecases_1 = require("./domain/usecases/paymentAgreementData.usecases");
const matriculaRequeridaData_usecases_1 = require("./domain/usecases/matriculaRequeridaData.usecases");
const consultarCertificadoSucive_usecases_1 = require("./domain/usecases/consultarCertificadoSucive.usecases");
const emitirCertificadoSucive_usecases_1 = require("./domain/usecases/emitirCertificadoSucive.usecases");
// Load environment variables
dotenv_1.default.config();
// Initialize express app
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from the public directory
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Simple route for testing
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the TypeScript backend API' });
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});
// Endpoint for infractions query
app.post('/api/infractions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        const { matricula, padron, departamento } = req.body.vehicleData;
        const result = yield (0, infractionData_usecases_1.generateAndSaveInfractionData)({ userId }, { matricula, padron, departamento });
        res.json(result);
    }
    catch (error) {
        console.error('Error processing infractions request:', error);
        res.status(500).json({ error: 'Failed to process infractions request' });
    }
}));
// Endpoint for debt query
app.post('/api/debt', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        const { matricula, padron, departamento } = req.body.vehicleData;
        const result = yield (0, debtData_usecases_1.generateAndSaveDebtData)({ userId }, { matricula, padron, departamento });
        res.json(result);
    }
    catch (error) {
        console.error('Error processing debt request:', error);
        res.status(500).json({ error: 'Failed to process debt request' });
    }
}));
// Endpoint for payment agreement query
app.post('/api/payment-agreement', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        const { matricula, padron, departamento } = req.body.vehicleData;
        const result = yield (0, paymentAgreementData_usecases_1.generateAndSavePaymentAgreementData)({ userId }, { matricula, padron, departamento });
        res.json(result);
    }
    catch (error) {
        console.error('Error processing payment agreement request:', error);
        res.status(500).json({ error: 'Failed to process payment agreement request' });
    }
}));
// Endpoint for matriculas requerida query
app.post('/api/matriculas-requeridas', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        const { matricula } = req.body.vehicleData;
        const result = yield (0, matriculaRequeridaData_usecases_1.generateAndSaveMatriculaRequeridaData)({ userId }, { matricula });
        res.json(result);
    }
    catch (error) {
        console.error('Error processing matricula requerida request:', error);
        res.status(500).json({ error: 'Failed to process matricula requerida request' });
    }
}));
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Endpoint for requesting certificado sucive
app.post('/api/solicitar-certificado-sucive', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, vehicleData, requesterData } = req.body;
        const { matricula, padron, departamento } = vehicleData;
        if (!matricula || !padron || !departamento) {
            res.status(400).json({ error: 'Missing required fields: matricula, padron, departamento' });
            return;
        }
        if (!requesterData || !requesterData.fullName || !requesterData.identificationNumber || !requesterData.email || !requesterData.phoneNumber || !requesterData.address) {
            res.status(400).json({ error: 'Missing required requester data: fullName, identificationNumber, email' });
            return;
        }
        const result = yield (0, consultarCertificadoSucive_usecases_1.solicitarCertificadoSuciveUseCase)({ userId }, { vehicleData: { matricula, padron, departamento }, requesterData });
        res.json(result);
    }
    catch (error) {
        console.error('Error requesting certificado sucive:', error);
        res.status(500).json({ error: 'Failed to request certificado sucive' });
    }
}));
// Endpoint for emitir certificado sucive
app.post('/api/emitir-certificado-sucive', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        const { matricula, padron, departamento } = req.body.vehicleData;
        const { requestNumber } = req.body;
        if (!matricula || !padron || !departamento) {
            res.status(400).json({ error: 'Missing required fields: matricula, padron, departamento' });
            return;
        }
        const result = yield (0, emitirCertificadoSucive_usecases_1.emitirCertificadoSuciveDataUseCase)({ userId }, { vehicleData: { matricula, padron, departamento }, requestNumber });
        res.json(result);
    }
    catch (error) {
        console.error('Error requesting certificado sucive:', error);
        res.status(500).json({ error: 'Failed to request certificado sucive' });
    }
}));
// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
// generateAndSaveInfractionData(
//     {
//         userId: '1'
//     },
//     {
//         matricula: 'SBV1469',
//         padron: '902843157',
//         departamento: DepartamentoEnum.MONTEVIDEO
//     }
// ).then(console.log).catch(console.error);
// generateAndSaveDebtData(
//     {
//         userId: '1'
//     },
//     {
//         matricula: 'SBV1469',
//         padron: '902843157',
//         departamento: DepartamentoEnum.MONTEVIDEO
//     }
// ).then(console.log).catch(console.error);
// generateAndSavePaymentAgreementData(
//     {
//         userId: '1'
//     },
//     {
//         matricula: 'SBV1469',
//         padron: '902843157',
//         departamento: DepartamentoEnum.MONTEVIDEO
//     }
// ).then(console.log).catch(console.error);
