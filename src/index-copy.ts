import { generateAndSaveInfractionData } from './domain/usecases/infractionData.usecases';
import { generateAndSaveDebtData } from './domain/usecases/debtData.usecases';
import { generateAndSavePaymentAgreementData } from './domain/usecases/paymentAgreementData.usecases';
import { generateAndSaveMatriculaRequeridaData } from './domain/usecases/matriculaRequeridaData.usecases';
import { solicitarCertificadoSuciveUseCase } from './domain/usecases/consultarCertificadoSucive.usecases';
import { emitirCertificadoSuciveDataUseCase } from './domain/usecases/emitirCertificadoSucive.usecases';

export const handler = async (event: any) => {
    const parsedBody = JSON.parse(event.body);
    const { action, bodyData } = parsedBody;

    if (!action) {
        return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Action is required' }) };
    }

    switch (action) {
        case 'scrapeSuciveMultas':
            return await scrapeSuciveMultas(bodyData);
        case 'scrapeSuciveDebt':
            return await scrapeSuciveDebt(bodyData);
        case 'scrapeSucivePaymentAgreement':
            return await scrapeSucivePaymentAgreement(bodyData);
        case 'scrapeSuciveMatriculaRequerida':
            return await scrapeSuciveMatriculaRequerida(bodyData);
        case 'scrapeSuciveCertificadoSucive':
            return await scrapeSuciveCertificadoSucive(bodyData);
        case 'scrapeSuciveEmitirCertificadoSucive':
            return await scrapeSuciveEmitirCertificadoSucive(bodyData);
        default:
            return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid action' }) };
    }
};

const scrapeSuciveMultas = async (bodyData: any) => {
    try {
        const { userId } = bodyData;
        const { matricula, padron, departamento } = bodyData.vehicleData;

        const result = await generateAndSaveInfractionData(
            { userId },
            { matricula, padron, departamento }
        );

        return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: true, data: result }) };
    } catch (error) {
        console.error('Error processing infractions request:', error);
        return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Failed to process infractions request' }) };
    }
};

// Endpoint for debt query
const scrapeSuciveDebt = async (bodyData: any) => {
    try {
        const { userId } = bodyData;
        const { matricula, padron, departamento } = bodyData.vehicleData;

        const result = await generateAndSaveDebtData(
            { userId },
            { matricula, padron, departamento }
        );

        return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: true, data: result }) };
    } catch (error) {
        console.error('Error processing debt request:', error);
        return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Failed to process debt request' }) };
    }
};

// Endpoint for payment agreement query
const scrapeSucivePaymentAgreement = async (bodyData: any) => {
    try {
        const { userId } = bodyData;
        const { matricula, padron, departamento } = bodyData.vehicleData;

        const result = await generateAndSavePaymentAgreementData(
            { userId },
            { matricula, padron, departamento }
        );

        return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: true, data: result }) };
    } catch (error) {
        console.error('Error processing payment agreement request:', error);
        return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Failed to process payment agreement request' }) };
    }
};


// Endpoint for matriculas requerida query
const scrapeSuciveMatriculaRequerida = async (bodyData: any) => {
    try {
        const { userId } = bodyData;
        const { matricula } = bodyData.vehicleData;

        const result = await generateAndSaveMatriculaRequeridaData(
            { userId },
            { matricula }
        );

        return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: true, data: result }) };
    } catch (error) {
        console.error('Error processing matricula requerida request:', error);
        return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Failed to process matricula requerida request' }) };
    }
};

// Endpoint for requesting certificado sucive
const scrapeSuciveCertificadoSucive = async (bodyData: any) => {
    try {
        const { userId, vehicleData, requesterData } = bodyData;
        const { matricula, padron, departamento } = vehicleData;

        if (!matricula || !padron || !departamento) {
            return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required fields: matricula, padron, departamento' }) };
        }

        if (!requesterData || !requesterData.fullName || !requesterData.identificationNumber || !requesterData.email || !requesterData.phoneNumber || !requesterData.address) {
            return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required requester data: fullName, identificationNumber, email' }) };
        }

        const result = await solicitarCertificadoSuciveUseCase(
            { userId },
            { vehicleData: { matricula, padron, departamento }, requesterData }
        );

        return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: true, data: result }) };
    } catch (error) {
        console.error('Error requesting certificado sucive:', error);
        return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Failed to request certificado sucive' }) };
    }
};


// Endpoint for emitir certificado sucive
const scrapeSuciveEmitirCertificadoSucive = async (bodyData: any) => {
    try {
        const { userId } = bodyData;
        const { matricula, padron, departamento } = bodyData.vehicleData;
        const { requestNumber } = bodyData;

        if (!matricula || !padron || !departamento) {
            return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required fields: matricula, padron, departamento' }) };
        }



        const result = await emitirCertificadoSuciveDataUseCase(
            { userId },
            { vehicleData: { matricula, padron, departamento }, requestNumber }
        );

        return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: true, data: result }) };
    } catch (error) {
        console.error('Error requesting certificado sucive:', error);
        return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Failed to request certificado sucive' }) };
    }
};