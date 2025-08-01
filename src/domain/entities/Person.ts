export class Person {
    constructor(
        readonly id: string,
        readonly name: string,
        readonly email: string,
        readonly identificationNumber: string,
        readonly dateOfBirth: string,
    ) {}
}

export class PersonPrev {
    constructor(
        readonly id: string,
        readonly name: string,
    ) {}
}
