import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { generateAndSaveInfractionData } from './domain/usecases/infractionData.usecases';
import { generateAndSaveDebtData } from './domain/usecases/debtData.usecases';
import { generateAndSavePaymentAgreementData } from './domain/usecases/paymentAgreementData.usecases';
import { generateAndSaveMatriculaRequeridaData } from './domain/usecases/matriculaRequeridaData.usecases';
import { solicitarCertificadoSuciveUseCase } from './domain/usecases/consultarCertificadoSucive.usecases';
import { emitirCertificadoSuciveDataUseCase } from './domain/usecases/emitirCertificadoSucive.usecases';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Simple route for testing
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to the TypeScript backend API' });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Server is running' });
});

// Endpoint for infractions query
app.post('/api/infractions', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        const { matricula, padron, departamento } = req.body.vehicleData;

        const result = await generateAndSaveInfractionData(
            { userId },
            { matricula, padron, departamento }
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Error processing infractions request:', error);
        res.status(500).json({ error: 'Failed to process infractions request' });
    }
});

// Endpoint for debt query
app.post('/api/debt', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        const { matricula, padron, departamento } = req.body.vehicleData;

        const result = await generateAndSaveDebtData(
            { userId },
            { matricula, padron, departamento }
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Error processing debt request:', error);
        res.status(500).json({ error: 'Failed to process debt request' });
    }
});

// Endpoint for payment agreement query
app.post('/api/payment-agreement', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        const { matricula, padron, departamento } = req.body.vehicleData;

        const result = await generateAndSavePaymentAgreementData(
            { userId },
            { matricula, padron, departamento }
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Error processing payment agreement request:', error);
        res.status(500).json({ error: 'Failed to process payment agreement request' });
    }
});


// Endpoint for matriculas requerida query
app.post('/api/matriculas-requeridas', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        const { matricula } = req.body.vehicleData;

        const result = await generateAndSaveMatriculaRequeridaData(
            { userId },
            { matricula }
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Error processing matricula requerida request:', error);
        res.status(500).json({ error: 'Failed to process matricula requerida request' });
    }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Endpoint for requesting certificado sucive
app.post('/api/solicitar-certificado-sucive', async (req: Request, res: Response) => {
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

        const result = await solicitarCertificadoSuciveUseCase(
            { userId },
            { vehicleData: { matricula, padron, departamento }, requesterData }
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Error requesting certificado sucive:', error);
        res.status(500).json({ error: 'Failed to request certificado sucive' });
    }
});


// Endpoint for emitir certificado sucive
app.post('/api/emitir-certificado-sucive', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        const { matricula, padron, departamento } = req.body.vehicleData;
        const { requestNumber } = req.body;

        if (!matricula || !padron || !departamento) {
            res.status(400).json({ error: 'Missing required fields: matricula, padron, departamento' });
            return;
        }



        const result = await emitirCertificadoSuciveDataUseCase(
            { userId },
            { vehicleData: { matricula, padron, departamento }, requestNumber }
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Error requesting certificado sucive:', error);
        res.status(500).json({ error: 'Failed to request certificado sucive' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;