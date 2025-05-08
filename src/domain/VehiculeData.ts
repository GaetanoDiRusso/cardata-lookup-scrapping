export type VehiculePropertyRegisterData = {
    departamento: DepartamentoEnum;
    matricula: string;
    padron: string;
    codigoNacional: string;
    marca: string;
    modelo: string;
    anio: string;
    color: string;
    tipo: string;
    cilindros: number;
    combustible: string;
    cilindraje: string;
}

export enum DepartamentoEnum {
    ARTIGAS = 'Artigas',
    CANELONES = 'Canelones', 
    CERRO_LARGO = 'Cerro Largo',
    COLONIA = 'Colonia',
    DURAZNO = 'Durazno',
    FLORES = 'Flores',
    FLORIDA = 'Florida',
    LAVALLEJA = 'Lavalleja',
    MALDONADO = 'Maldonado',
    MONTEVIDEO = 'Montevideo',
    PAYSANDU = 'Paysandú',
    RIVERA = 'Rivera',
    RIO_NEGRO = 'Río Negro',
    ROCHA = 'Rocha',
    SALTO = 'Salto',
    SAN_JOSE = 'San José',
    SORIANO = 'Soriano',
    TACUAREMBO = 'Tacuarembó',
    TREINTA_Y_TRES = 'Treinta y Tres'
}
