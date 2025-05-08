import { DepartamentoEnum } from "../../domain/VehiculeData";

export const getDepartamentoValue = (departamento: DepartamentoEnum): string => {
    const departamentoMap: Record<DepartamentoEnum, string> = {
        [DepartamentoEnum.ARTIGAS]: '0',
        [DepartamentoEnum.CANELONES]: '1',
        [DepartamentoEnum.CERRO_LARGO]: '2',
        [DepartamentoEnum.COLONIA]: '3',
        [DepartamentoEnum.DURAZNO]: '4',
        [DepartamentoEnum.FLORES]: '5',
        [DepartamentoEnum.FLORIDA]: '6',
        [DepartamentoEnum.LAVALLEJA]: '7',
        [DepartamentoEnum.MALDONADO]: '8',
        [DepartamentoEnum.MONTEVIDEO]: '9',
        [DepartamentoEnum.PAYSANDU]: '10',
        [DepartamentoEnum.RIVERA]: '11',
        [DepartamentoEnum.RIO_NEGRO]: '12',
        [DepartamentoEnum.ROCHA]: '13',
        [DepartamentoEnum.SALTO]: '14',
        [DepartamentoEnum.SAN_JOSE]: '15',
        [DepartamentoEnum.SORIANO]: '16',
        [DepartamentoEnum.TACUAREMBO]: '17',
        [DepartamentoEnum.TREINTA_Y_TRES]: '18'
    };

    return departamentoMap[departamento];
};